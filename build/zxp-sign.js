/* zxp-sign.js — build a signed .zxp (CEP extension) on any platform.
   Produces a JAR-style code signature (MANIFEST.MF + CODE.SF + CERT.RSA)
   with a self-signed certificate, exactly like ZXPSignCmd output. */
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = process.argv[2] || path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "hyper-suite-x");
const OUT = path.join(ROOT, "dist");
const TOOLS = path.join(ROOT, "build", "signing");

/* ---------- 1. key + self-signed cert ---------- */
let keyPem = null, certDer = null;
try {
  keyPem = fs.readFileSync(path.join(TOOLS, "hsx-key.pem"), "utf8");
  certDer = fs.readFileSync(path.join(TOOLS, "hsx-cert.der"));
} catch (e) {
  execSync(`openssl req -x509 -newkey rsa:2048 -keyout ${TOOLS}/hsx-key.pem -out ${TOOLS}/hsx-cert.pem -days 3650 -nodes -subj "/CN=Hyper Suite X/O=HyperSuite/C=SG"`, { stdio: "inherit" });
  execSync(`openssl x509 -in ${TOOLS}/hsx-cert.pem -outform DER -out ${TOOLS}/hsx-cert.der`, { stdio: "inherit" });
  keyPem = fs.readFileSync(path.join(TOOLS, "hsx-key.pem"), "utf8");
  certDer = fs.readFileSync(path.join(TOOLS, "hsx-cert.der"));
}

/* ---------- 2. minimal DER ---------- */
function derLen(n) {
  if (n < 128) return Buffer.from([n]);
  const bytes = [];
  while (n > 0) { bytes.unshift(n & 0xFF); n >>>= 8; }
  return Buffer.concat([Buffer.from([0x80 | bytes.length]), Buffer.from(bytes)]);
}
function tlv(tag, content) { return Buffer.concat([Buffer.from([tag]), derLen(content.length), content]); }
function derInt(big) {
  let hex = BigInt(big).toString(16);
  if (hex.length % 2) hex = "0" + hex;
  let b = Buffer.from(hex, "hex");
  if (b[0] & 0x80) b = Buffer.concat([Buffer.from([0]), b]);
  return tlv(0x02, b);
}
function derOid(str) {
  const parts = str.split(".").map(Number);
  const out = [40 * parts[0] + parts[1]];
  for (let i = 2; i < parts.length; i++) {
    let v = parts[i]; const stack = [v & 0x7F];
    v = Math.floor(v / 128);
    while (v > 0) { stack.push(0x80 | (v & 0x7F)); v = Math.floor(v / 128); }
    for (let j = stack.length - 1; j >= 0; j--) out.push(stack[j]);
  }
  return tlv(0x06, Buffer.from(out));
}
const OID = {
  data: "1.2.840.113549.1.7.1",
  signedData: "1.2.840.113549.1.7.2",
  sha256: "2.16.840.1.101.3.4.2.1",
  sha256WithRSA: "1.2.840.113549.1.1.11",
  contentType: "1.2.840.113549.1.9.3",
  messageDigest: "1.2.840.113549.1.9.4" // (1.9.5 is signingTime!)
};
function digestAlg(oid) { return tlv(0x30, Buffer.concat([derOid(oid), Buffer.from([0x05, 0x00])])); }
function readTlv(buf, i) {
  const tag = buf[i]; i += 1;
  let len = buf[i]; i += 1;
  if (len & 0x80) {
    const n = len & 0x7F;
    len = 0;
    for (let k = 0; k < n; k++) len = (len << 8) | buf[i + k];
    i += n;
  }
  return { tag, content: buf.slice(i, i + len), next: i + len };
}
function parseCert(cert) {
  const tbs = readTlv(readTlv(cert, 0).content, 0);
  let i = 0;
  const first = readTlv(tbs.content, 0);
  if (first.tag === 0xA0) i = first.next;
  const ser = readTlv(tbs.content, i);
  const sigAlg = readTlv(tbs.content, ser.next);
  const issuer = readTlv(tbs.content, sigAlg.next);
  // full Name SEQUENCE encoding (tag + length + content)
  const issuerFull = Buffer.concat([Buffer.from([0x30]), derLen(issuer.content.length), issuer.content]);
  return { serial: ser.content, issuer: issuerFull };
}

