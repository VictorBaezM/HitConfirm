# HitConfirm Project Documentation & Architecture Guide

Welcome to the comprehensive documentation for **HitConfirm**, a social web application designed for fighting game enthusiasts to share combos, study matchup guides, watch video clips, and level up their gameplay.

This document outlines the codebase architecture, files structure, individual modules, and detailed descriptions of all functions and how they operate.

---

## 1. Architectural Overview

HitConfirm is built as a lightweight, frontend-only **Single Page Application (SPA)** using a clean, modular structure.

### Core Stack
- **Structure**: Vanilla HTML5 with semantic elements.
- **Logic**: ES6+ Javascript (ES Modules) organized into pages, reusable components, and utility modules.
- **Styling**: Vanilla CSS3 utilizing CSS variables, responsive grids, and modern UI patterns (glassmorphic styling, neon box-shadows, and micro-animations).
- **State & Database**: A unified database model (`Store`) persisted locally in the browser via `localStorage`.

---

## 2. Directory & File Structure

```text
HitConfirm/
│
├── index.html                   # Main application shell and modal/toast mounts
│
└── src/
    ├── css/
    │   ├── variables.css        # Colors, fonts, shadows, transitions, layout sizes
    │   ├── main.css             # Resets, scrollbars, layouts (main grids), utilities
    │   ├── components.css       # Navigation, card elements, buttons, input fields
    │   └── combo-parser.css     # Styling for virtual fighting game controller elements
    │
    └── js/
        ├── app.js               # Main router, bootstrap, modal and toast controllers
        ├── store.js             # Client-side database, state manager, seed records
        │
        ├── components/
        │   ├── navbar.js        # Global navigation bar component
        │   ├── combo-card.js    # Specialized combo viewer (votes, bookmarks, comments)
        │   └── post-card.js     # Standard timeline social post card component
        │
        ├── pages/
        │   ├── auth.js          # Authentication handler (registration, logins)
        │   ├── builder.js       # Visual combo designer and keypad controller
        │   ├── combos.js        # Training Dojo page and query filters
        │   ├── feed.js          # Social timeline page and active post creator
        │   ├── profile.js       # Player dashboard, bookmarks tracker, settings editor
        │   └── strategy.js      # Strategy guides publisher and frame check sheet table
        │
        └── utils/
            └── combo-parser.js  # Fighting game input visual compiler/parser
```

---

## 3. Database State Management (`src/js/store.js`)

The application's data layer is managed by the `Store` class, which handles remote connections, caching, seed checks, and asynchronous mutations. The store queries remote tables hosted on **Supabase** via the client config module [supabase.js](file:///c:/Users/Omen/Desktop/GitHub/HitConfirm/src/js/supabase.js) and maps database fields from database casing (`snake_case`) to frontend properties (`camelCase`).

### Database Seed Entities
- `DEFAULT_GAMES`: Static dictionary of supported games:
  - `sf6` (Street Fighter 6)
  - `t8` (Tekken 8)
  - `ggst` (Guilty Gear -Strive-)
  - `ssbu` (Super Smash Bros. Ultimate)
- `DEFAULT_USERS`: Preset mockup profiles (`SolManiac`, `DaigoFan99`, `ElectricWindGod`).
- `DEFAULT_COMBOS`: Presets for the combo visual parser testing.
- `DEFAULT_POSTS` / `DEFAULT_STRATEGIES`: Placeholder discussion threads and matchup writeups.

### Methods & Functions in `Store`

#### Initialization & Caching
- `loadAllData()`: Pre-fetches `users`, `combos`, `posts`, and `strategies` records from Supabase in parallel. Restores session mappings and seeds default placeholder records to the remote database if it's completely empty.

#### Sessions & Profiles
- `getGames()` / `getGame(gameId)`: Returns static metadata about fighting games.
- `getUsers()`: Returns cached profiles.
- `getCurrentUser()` / `setCurrentUser(user)`: Inspects or writes the active user session state.
- `registerUser(username, mainGame, mainChar)`: Creates a new user row in the Supabase `users` table.
- `loginUser(username)`: Validates username against user caches.
- `logout()`: Clears active user session data.

#### Combos Table
- `getCombos()`: Retrieves cached public combos.
- `saveCombo(comboData)`: Creates a new combo entry in the Supabase `combos` table and triggers a corresponding timeline post announcement.
- `upvoteCombo(comboId)`: updates upvote lists in the Supabase `combos` table.
- `addComboComment(comboId, commentText)`: Appends comments to the Supabase comments array.
- `toggleSaveCombo(comboId)`: Bookmarks a combo to the user profile table in Supabase.

