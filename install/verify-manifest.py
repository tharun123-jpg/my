#!/usr/bin/env python3
"""Verify hyper-suite-x/CSXS/manifest.xml is a loadable CEP panel manifest.

Checks the structural facts the CEP loader (AfterFX CEP runtime) relies on:
  * root element is <ExtensionManifest> with Version/ExtensionBundleId
  * ExtensionList Id == DispatchInfoList Extension Id
  * HostList contains Host Name="AEFT" with a version range covering the host
  * RequiredRuntime CSXS present
  * Resources MainPath / ScriptPath point at files that actually exist
  * UI has a non-empty <Menu> (this is the Window > Extensions entry) and Type Panel

Usage: verify-manifest.py <manifest.xml> <extension-root-dir>
Also cross-checks install/fix-not-showing-windows.bat's embedded base64
payload decodes byte-identical to the manifest (when run from repo root).
"""
import base64
import os
import re
import sys
import xml.etree.ElementTree as ET

fails = []


def check(cond, ok_msg, bad_msg):
    if cond:
        print("  ok  -", ok_msg)
    else:
        print("  FAIL-", bad_msg)
        fails.append(bad_msg)


def main(manifest_path, ext_root):
    print("== parsing", manifest_path)
    tree = ET.parse(manifest_path)  # raises if not well-formed XML
    root = tree.getroot()
    check(root.tag == "ExtensionManifest",
          "root element is <ExtensionManifest>",
          "root element is <%s>, CEP requires <ExtensionManifest>" % root.tag)
    check(bool(root.get("Version")), "manifest has Version attr (%s)" % root.get("Version"),
          "manifest missing Version attr")
    check(bool(root.get("ExtensionBundleId")),
          "manifest has ExtensionBundleId (%s)" % root.get("ExtensionBundleId"),
          "manifest missing ExtensionBundleId")

    list_ids = [e.get("Id") for e in root.findall("./ExtensionList/Extension")]
    disp_ids = [e.get("Id") for e in root.findall("./DispatchInfoList/Extension")]
    check(list_ids and list_ids == disp_ids,
          "ExtensionList ids == DispatchInfoList ids (%s)" % list_ids,
          "Extension/DispatchInfo id mismatch: %s vs %s" % (list_ids, disp_ids))

    hosts = root.findall("./ExecutionEnvironment/HostList/Host")
    aeft = [h for h in hosts if h.get("Name") == "AEFT"]
    check(bool(aeft), "HostList declares Host Name=AEFT (range %s)"
          % (aeft[0].get("Version") if aeft else None),
          "no <Host Name=\"AEFT\"> in HostList - AE will ignore the bundle")
    if aeft:
        vr = aeft[0].get("Version") or ""
        m = re.match(r"\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]", vr)
        check(bool(m) and float(m.group(1)) <= 23.0 <= float(m.group(2)),
              "AEFT version range %s covers AE 2023 (23.x)" % vr,
              "AEFT version range %s does not cover 23.x" % vr)

    rr = root.findall("./ExecutionEnvironment/RequiredRuntimeList/RequiredRuntime")
    check(any(r.get("Name") == "CSXS" for r in rr),
          "RequiredRuntime CSXS present", "RequiredRuntime CSXS missing")

    for ext in root.findall("./DispatchInfoList/Extension"):
        d = ext.find("./DispatchInfo")
        if d is None:
            check(False, "", "Extension %s has no <DispatchInfo>" % ext.get("Id"))
            continue
        for tag in ("MainPath", "ScriptPath"):
            el = d.find("./Resources/%s" % tag)
            if el is None or not (el.text or "").strip():
                if tag == "MainPath":
                    check(False, "", "Resources/MainPath missing - panel has no page")
                continue
            rel = el.text.strip().replace("\\", "/")
            fp = os.path.normpath(os.path.join(ext_root, rel))
            check(os.path.isfile(fp), "%s resolves to existing file (%s)" % (tag, rel),
                  "%s -> %s does not exist" % (tag, fp))
        menu = d.find("./UI/Menu")
        check(menu is not None and (menu.text or "").strip(),
              "UI/Menu present: '%s' (this creates the Window > Extensions entry)"
              % (menu.text.strip() if menu is not None else ""),
              "UI/Menu missing - nothing would appear under Window > Extensions")
        ut = d.find("./UI/Type")
        check(ut is not None and ut.text.strip() == "Panel",
              "UI/Type is Panel", "UI/Type missing or not Panel")

    # bat payload round-trip (manifest lives at <root>/hyper-suite-x/CSXS/manifest.xml)
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(manifest_path))))
    bat = os.path.join(repo_root, "install", "fix-not-showing-windows.bat")
    if os.path.isfile(bat):
        txt = open(bat, encoding="utf-8", errors="replace").read()
        m = re.search(r"FromBase64String\('([A-Za-z0-9+/=]+)'\)", txt)
        if m:
            dec = base64.b64decode(m.group(1))
            orig = open(manifest_path, "rb").read()
            check(dec == orig, "bat embedded base64 decodes byte-identical to manifest",
                  "bat embedded base64 DIFFERS from manifest (%d vs %d bytes)"
                  % (len(dec), len(orig)))
        else:
            check(False, "", "no base64 payload found in fix-not-showing-windows.bat")

    print("== RESULT:", "PASS" if not fails else "FAIL (%d)" % len(fails))
    return 1 if fails else 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2]))
