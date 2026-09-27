#pragma once
#include <imgui.h>
#ifndef Style_H
#define Style_H

class Style {
public:
    inline static void loadStyle()
    {
        ImGuiStyle& s = ImGui::GetStyle();
        s.WindowPadding = ImVec2(22, 18);
        s.FramePadding = ImVec2(10, 8);
        s.ItemSpacing = ImVec2(12, 12);
        s.ItemInnerSpacing = ImVec2(8, 6);
        s.WindowRounding = 10.0f;
        s.ChildRounding = 8.0f;
        s.FrameRounding = 6.0f;
        s.PopupRounding = 6.0f;
        s.ScrollbarRounding = 8.0f;
        s.GrabRounding = 6.0f;
        s.TabRounding = 6.0f;
        s.WindowBorderSize = 1.0f;
        s.ChildBorderSize = 1.0f;
        s.FrameBorderSize = 1.0f;
        s.WindowTitleAlign = ImVec2(0.0f, 0.5f);

        ImVec4* c = s.Colors;
        c[ImGuiCol_Text] = ImVec4(0.93f, 0.94f, 0.97f, 1.0f);
        c[ImGuiCol_TextDisabled] = ImVec4(0.48f, 0.51f, 0.58f, 1.0f);
        c[ImGuiCol_WindowBg] = ImVec4(0.055f, 0.065f, 0.085f, 1.0f);
        c[ImGuiCol_ChildBg] = ImVec4(0.075f, 0.085f, 0.11f, 1.0f);
        c[ImGuiCol_PopupBg] = ImVec4(0.08f, 0.09f, 0.12f, 0.98f);
        c[ImGuiCol_Border] = ImVec4(0.16f, 0.19f, 0.24f, 1.0f);
        c[ImGuiCol_FrameBg] = ImVec4(0.10f, 0.115f, 0.15f, 1.0f);
        c[ImGuiCol_FrameBgHovered] = ImVec4(0.15f, 0.17f, 0.22f, 1.0f);
        c[ImGuiCol_FrameBgActive] = ImVec4(0.19f, 0.21f, 0.27f, 1.0f);
        c[ImGuiCol_Button] = ImVec4(0.12f, 0.14f, 0.18f, 1.0f);
        c[ImGuiCol_ButtonHovered] = ImVec4(0.85f, 0.16f, 0.20f, 1.0f);
        c[ImGuiCol_ButtonActive] = ImVec4(0.65f, 0.08f, 0.12f, 1.0f);
        c[ImGuiCol_Header] = ImVec4(0.13f, 0.15f, 0.20f, 1.0f);
        c[ImGuiCol_HeaderHovered] = ImVec4(0.85f, 0.16f, 0.20f, 0.75f);
        c[ImGuiCol_HeaderActive] = ImVec4(0.85f, 0.16f, 0.20f, 1.0f);
        c[ImGuiCol_Tab] = ImVec4(0.10f, 0.12f, 0.16f, 1.0f);
        c[ImGuiCol_TabHovered] = ImVec4(0.85f, 0.16f, 0.20f, 0.8f);
        c[ImGuiCol_TabActive] = ImVec4(0.85f, 0.16f, 0.20f, 1.0f);
        c[ImGuiCol_SliderGrab] = ImVec4(0.95f, 0.22f, 0.26f, 1.0f);
        c[ImGuiCol_SliderGrabActive] = ImVec4(1.0f, 0.35f, 0.38f, 1.0f);
        c[ImGuiCol_CheckMark] = ImVec4(0.95f, 0.22f, 0.26f, 1.0f);
    }
};
#endif