#### Posts Table
- `getPosts()`: Retrieves cached timeline posts.
- `savePost(postData)`: Saves a new post to the Supabase `posts` table.
- `upvotePost(postId)`: Handles upvotes in the Supabase `posts` table.
- `addPostComment(postId, commentText)`: Appends comments to the Supabase comments array.

#### Strategy Guides Table
- `getStrategies()`: Retrieves cached community guides.
- `saveStrategy(strategyData)`: Saves a new guide to the Supabase `strategies` table and cross-posts an announcement on the feed.
- `upvoteStrategy(strategyId)`: Handles guide upvotes in the Supabase `strategies` table.

---

## 4. Visual Input Parser (`src/js/utils/combo-parser.js`)

A core technical highlight is the notation parser. It transforms cryptic textual move inputs (e.g. `236HS` or `d/f+2`) into visual command buttons.

### Configurations
- `DIRECTION_ARROWS`: Maps numpad directions and letter codes to Unicode arrow symbols:
  - `1` ➔ `↙`, `2` ➔ `↓`, `3` ➔ `↘`, `4` ➔ `←`, `6` ➔ `→`, `7` ➔ `↖`, `8` ➔ `↑`, `9` ➔ `↗`
  - `d/f` ➔ `↘`, `d/b` ➔ `↙`, `u/f` ➔ `↗`, `u/b` ➔ `↖`, `f` ➔ `→`, `b` ➔ `←`, `d` ➔ `↓`, `u` ➔ `↑`
- `MOTIONS`: Maps numpad sequences to motion shortcuts:
  - `236` ➔ `QCF` (Quarter Circle Forward)
  - `214` ➔ `QCB` (Quarter Circle Backward)
  - `623` ➔ `DP` (Dragon Punch)
  - `421` ➔ `RDP` (Reverse Dragon Punch)
  - `41236` ➔ `HCF` (Half Circle Forward)
  - `63214` ➔ `HCB` (Half Circle Backward)
  - `32146` ➔ `TK` (Tiger Knee)
- `BUTTON_CLASSES`: Associates attack codes with CSS style definitions depending on the game type:
  - Anime/GGST: `P` (Punch), `K` (Kick), `S` (Slash), `HS` (Heavy), `D` (Dust)
  - SF6: `LP`, `MP`, `HP`, `LK`, `MK`, `HK`
  - Tekken 8: `1`, `2`, `3`, `4`
  - Smash: `A`, `B`, `X`, `Y`

### Parser Functions
- `parseComboStep(stepStr)`: Compiles a single move step (e.g., `236HS`).
  1. Checks and extracts motion prefixes.
  2. Identifies directional arrows (like charge/jump notations), ignoring helper `+` signs.
  3. Formats special execution tags like `c.` (close) or `f.` (far).
  4. Identifies the action buttons and returns a styled HTML block. Fallback text is returned if inputs are unparseable.
- `parseComboToHtml(notationString)`: Processes a full string (e.g. `5K > 2D > 214K`). It normalizes separators (such as `,` or `->` into `>`), splits them, invokes `parseComboStep` on each part, and joins them with styled arrow flow cards.

---

## 5. Main Application Entry & Routing (`src/js/app.js`)

Operates as the bootstrap entry script and handles page-level routing.

- `navigate(pageId, options)`: Renders pages dynamically in a single-column or sidebarred page layout.
  1. Updates the navigation bar active link styling.
  2. Displays a loading animation spinner.
  3. Executes page renders inside the `#content-mount` element after a short timeout (150ms) to ensure smooth transitions.
  4. Manages fallbacks and shows recovery banners on routing errors.
- `window.showToast(message, duration)`: Translates alerts into sliding warning/notification cards at the bottom right.
- `setupGlobalModals()`: Registers background overlay event listeners to handle closing modal dialog forms.
- `DOM Content Loaded event listener`: Initializes application modal parameters and redirects the client to the initial `feed` view.

---

## 6. Layout Views & Pages (`src/js/pages/`)

### Feed Page (`src/js/pages/feed.js`)
Handles the user dashboard timeline feed:
- `renderFeedPage(navigateCallback)`: Sets up the feed page structure, showing the post creation input, active game chip filter bar, a hot combo widget, and the weekly challenge panel.
- `renderCreatorBox(navigateCallback)`: If logged out, displays a login prompt. If logged in, renders a form with a text input supporting bold/hashtag helpers, a game tag dropdown, and a video URL field. Updates are posted to the timeline.
- `refreshTimeline()`: Fetches timeline items and filters them according to the selected game filter.
- `refreshHotCombos()`: Displays the top two highest-rated combos in the sidebar.

