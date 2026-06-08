# Design Decisions: FGC Industrial Wiki Redesign

This document records the architectural and aesthetic choices made during the HitConfirm layout overhaul, serving as a future reference for modifications to styling, markup, or layout.

---

## 1. Aesthetic Identity & Theme

* **Design Concept**: FGC Industrial Wiki / Frame Data Database (inspired by systems like Dustloop/Supercombo).
* **Color Palette (Zero-Saturated Charcoal with High-Contrast Highlights)**:
  * **Canvas Background**: `#121214` (Deep matte charcoal, reducing eye strain for strategy study).
  * **Card Panels**: `#1a1a1f` (Steel-zinc gray, providing clear visual boundaries without rounded edges).
  * **Primary Highlight**: `#ff6b00` (Toxic Orange; used for key actions, warnings, active links, and highlights).
  * **Secondary Accent**: `#00cbd6` (Cyber Cyan; used for verified tags, upvotes, and technical indicators).
  * **Borders**: `#2d2d34` (1px solid mechanical borders).
* **Typography**:
  * **Headings**: `'Montserrat'`, sans-serif (clean, wide, uppercase, bold).
  * **Interactive / Data Details**: `'JetBrains Mono'`, monospace (perfect for combos, frame timings, and notations).
  * **Body Copy**: `'Montserrat'` or system font family stack, clean and flat.
* **Border Radii**: Strict `0px` throughout. All panels, cards, inputs, dropdowns, and buttons have flat, sharp corners to fit the retro/utilitarian FGC style.

---

## 2. HTML Layout Restructuring Mapping

The transition from a modern social network layout to a dense technical wiki is achieved via the following HTML structure updates:

### Left Navigation Bar (`.wiki-left-nav`)
* **Old Structure**: Horizontal header bar spanning the top of the viewport.
* **New Structure**: Persistent left-side `<aside>` panel (`width: 240px; height: 100vh; position: fixed;`).
* **Layout Offset**: The main viewport container `#app-container` gets `padding-left: 240px` on desktop, which collapses to `0px` on mobile media screens (`< 768px`) where the sidebar adapts to a top header stack.

### Game Selector Console (`.wiki-console`)
* **Old Structure**: Vertical left-side dropdown sidebar menu showing games.
* **New Structure**: Horizontal Console Selector bar placed above page views, featuring a custom monospace subtitle header and a tabbed grid layout (`.wiki-console-tabs-grid`).

### Dojo Combos Listing & Strategy Matrix
* **Old Structure**: Modern social grid cards with large spacing and circular profiles.
* **New Structure**: Monospace-dense tables (`.wiki-frame-table`) showing execution stats (Damage, Meter, Difficulty) as structured records. Cards represent technical wiki pages rather than social posts.

### Combo Builder
* **Old Structure**: Generic form fields with circular pads.
* **New Structure**: A technical **Lab Console Builder** with a character grid selector, clean arcade-style keypad button inputs in a matrix with solid 2px borders, and flat terminal-style logs.

---

## 3. Playwright E2E Test Compatibility

To ensure existing E2E tests and DOM event listeners continue to pass:
1. **No ID Modification**: We do not change critical element IDs (e.g., `#combo-video`, `#video-confirm-checkbox`, `#dojo-game-filter`, `#builder-game-select`, `#btn-publish-combo`).
2. **Class Interoperability**: Critical functional classes (like `.nav-link` on the main menu, `.combo-comment-input`, etc.) are kept in the new markup alongside the new styling classes.
