#pragma once
#ifndef MENU_HPP
#define MENU_HPP

#define IMGUI_DISABLE_OBSOLETE_FUNCTIONS
#include <imgui.h>
#include "../render/Graphics.hpp"
#include "../settings/Settings.h"
#include "../utils/Keys.hpp"
#include "../utils/Keybind.hpp"

class Menu
{
public:
    HotKey key_trigger;
    HotKey key_fire;

    Menu() : key_trigger{}, key_fire{} {}

    void Draw()
    {
        ImGuiIO& io = ImGui::GetIO();
        ImGui::SetNextWindowPos(ImVec2(0, 0));
        ImGui::SetNextWindowSize(io.DisplaySize);
        ImGui::Begin("VOID", nullptr,
            ImGuiWindowFlags_NoBringToFrontOnFocus | ImGuiWindowFlags_NoCollapse |
            ImGuiWindowFlags_NoDecoration | ImGuiWindowFlags_NoMove |
            ImGuiWindowFlags_NoResize | ImGuiWindowFlags_NoTitleBar | ImGuiWindowFlags_NoNav);

        // Header, matching the reference layout.
        ImGui::TextColored(ImVec4(0.95f, 0.22f, 0.26f, 1.0f), "VOID");
        ImGui::SameLine();
        ImGui::TextDisabled("CONTROL PANEL");
        ImGui::SameLine(ImGui::GetWindowWidth() - 110.0f);
        ImGui::TextColored(ImVec4(0.45f, 0.85f, 0.58f, 1.0f), "● ONLINE");
        ImGui::Separator();
        ImGui::Spacing();

        // Left navigation rail. Modules are selectable and ready for future features.
        static int activeModule = 0;
        ImGui::BeginChild("Navigation", ImVec2(142, 0), true);
        auto moduleButton = [&](const char* label, int id) {
            bool selected = activeModule == id;
            if (selected) ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0.85f, 0.16f, 0.20f, 0.85f));
            bool clicked = ImGui::Button(label, ImVec2(-1, 34));
            if (selected) ImGui::PopStyleColor();
            if (clicked) activeModule = id;
        };
        ImGui::TextColored(ImVec4(0.95f, 0.22f, 0.26f, 1.0f), "AIMBOT");
        ImGui::Spacing();
        moduleButton("[+]  General", 8);
        moduleButton("o    Targeting", 9);
        moduleButton("o    Humanization", 10);
        ImGui::Spacing();
        ImGui::TextColored(ImVec4(0.95f, 0.22f, 0.26f, 1.0f), "TRIGGER");
        ImGui::Spacing();
        moduleButton("[+]  General", 0);
        moduleButton("o    Scan area", 1);
        moduleButton("o    Detection", 2);
        ImGui::Spacing();
        ImGui::TextColored(ImVec4(0.95f, 0.22f, 0.26f, 1.0f), "VISUALS");
        ImGui::Spacing();
        moduleButton("o    Players", 3);
        moduleButton("o    World", 4);
        moduleButton("o    Colors", 5);
        ImGui::Spacing();
        ImGui::TextColored(ImVec4(0.95f, 0.22f, 0.26f, 1.0f), "MISC");
        ImGui::Spacing();
        moduleButton("*    Keybinds", 6);
        moduleButton("*    Configs", 7);
        ImGui::Dummy(ImVec2(0, 35));
        ImGui::Separator();
        ImGui::TextDisabled("VOID client");
        ImGui::TextDisabled("build 1.0.0");
        ImGui::EndChild();

        ImGui::SameLine();
        ImGui::BeginChild("Content", ImVec2(0, 0), false);
        const char* moduleNames[] = { "GENERAL", "SCAN AREA", "DETECTION", "PLAYERS", "WORLD", "COLORS", "KEYBINDS", "CONFIGS", "AIMBOT", "TARGETING", "HUMANIZATION" };
        ImGui::Text("%s", moduleNames[activeModule]);
        ImGui::TextDisabled("Triggerbot module controls and configuration");
        ImGui::Spacing();

        if (activeModule == 3) {
            static bool espEnabled = true, showAllies = false, agentName = true, weapon = true, rank = true, distance = true, damage = true;
            static float maxDistance = 250.0f, fontScale = 1.0f;
            ImGui::BeginChild("PlayersCard", ImVec2(0, 285), true);
            ImGui::TextColored(ImVec4(0.95f, 0.22f, 0.26f, 1.0f), "PLAYER ESP");
            ImGui::Separator();
            ImGui::Checkbox("Enabled", &espEnabled);
            ImGui::Checkbox("Show allies", &showAllies);
            ImGui::Text("Max distance"); ImGui::SameLine(150); ImGui::SetNextItemWidth(-1);
            ImGui::SliderFloat("##distance", &maxDistance, 50.0f, 1000.0f, "%.0f m");
            ImGui::Text("Font scale"); ImGui::SameLine(150); ImGui::SetNextItemWidth(-1);
            ImGui::SliderFloat("##fontscale", &fontScale, 0.5f, 2.0f, "%.1fx");
            ImGui::Spacing();
            ImGui::TextColored(ImVec4(0.95f, 0.22f, 0.26f, 1.0f), "INFO");
            ImGui::Separator();
            ImGui::Checkbox("Agent name", &agentName);
            ImGui::Checkbox("Weapon display", &weapon);
            ImGui::Checkbox("Rank display", &rank);
            ImGui::Checkbox("Distance", &distance);
            ImGui::Checkbox("Damage numbers", &damage);
            ImGui::EndChild();
            ImGui::Spacing();
        }
        if (activeModule >= 8) {
            static bool enabled = false, holdMode = true, visibleOnly = true;
            static int aimKey = 0, targetBone = 0;
            static float smoothing = 5.5f, fov = 48.0f;
            ImGui::BeginChild("AimbotCard", ImVec2(0, 245), true);
            ImGui::TextColored(ImVec4(0.95f, 0.22f, 0.26f, 1.0f), "AIMBOT SETTINGS");
            ImGui::Separator();
            ImGui::Checkbox("Enabled", &enabled);
            ImGui::Checkbox("Hold mode", &holdMode);
            ImGui::Checkbox("Visible only", &visibleOnly);
            ImGui::Text("Aim key"); ImGui::SameLine(150); ImGui::SetNextItemWidth(-1);
            ImGui::Combo("##aimkey", &aimKey, "Shift\\0Mouse 1\\0Mouse 2\\0");
            ImGui::Text("Target bone"); ImGui::SameLine(150); ImGui::SetNextItemWidth(-1);
            ImGui::Combo("##bone", &targetBone, "Head\\0Neck\\0Chest\\0");
            ImGui::Text("Smoothing"); ImGui::SameLine(150); ImGui::SetNextItemWidth(-1);
            ImGui::SliderFloat("##smooth", &smoothing, 1.0f, 20.0f, "%.1f");
            ImGui::Text("FOV"); ImGui::SameLine(150); ImGui::SetNextItemWidth(-1);
            ImGui::SliderFloat("##fov", &fov, 1.0f, 180.0f, "%.0f px");
            ImGui::EndChild();
            ImGui::Spacing();
        }
        ImGui::BeginChild("MainCard", ImVec2(0, 180), true);
        ImGui::TextColored(ImVec4(0.95f, 0.22f, 0.26f, 1.0f), "GENERAL");
        ImGui::Separator();
        ImGui::Text("Scan width"); ImGui::SameLine(150); ImGui::SetNextItemWidth(-1);
        ImGui::SliderInt("##width", &Settings::triggerWidth, 0, 20, "%d px");
        ImGui::Text("Scan height"); ImGui::SameLine(150); ImGui::SetNextItemWidth(-1);
        ImGui::SliderInt("##height", &Settings::triggerHeight, 0, 20, "%d px");
        ImGui::Text("Reaction delay"); ImGui::SameLine(150); ImGui::SetNextItemWidth(-1);
        ImGui::SliderInt("##delay", &Settings::triggerDelay, 0, 1000, "%d ms");
        ImGui::EndChild();

        ImGui::Spacing();
        ImGui::BeginChild("DetectionCard", ImVec2(0, 150), true);
        ImGui::TextColored(ImVec4(0.95f, 0.22f, 0.26f, 1.0f), "DETECTION");
        ImGui::Separator();
        ImGui::Text("Color tolerance"); ImGui::SameLine(150); ImGui::SetNextItemWidth(-1);
        ImGui::SliderInt2("##tolerance", Settings::triggerTension, 1, 100, "%d");
        ImGui::Text("Outline color"); ImGui::SameLine(150);
        const char* colors[] = { "NONE", "PURPLE", "RED", "YELLOW" };
        static int selectedColor = 1;
        ImGui::SetNextItemWidth(-1);
        if (ImGui::Combo("##color", &selectedColor, colors, IM_ARRAYSIZE(colors))) {
            if (selectedColor == 1) Settings::triggerColor = Color::ColorName::Magenta;
            if (selectedColor == 2) Settings::triggerColor = Color::ColorName::Vermelho;
            if (selectedColor == 3) Settings::triggerColor = Color::ColorName::Amarelo;
        }
        ImGui::EndChild();
        ImGui::EndChild();

        ImGui::End();
    }
};
#endif