### Dojo/Combos Page (`src/js/pages/combos.js`)
Manages public combo searches and navigation:
- `renderCombosPage(navigateCallback, initialFilters)`: Prepares filtering cards for text search queries (checking characters or titles), game drop-down menus, and execution difficulty selectors.
- `drawList()`: Loops through filtered combos and appends `renderComboCard` results to the list container.
- `Sidebar widget`: Includes notation guidelines and a list of top lab masters.

### Combo Builder Page (`src/js/pages/builder.js`)
Provides an interactive visual editor for constructing combos:
- `renderBuilderPage(navigateCallback)`: Configures the layout, showing the live notation preview panel, dropdown filters, the virtual pad, and the details submission form.
- `drawCharacters()`: Updates the character roster dropdown based on the selected game.
- `drawAttackButtons()`: Updates the action buttons on the virtual pad depending on the selected game's notation style.
- `updateNotationPreview()`: Connects buffered inputs to the visual parser. It populates both the preview panel and the manual editor input field.
- **Event Listeners**:
  - Pad directions (numpad buttons) and motions append inputs to the buffer.
  - Attack buttons combine with the buffered direction, push the completed step to the sequence array, and reset the buffer.
  - Manual text input splits string characters on standard dividers and live-updates the preview.
  - Publish button gathers details (title, damage, meter, difficulty, notes, video) and calls `store.saveCombo()`.

### Strategy Hub Page (`src/js/pages/strategy.js`)
Acts as the training guide page:
- `renderStrategyPage(navigateCallback)`: Builds the split-pane guide catalog layout.
- `drawMatchupTable()`: Renders a structured reference table containing common punishable moves and their optimal responses.
- `drawGuidesList(filteredGuides)`: Renders cards for community guides in the directory column.
- `drawActiveGuide()`: Renders the selected guide article in the viewer pane, converting simple markdown headings, lists, and bold text into styled HTML elements via `formatGuideMarkdown()`. Includes upvoting controls.
- `openCreateGuideModal()`: Launches a modal form for writing and publishing new strategy guides.

### Profile Page (`src/js/pages/profile.js`)
Manages the user dashboard and bookmarks:
- `renderProfilePage(navigateCallback)`: Renders a lock screen if logged out. If logged in, displays a tabbed content panel (My Combos, Saved Combos, My Posts), a profile card showing the user's rank and main picks, and their achievement counts.
- `drawTabList()`: Toggles content views between the user's own combos, bookmarked combos, and timeline posts.
- `openEditMainsModal()`: Opens a modal form for changing the user's main game and character options.

---

## 7. Reusable Components (`src/js/components/`)

### Navbar (`src/js/components/navbar.js`)
Renders the navigation bar (`renderNavbar`):
- Dynamically displays navigation links (Feed, Dojo, Builder, Guides, My Dojo).
- Adjusts the right-hand panel based on authentication status: shows user avatar initials and a logout button if logged in, or Sign Up/Log In buttons if logged out.

### Combo Card (`src/js/components/combo-card.js`)
Generates a styled, interactive card layout for individual combos (`renderComboCard`):
- Displays game, character, and difficulty badges alongside creation date metadata.
- Integrates the visual notation sequence rendered by the combo parser.
- Displays key stats (damage, meter, difficulty) and description texts.
- **Interactive Controls**:
  - **Upvote Button**: Toggles upvote status and updates count using the store.
  - **Save Button**: Bookmarks the combo to the user's Dojo.
  - **Copy Button**: Copies the raw text notation to the user's clipboard.
  - **Video Button**: Toggles the display of embedded YouTube video clips.
  - **Comments Section**: Toggles the visibility of a comment feed, allowing users to read and post execution-related comments.

### Social Post Card (`src/js/components/post-card.js`)
Generates a timeline social post card (`renderPostCard`):
- Displays author profile details (avatar, username, main game badge) and a post timestamp.
- Formats text content using `formatPostText()`, which parses Markdown-like syntax for bold text, hashtags, and inline code blocks.
- Integrates video embeds and interactive controls (upvote button, comment toggle, reply submission form).

---

## 8. Layout Design Origins & References

Several core aspects of HitConfirm's visual design are inspired by and adapted from popular modern design systems:

### Glassmorphism & Cyberpunk Design System
The visual style is heavily inspired by modern sci-fi interfaces and web-design concepts:
- **Translucent Card Layouts**: The combination of `rgba(16, 18, 23, 0.7)` card backgrounds with `backdrop-filter: blur(12px)` mimics the glassmorphic aesthetic popularized in macOS Big Sur and Windows 11 Fluent Design.
- **Neon Accent Highlights**: The core color scheme (`--color-primary: #ff005b` neon red, `--color-secondary: #00f0ff` cyan, and `--color-accent: #ffaa00` gold) uses high-contrast colors typical of fighting game menus (such as the cybernetic design of *Guilty Gear -Strive-* and the neon styling of *Street Fighter 6*).
- **Interactive Neon Glows**: The cards and button elements utilize CSS `box-shadow` glows (e.g. `var(--glow-primary)`) that expand and brighten on hover, creating a responsive feel.

