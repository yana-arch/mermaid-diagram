# 🎨 Mermaid Diagram Studio: Premium Adaptive Canvas & AI Copilot

## 🎯 Problem Statement
> **"How Might We combine a premium interactive multitheme canvas with an unobtrusive inline AI Copilot panel to create a frictionless, stunning, and highly productive Mermaid editing experience?"**

---

## 🚀 Recommended Direction
We will transform the current interface into a full-fledged **"Diagram Studio"** focusing on three core design pillars:
1. **AI Copilot Side-Panel (Unobtrusive Companion):** Replace the current fullscreen modal popup (`app-ai-modal`) with a sleek, responsive, and collapsible side-panel on the right side of the screen (collapsing into an elegant bottom drawer on mobile). This panel dynamically inherits the selected theme variables (`--bg-secondary`, `--border-color`, `--text-main`) for seamless visual continuity.
2. **Visual Code Diff Viewer (Safe Inline Merge):** When the AI Copilot suggests or refines a diagram, the changes will not overwrite the editor immediately. Instead, a lightweight inline line-by-line diff comparison overlay will appear:
    * Removed lines styled with a soft red background.
    * Added lines styled with a soft green background.
    * The user can click **"Accept"** to apply the code securely or **"Discard"** to decline.
3. **Adaptive Canvas Glass HUD & Shimmer Overlay (High-end Micro-interactions):**
    * Redesign the viewport zoom/pan HUD controls into a stunning glassmorphic interface that floats cleanly over the canvas.
    * During rendering (`isRendering`), replace the basic "Wait..." status text with a modern **Shimmering Glass** scanline running across the canvas, indicating active rendering.

---

## 🛠️ MVP Scope

### 📌 What's In
* **AI Side-Panel UI:** A three-column grid layout on desktop (`Editor | Preview | AI Copilot`) with flexible toggle states.
* **Lightweight Diff Engine:** A custom, performant, library-free Angular component to compare strings line-by-line and colorize modifications.
* **Premium HUD Viewport Controls:** Redesigned floating dashboard overlay controls adapting natively to the dynamic dark/light themes.
* **Shimmer Render Animation:** Smooth CSS-animated translucent shimmer layer that flows over the diagram when the compilation runs.

### 🚫 What's Out & Why
* **Bi-directional Node-to-Code Selection:** Postponed due to complex DOM parsing dependencies on Mermaid SVG outputs.
* **Chat History Persistence:** Kept in-memory for the current session to ensure a lightweight and rapid first-release.
* **Partial Line Merges:** Diff merges will be all-or-nothing (Accept/Discard) to avoid UI bloat.

---

## ⚠️ Key Assumptions to Validate
* [ ] **Assumption 1 (Layout Cramping):** Will a 3-column layout feel too cramped on standard desktop screens (>=1280px)?
    * *Validation Strategy:* Implement a smart default width for the AI panel (~320px) with responsive collapsing behavior that dynamically resizes the main workspace grid.
* [ ] **Assumption 2 (Mobile Performance):** Will `backdrop-blur` and custom CSS animation states lag the Capacitor WebView on legacy Android devices?
    * *Validation Strategy:* Rely strictly on hardware-accelerated transitions (using `transform` and `opacity` keyframes) rather than layout-triggering properties.
* [ ] **Assumption 3 (Diff Consistency):** Will a simple line-by-line diff display accurately when multiple non-contiguous segments of the diagram change?
    * *Validation Strategy:* Develop and validate a custom LCS (Longest Common Subsequence) helper in TypeScript.

---

## 🚫 Not Doing
* **Visual Drag-and-Drop Editor:** *Reason:* Mermaid is inherently a code-first markdown drawing library. Forcing absolute-position node editing is out of scope and changes the core nature of the tool.

---

## ❓ Open Questions
1. Should the AI Copilot slide-panel slide out from the right (covering the Preview area) or the left (adjacent to the Editor) for the most ergonomic workspace flow?
2. Should the existing "Refine" button in the editor toolbar instantly open the new AI Copilot panel and pre-inject the current diagram as context?