/* ---------- 3. PKCS#7 ---------- */
function buildPkcs7(content, cert, privKey) {
  const { serial, issuer } = parseCert(cert);
  const contentInfo = tlv(0x30, Buffer.concat([derOid(OID.data), tlv(0xA0, tlv(0x04, content))]));
  const digAlgSet = tlv(0x31, digestAlg(OID.sha256));
  // OpenSSL layout (matches `openssl crl2pkcs7` reference): certificates [0] IMPLICIT — [0] directly wraps the cert(s)
  const certSet = tlv(0xA0, cert);
  const contentTypeAttr = tlv(0x30, Buffer.concat([derOid(OID.contentType), tlv(0x31, derOid(OID.data))]));
  const md = crypto.createHash("sha256").update(content).digest();
  const mdAttr = tlv(0x30, Buffer.concat([derOid(OID.messageDigest), tlv(0x31, tlv(0x04, md))]));
  // signedAttrs [0] IMPLICIT SET OF Attribute — attributes sit directly under [0]
  const signedAttrs = tlv(0xA0, Buffer.concat([contentTypeAttr, mdAttr]));
  const sig = crypto.createSign("RSA-SHA256").update(signedAttrs).sign(privKey);
  const signerInfo = tlv(0x30, Buffer.concat([
    derInt(1),
    tlv(0x30, Buffer.concat([issuer, derInt(BigInt("0x" + serial.toString("hex")))])),
    digestAlg(OID.sha256),
    signedAttrs,
    digestAlg(OID.sha256WithRSA),
    tlv(0x03, Buffer.concat([Buffer.from([0x00]), sig]))
  ]));
  const signedData = tlv(0x30, Buffer.concat([derInt(1), digAlgSet, contentInfo, certSet, tlv(0x31, signerInfo)]));
  return tlv(0x30, Buffer.concat([derOid(OID.signedData), tlv(0xA0, signedData)]));
}

/* ---------- 4. zip (stored entries) ---------- */
const crcTable = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function makeZip(entries) {
  const now = new Date();
  const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
  const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
  let offset = 0;
  const locals = [], central = [];
  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, "utf8");
    const crc = crc32(e.data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(0, 8);
    lh.writeUInt16LE(dosTime, 10);
    lh.writeUInt16LE(dosDate, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(e.data.length, 18);
    lh.writeUInt32LE(e.data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    locals.push(Buffer.concat([lh, nameBuf, e.data]));
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0, 8);
    ch.writeUInt16LE(0, 10);
    ch.writeUInt16LE(dosTime, 12);
    ch.writeUInt16LE(dosDate, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(e.data.length, 20);
    ch.writeUInt32LE(e.data.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt32LE(0, 38);
    ch.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([ch, nameBuf]));
    offset += 30 + nameBuf.length + e.data.length;
  }
  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, eocd]);
}

/* ---------- 5. collect extension files ---------- */
function walk(dir, base, out) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    const rel = path.relative(base, p).split(path.sep).join("/");
    if (st.isDirectory()) walk(p, base, out);
    else out.push({ name: rel, data: fs.readFileSync(p) });
  }
  return out;
}
const files = walk(SRC, SRC, []).sort((a, b) => a.name.localeCompare(b.name));

const manifest =
  "Manifest-Version: 1.0\r\n" +
  "Extension: Hyper Suite X\r\n" +
  "ManifestVersion: 2.0\r\n" +
  "ID: com.hyper.suite-x\r\n" +
  "Version: 2.1.0\r\n" +
  "Priority: 500\r\n" +
  "StartupAsLateStartup: false\r\n" +
  "Icon:\r\n" +
  "UseSharedRuntimePathInWindows: true\r\n" +
  "\r\n";

const entries = [...files, { name: "META-INF/MANIFEST.MF", data: Buffer.from(manifest, "utf8") }];

/* CODE.SF */
const sfMain = "Signature-Version: 1.0\r\n" +
  "SHA-256-Digest-Manifest: " + crypto.createHash("sha256").update(entries[entries.length - 1].data).digest("base64") + "\r\n\r\n";
let sfBody = "";
for (let i = 0; i < entries.length; i++) {
  sfBody += "Name: " + entries[i].name + "\r\n" +
    "SHA-256-Digest: " + crypto.createHash("sha256").update(entries[i].data).digest("base64") + "\r\n\r\n";
}
const codeSf = Buffer.from(sfMain + sfBody, "utf8");
entries.push({ name: "META-INF/CODE.SF", data: codeSf });

/* CERT.RSA */
const certRsa = buildPkcs7(codeSf, certDer, keyPem);
entries.push({ name: "META-INF/CERT.RSA", data: certRsa });

fs.mkdirSync(OUT, { recursive: true });
const zxp = makeZip(entries);
const outName = path.join(OUT, "HyperSuiteX_v2.1.0.zxp");
fs.writeFileSync(outName, zxp);
console.log("WROTE", outName, zxp.length, "bytes,", entries.length, "entries");