### Tailwind-Inspired Styling Utilities
While HitConfirm uses vanilla CSS, its layout utility classes are directly modeled after Tailwind CSS:
- Layout classes like `.flex`, `.flex-col`, `.items-center`, `.justify-between`, `.justify-center`, and `.gap-3` are helper equivalents of Tailwind's spacing and flexbox systems.
- Grid structures like the card views and form layouts mirror Tailwind's grid utility framework.

### Fighting Game Community (FGC) Hubs
The notation layouts, page functions, and visual structures are modeled after prominent FGC wikis and tools:
- **Numpad Notation visualizer**: The concept of parsing numbers into directional arrows and attack codes is adapted from community databases like **Dustloop Wiki** (for Guilty Gear/Arc System Works games) and **SuperCombo Wiki** (for Street Fighter/Capcom games).
- **Matchup Matrix Table**: The layout for matchup punish directories is inspired by game spreadsheet guides compiled by FGC coaches on platforms like Google Sheets or specialized training tools like **Fat (Frame Data)** app.
- **Keypad Builder**: The visual layout of the virtual keyboard panel mirrors arcade fighting stick layouts, including directional layouts (resembling numpads or arcade sticks) and button layouts (resembling Sanwa arcade buttons).

---

## 9. Project Extension Guide

This section describes how to scale the application by adding new fighting games, new visual notation formats, or new page views.

### 9.1 Adding a New Fighting Game
To add support for a new game:
1. **Define Game Properties**: Open [store.js](file:///c:/Users/Omen/Desktop/GitHub/HitConfirm/src/js/store.js) and add a new entry to the static `DEFAULT_GAMES` dictionary:
   ```javascript
   tekken7: {
     id: 'tekken7',
     name: 'Tekken 7',
     characters: ['Kazuya', 'Heihachi', 'Jin', 'Lars', 'Alisa', 'Akuma'],
     notationType: 'tekken'
   }
   ```
2. **Add CSS Badges**: Add a corresponding CSS badge selector in [components.css](file:///c:/Users/Omen/Desktop/GitHub/HitConfirm/src/css/components.css) to style the game's label:
   ```css
   .badge-tekken7 {
     background: rgba(255, 77, 77, 0.1);
     border-color: rgba(255, 77, 77, 0.3);
     color: #ff4d4d;
   }
   ```

### 9.2 Adding a New Notation Button Style
If the new game introduces novel button mappings (e.g. specialized tag controls or custom mechanics):
1. **Register Button CSS Class**: Open [combo-parser.js](file:///c:/Users/Omen/Desktop/GitHub/HitConfirm/src/js/utils/combo-parser.js) and append the key and visual class to `BUTTON_CLASSES`:
   ```javascript
   'rage': 'btn-rage'
   ```
2. **Style the Button**: Open [combo-parser.css](file:///c:/Users/Omen/Desktop/GitHub/HitConfirm/src/css/combo-parser.css) and configure the background properties:
   ```css
   .combo-btn.btn-rage {
     background: linear-gradient(to bottom, #ff3300, #990000);
     border-radius: 4px;
   }
   ```
3. **Update Builder Pad**: Modify `drawAttackButtons()` in [builder.js](file:///c:/Users/Omen/Desktop/GitHub/HitConfirm/src/js/pages/builder.js) to render the button code inside the visual keyboard pad grid.

### 9.3 Creating a New Page & Navigation Link
To expand the Single Page Application's pages:
1. **Create Page View**: Create a new JS module file (e.g., `src/js/pages/leaderboard.js`) and export a rendering function:
   ```javascript
   export function renderLeaderboardPage(navigateCallback) {
     const mount = document.getElementById('content-mount');
     if (!mount) return;
     mount.innerHTML = `<div>Leaderboard Content</div>`;
     // Attach page interactions here
   }
   ```
2. **Register in Router**: Import the controller inside the main router [app.js](file:///c:/Users/Omen/Desktop/GitHub/HitConfirm/src/js/app.js) and register a new case statement inside the `navigate()` function:
   ```javascript
   case 'leaderboard':
     renderLeaderboardPage(navigate);
     break;
   ```
3. **Append Navlink**: In [navbar.js](file:///c:/Users/Omen/Desktop/GitHub/HitConfirm/src/js/components/navbar.js), add the page details to the navigation links dictionary array:
   ```javascript
   { id: 'leaderboard', label: 'Leaderboard', icon: 'fa-trophy' }
   ```

