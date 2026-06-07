# HitConfirm Codebase API Reference

This document provides a comprehensive Javadocs-standard API documentation registry for all javascript functions, methods, and classes within the **HitConfirm** project.

---

## 1. Utilities

---

### `video-validator.js` — Video Relevance Validation Module

Provides YouTube URL parsing, oEmbed title fetching, and game/character keyword matching to enforce content relevance on video-tagged posts.

---

#### `GAME_VIDEO_KEYWORDS`
* **Description:** A constant configuration object mapping each supported game ID to its human-readable label and two keyword arrays (`gameKeywords`, `characterKeywords`). Used by `validateVideoTitle` to determine if a video title is relevant to the selected game. Supported game IDs: `sf6`, `t8`, `ggst`, `ssbu`.
* **Type:** `Object.<string, { label: string, gameKeywords: string[], characterKeywords: string[] }>`
* **Example:**
  ```javascript
  import { GAME_VIDEO_KEYWORDS } from './video-validator.js';
  console.log(GAME_VIDEO_KEYWORDS.sf6.label); // 'Street Fighter 6'
  ```

---

#### `extractYouTubeVideoId(url)`
* **Description:** Extracts the 11-character YouTube video ID from a full URL string. Validates that the URL belongs to an allowlisted YouTube domain before extracting (`youtube.com`, `youtu.be`). Supports standard watch URLs, shortened `youtu.be` links, and embed URLs. Returns `null` for any non-YouTube, malformed, or missing URL — this prevents SSRF by never forwarding unvalidated URLs to the fetch layer.
* **Parameters:**
  * `url` (`string`): Raw URL string from the user input field.
* **Returns:** `string | null` — The 11-character video ID string, or `null` if the URL is invalid or not a recognized YouTube format.
* **Example:**
  ```javascript
  import { extractYouTubeVideoId } from './video-validator.js';
  extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ'); // 'dQw4w9WgXcQ'
  extractYouTubeVideoId('https://evil.com/?v=abc');       // null
  ```

---

#### `fetchVideoTitle(videoId)`
* **Description:** Fetches the video title from YouTube's free oEmbed API endpoint using a pre-validated video ID. The video ID is regex-validated before use in the URL to prevent injection. Returns `null` on any network failure, non-200 response, or JSON parse error — callers must handle `null` as a graceful degradation case (never blocking submission).
* **Parameters:**
  * `videoId` (`string`): A validated 11-character YouTube video ID (alphanumeric, `-`, `_` only).
* **Returns:** `Promise<string | null>` — The video title string from the oEmbed response, or `null` on any error.
* **Example:**
  ```javascript
  import { fetchVideoTitle } from './video-validator.js';
  const title = await fetchVideoTitle('dQw4w9WgXcQ');
  // 'Rick Astley - Never Gonna Give You Up (Official Music Video)'
  ```

---

#### `validateVideoTitle(title, gameId, selectedChar)`
* **Description:** Validates whether a video title meets HitConfirm's content relevance policy: the title must contain at least one keyword from `gameKeywords` AND at least one keyword from character keywords (derived from the optional `selectedChar` parameter if provided, or from the default `characterKeywords` array for the specified game). All comparisons are case-insensitive. Returns a structured result object — never throws. Unknown `gameId` values pass through as `isValid: true` to avoid breaking future game additions.
* **Parameters:**
  * `title` (`string`): The raw video title string returned from the oEmbed API.
  * `gameId` (`string`): The game ID selected by the user (e.g. `'sf6'`, `'t8'`, `'ggst'`, `'ssbu'`).
  * `selectedChar` (`string`, optional): The character name to validate against. If provided, specific keywords are derived from this name.
* **Returns:** `Object` — A result object with the following shape:
  * `isValid` (`boolean`): `true` if both game and character keywords were found.
  * `hasGameKeyword` (`boolean`): `true` if a game name keyword was matched.
  * `hasCharKeyword` (`boolean`): `true` if a character name keyword was matched.
  * `label` (`string`): The human-readable game name for use in UI messages.
* **Example:**
  ```javascript
  import { validateVideoTitle } from './video-validator.js';
  validateVideoTitle('SF6 Ryu BnB Combo Guide', 'sf6', 'Ryu');
  // { isValid: true, hasGameKeyword: true, hasCharKeyword: true, label: 'Street Fighter 6' }

  validateVideoTitle('Funny Cat Compilation', 'sf6', 'Ryu');
  // { isValid: false, hasGameKeyword: false, hasCharKeyword: false, label: 'Street Fighter 6' }
  ```

---

#### `extractTwitchInfo(url)`
* **Description:** Validates if a URL points to Twitch and belongs to an allowlisted Twitch domain (`twitch.tv`, `www.twitch.tv`, `m.twitch.tv`, `clips.twitch.tv`). If it matches, it extracts the VOD ID or Clip slug and constructs a canonical Twitch URL. Returns `null` if the host is not allowlisted, the URL is malformed, or no VOD ID or Clip slug could be parsed.
* **Parameters:**
  * `url` (`string`): The Twitch URL to parse.
* **Returns:** `string | null` — The canonical Twitch VOD or Clip URL, or `null` if invalid.
* **Example:**
  ```javascript
  import { extractTwitchInfo } from './video-validator.js';
  extractTwitchInfo('https://www.twitch.tv/videos/12345678'); // 'https://www.twitch.tv/videos/12345678'
  extractTwitchInfo('https://m.twitch.tv/videos/12345678'); // 'https://www.twitch.tv/videos/12345678'
  ```

---

#### `fetchTwitchVideoTitle(canonicalUrl)`
* **Description:** Fetches the video title from Twitch's oEmbed endpoint. Returns `null` on any network failure, non-200 response, or JSON parse error.
* **Parameters:**
  * `canonicalUrl` (`string`): The canonical Twitch VOD or Clip URL.
* **Returns:** `Promise<string | null>` — The Twitch video title string, or `null` on error.
* **Example:**
  ```javascript
  import { fetchTwitchVideoTitle } from './video-validator.js';
  const title = await fetchTwitchVideoTitle('https://www.twitch.tv/videos/12345678');
  ```

---

#### `getCharacterKeywords(charName)`
* **Description:** Derives a set of lowercase keywords for character-specific validation. Filters out common stop words and handles multi-word/special character names (generating space-replaced, collapsed, and tokenized variants). Avoids generating overly broad matching terms like short initials (e.g. "M" from "M. Bison"), but preserves short full names (e.g. "Ed").
* **Parameters:**
  * `charName` (`string`): The character's full name.
* **Returns:** `Set<string>` — A Set of derived lowercase keywords.
* **Example:**
  ```javascript
  import { getCharacterKeywords } from './video-validator.js';
  getCharacterKeywords('Chun-Li'); // Set { 'chun-li', 'chun li', 'chunli', 'chun' }
  ```

---

### `escapeHtml(unsafe)`
* **Description:** Escapes HTML special characters to prevent Cross-Site Scripting (XSS) attacks.
* **Parameters:**
  * `unsafe` (`string`): Raw, unsanitized string.
* **Returns:** `string` - Clean, HTML-entity-encoded string.
* **Example:**
  ```javascript
  import { escapeHtml } from './security.js';
  const safe = escapeHtml('<script>alert("XSS")</script>');
  // returns &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;
  ```

### `validatePasswordStrength(password)`
* **Description:** Validates a password against security complexity requirements (minimum 8 characters, uppercase, lowercase, digit, and special symbol).
* **Parameters:**
  * `password` (`string`): Raw password input value.
* **Returns:** `Object` - Validation status object containing `isValid` (`boolean`) and feedback `message` (`string`).
* **Example:**
  ```javascript
  import { validatePasswordStrength } from './security.js';
  const res = validatePasswordStrength('weak');
  // returns { isValid: false, message: 'Password must be at least 8 characters long.' }
  ```

### `parseComboStep(stepStr)`
* **Description:** Parses a single combo step string (e.g. `236HS` or `d/f+2`) and wraps its directional/action sub-tokens in visual HTML elements.
* **Parameters:**
  * `stepStr` (`string`): The move input string.
* **Returns:** `string` - Generated HTML code snippet for the move step.
* **Example:**
  ```javascript
  import { parseComboStep } from './combo-parser.js';
  const html = parseComboStep('236HS');
  ```

### `parseComboToHtml(notationString)`
* **Description:** Converts a full sequence notation string (e.g. `5K > 2D > 214K`) into styled visual input lists.
* **Parameters:**
  * `notationString` (`string`): The raw combo sequence notation string.
* **Returns:** `string` - Full sequence of visual arrow flows and buttons.
* **Example:**
  ```javascript
  import { parseComboToHtml } from './combo-parser.js';
  const html = parseComboToHtml('5K > 2D > 214K');
  ```

---

## 2. Core Routing & Bootstrap

### `navigate(pageId, options)`
* **Description:** Handles Single Page Application (SPA) routing, manages global layout views, and pre-fetches data from Supabase.
* **Parameters:**
  * `pageId` (`string`): Target view identifier (e.g. `feed`, `combos`, `builder`).
  * `options` (`Object`): Optional route arguments.
* **Returns:** `void`
* **Example:**
  ```javascript
  import { navigate } from './app.js';
  navigate('combos', { game: 'sf6' });
  ```

### `window.showToast(message, duration)`
* **Description:** Displays a sliding temporary notification banner at the bottom right.
* **Parameters:**
  * `message` (`string`): Warning or alert string text content.
  * `duration` (`number`): Lifespan duration in milliseconds (default `3000`).
* **Returns:** `void`
* **Example:**
  ```javascript
  window.showToast('Combo notation copied!', 2000);
  ```

### `setupGlobalModals()`
* **Description:** Configures event listeners for the global overlay containers and modal forms.
* **Parameters:** None.
* **Returns:** `void`
* **Example:**
  ```javascript
  setupGlobalModals();
  ```

### `fetchLatestCommit()`
* **Description:** Asynchronously queries the GitHub commits API for the latest commit of the HitConfirm repository, displays the commit SHA and message in the navbar, and provides a fallback view if rate-limited or offline.
* **Parameters:** None.
* **Returns:** `Promise<void>`
* **Example:**
  ```javascript
  // Called internally within renderNavbar
  setTimeout(fetchLatestCommit, 100);
  ```

---

## 3. Database Caching & Mutations (`Store` Class)

### `mapUserFromDb(row)`
* **Description:** Maps a user row object retrieved from Supabase (`snake_case`) to local property state (`camelCase`).
* **Parameters:**
  * `row` (`Object`): The database raw row object.
* **Returns:** `Object` - Sanitized client-friendly user profile entity.

### `mapUserToDb(user)`
* **Description:** Formats a client-friendly user profile entity (`camelCase`) into a database row payload (`snake_case`).
* **Parameters:**
  * `user` (`Object`): The client-side user structure.
* **Returns:** `Object` - Database-ready column row dictionary.

### `mapComboFromDb(row)`
* **Description:** Maps a combo row object retrieved from Supabase (`snake_case`) to local property state (`camelCase`).
* **Parameters:**
  * `row` (`Object`): The database raw row object.
* **Returns:** `Object` - Sanitized client-friendly combo entity.

### `mapComboToDb(combo)`
* **Description:** Formats a client-friendly combo entity (`camelCase`) into a database row payload (`snake_case`).
* **Parameters:**
  * `combo` (`Object`): The client-side combo structure.
* **Returns:** `Object` - Database-ready column row dictionary.

### `mapPostFromDb(row)`
* **Description:** Maps a post row object retrieved from Supabase (`snake_case`) to local property state (`camelCase`).
* **Parameters:**
  * `row` (`Object`): The database raw row object.
* **Returns:** `Object` - Sanitized client-friendly post entity.

### `mapPostToDb(post)`
* **Description:** Formats a client-friendly post entity (`camelCase`) into a database row payload (`snake_case`).
* **Parameters:**
  * `post` (`Object`): The client-side post structure.
* **Returns:** `Object` - Database-ready column row dictionary.

### `mapStrategyFromDb(row)`
* **Description:** Maps a strategy guide row object retrieved from Supabase (`snake_case`) to local property state (`camelCase`).
* **Parameters:**
  * `row` (`Object`): The database raw row object.
* **Returns:** `Object` - Sanitized client-friendly strategy guide entity.

### `mapStrategyToDb(strat)`
* **Description:** Formats a client-friendly strategy guide entity (`camelCase`) into a database row payload (`snake_case`).
* **Parameters:**
  * `strat` (`Object`): The client-side strategy guide structure.
* **Returns:** `Object` - Database-ready column row dictionary.

### `Store.init()`
* **Description:** Initializes local session variables in memory.
* **Parameters:** None.
* **Returns:** `void`

### `Store.seedSupabase()`
* **Description:** Automatically seeds initial mockup data into Supabase if it's completely empty.
* **Parameters:** None.
* **Returns:** `Promise<void>`

### `Store.loadAllData()`
* **Description:** Pre-fetches and maps data records for combos, posts, strategy guides, and user profiles from Supabase in parallel.
* **Parameters:** None.
* **Returns:** `Promise<void>`

### `Store.getGames()`
* **Description:** Retrieves all static game definitions.
* **Parameters:** None.
* **Returns:** `Object` - Game dictionaries.

### `Store.getGame(gameId)`
* **Description:** Returns metadata regarding a single fighting game.
* **Parameters:**
  * `gameId` (`string`): The game unique identifier.
* **Returns:** `Object` - Game metadata details.

### `Store.addGameCharacter(gameId, charName)`
* **Description:** Dynamically appends a new character to a game's roster in the database and local cache if it does not already exist.
* **Parameters:**
  * `gameId` (`string`): The game identifier (e.g., `'sf6'`).
  * `charName` (`string`): The name of the character to add.
* **Returns:** `Promise<boolean>` - Operational success status.

### `Store.getUsers()`
* **Description:** Returns cached player profile entities.
* **Parameters:** None.
* **Returns:** `Array<Object>` - Cached user profiles.

### `Store.getCurrentUser()`
* **Description:** Checks active session metadata.
* **Parameters:** None.
* **Returns:** `Object|null` - Active user session profile.

### `Store.setCurrentUser(user)`
* **Description:** Syncs active user profile session inside the local storage cache.
* **Parameters:**
  * `user` (`Object|null`): User object or null to clear cache.
* **Returns:** `void`

### `Store.registerUser(email, password, username, mainGame, mainChar)`
* **Description:** Registers a new user account in Supabase using Email/Password Auth.
* **Parameters:**
  * `email` (`string`): User email address.
  * `password` (`string`): User password.
  * `username` (`string`): Desired username.
  * `mainGame` (`string`): Primary game tag ID.
  * `mainChar` (`string`): Primary character pick.
* **Returns:** `Promise<Object>` - Operational status with user entity or error message.

### `Store.loginUser(email, password)`
* **Description:** Authenticates user credentials via Supabase Email/Password login.
* **Parameters:**
  * `email` (`string`): User email address.
  * `password` (`string`): User password.
* **Returns:** `Promise<Object>` - Operational status indicating success with user profile or error message.

### `Store.logout()`
* **Description:** Clears the active browser session and signs out of Supabase Auth.
* **Parameters:** None.
* **Returns:** `Promise<void>`

### `Store.getCombos()`
* **Description:** Returns cached public combos.
* **Parameters:** None.
* **Returns:** `Array<Object>` - Shared combos list.

### `Store.saveCombo(comboData)`
* **Description:** Inserts a new combo row in the database and fires a feed announcement post.
* **Parameters:**
  * `comboData` (`Object`): Raw combo attributes (title, notation, character, etc.).
* **Returns:** `Promise<Object>` - Saved combo result status.

### `Store.upvoteCombo(comboId)`
* **Description:** Toggles combo upvotes for the current user.
* **Parameters:**
  * `comboId` (`string`): The combo database identifier.
* **Returns:** `Promise<Object>` - Success status, upvote count, and state flag.

### `Store.addComboComment(comboId, commentText)`
* **Description:** Appends an execution comment to the combo card discussion container.
* **Parameters:**
  * `comboId` (`string`): Combo card unique ID.
  * `commentText` (`string`): The text string content.
* **Returns:** `Promise<Object>` - Result comments array.

### `Store.toggleSaveCombo(comboId)`
* **Description:** Bookmarks or removes a combo from the user's saved list in Supabase.
* **Parameters:**
  * `comboId` (`string`): Combo card ID.
* **Returns:** `Promise<Object>` - Result success flag and bookmark state.

### `Store.toggleFollowUser(targetUserId)`
* **Description:** Toggles the follow status of another user for the current logged-in user, persisting the follow state in the database.
* **Parameters:**
  * `targetUserId` (`string`): The user ID of the player to follow/unfollow.
* **Returns:** `Promise<Object>` - Object containing `success` (`boolean`) and `followed` (`boolean`) indicating the active follow status.

### `Store.getPosts()`
* **Description:** Returns cached timeline social posts.
* **Parameters:** None.
* **Returns:** `Array<Object>` - Timeline posts list.

### `Store.savePost(postData)`
* **Description:** Inserts a new discussion thread row on Supabase.
* **Parameters:**
  * `postData` (`Object`): Post content and optional media links.
* **Returns:** `Promise<Object>` - Saved post status.

### `Store.upvotePost(postId)`
* **Description:** Toggles timeline post upvotes.
* **Parameters:**
  * `postId` (`string`): Post unique identifier.
* **Returns:** `Promise<Object>` - Success status with updated upvotes.

### `Store.addPostComment(postId, commentText)`
* **Description:** Appends a text reply to the timeline post details.
* **Parameters:**
  * `postId` (`string`): Target post ID.
  * `commentText` (`string`): Reply string.
* **Returns:** `Promise<Object>` - Reply list.

### `Store.getStrategies()`
* **Description:** Returns cached community guides.
* **Parameters:** None.
* **Returns:** `Array<Object>` - Shared matchup articles list.

### `Store.saveStrategy(strategyData)`
* **Description:** Inserts a new guide row on Supabase and shares it on the timeline.
* **Parameters:**
  * `strategyData` (`Object`): Game focus, characters, title, and article content.
* **Returns:** `Promise<Object>` - Strategy guide entity structure.

### `Store.upvoteStrategy(strategyId)`
* **Description:** Toggles strategy guide upvotes.
* **Parameters:**
  * `strategyId` (`string`): Guide ID.
* **Returns:** `Promise<Object>` - Success status.

---

## 4. Components

### `renderNavbar(activePage, navigateCallback)`
* **Description:** Dynamically draws the global navigation header.
* **Parameters:**
  * `activePage` (`string`): Active page ID for highlight toggles.
  * `navigateCallback` (`function`): Router navigation callback.
* **Returns:** `void`
* **Example:**
  ```javascript
  import { renderNavbar } from './components/navbar.js';
  renderNavbar('feed', navigate);
  ```

### `renderComboCard(combo, navigateCallback)`
* **Description:** Renders a visual combo card with interactive upvotes, bookmarks, visual notations, clip frame triggers, and comments.
* **Parameters:**
  * `combo` (`Object`): Target combo record entity.
  * `navigateCallback` (`function`): SPA router navigation callback.
* **Returns:** `HTMLDivElement` - Configured card node element.
* **Example:**
  ```javascript
  import { renderComboCard } from './components/combo-card.js';
  const cardNode = renderComboCard(combo, navigate);
  ```

### `renderCommentsList(comments)`
* **Description:** Compiles and generates the execution comments section sub-layout.
* **Parameters:**
  * `comments` (`Array<Object>`): List of comments.
* **Returns:** `string` - Compiled HTML string listing comment replies.

### `renderPostCard(post, navigateCallback)`
* **Description:** Renders a timeline social post card node supporting upvoting, tag formatting, video embeds, and comments.
* **Parameters:**
  * `post` (`Object`): Social post entity.
  * `navigateCallback` (`function`): SPA router navigation callback.
* **Returns:** `HTMLHtmlElement` - Configured card node article.
* **Example:**
  ```javascript
  import { renderPostCard } from './components/post-card.js';
  const postNode = renderPostCard(post, navigate);
  ```

### `formatPostText(text)`
* **Description:** Parses and escapes plain text into styled HTML by replacing bold triggers (`**`), hashtags (`#`), and inline backticks (`` ` ``).
* **Parameters:**
  * `text` (`string`): Unformatted plain text.
* **Returns:** `string` - Safe formatted HTML content.
* **Example:**
  ```javascript
  const formatted = formatPostText('Check this out: **2H > 236KK** #GGST');
  ```

---

## 5. Page Views & Controllers

### `openAuthModal(type, navigateCallback)`
* **Description:** Renders and launches the authentication login or registration form.
* **Parameters:**
  * `type` (`string`): Type of form (`login` or `register`).
  * `navigateCallback` (`function`): Router callback.
* **Returns:** `void`

### `renderBuilderPage(navigateCallback)`
* **Description:** Draws the interactive visual combo designs builder workspace workspace.
* **Parameters:**
  * `navigateCallback` (`function`): Router callback.
* **Returns:** `void`

### `renderCombosPage(navigateCallback, initialFilters)`
* **Description:** Prepares filtering lists and search inputs to display combo cards.
* **Parameters:**
  * `navigateCallback` (`function`): Router callback.
  * `initialFilters` (`Object`): Option game/difficulty filters.
* **Returns:** `void`

### `renderFeedPage(navigateCallback)`
* **Description:** Renders the dashboard timeline layout along with hottest combos and challenge panels.
* **Parameters:**
  * `navigateCallback` (`function`): Router callback.
* **Returns:** `void`

### `renderCreatorBox(navigateCallback)`
* **Description:** Draws the feed creator text panel or registration prompt banners.
* **Parameters:**
  * `navigateCallback` (`function`): Router callback.
* **Returns:** `void`

### `renderProfilePage(navigateCallback, options)`
* **Description:** Renders the player dashboard profile page. Displays a public read-only guest layout if `options.userId` specifies a user ID other than the currently logged-in user.
* **Parameters:**
  * `navigateCallback` (`function`): Router callback.
  * `options` (`Object`): Context/routing parameters.
    * `options.userId` (`string`): Target user profile ID to display.
* **Returns:** `void`

### `renderStrategyPage(navigateCallback)`
* **Description:** Builds the split-pane guide directory catalogue and frame checks sheet.
* **Parameters:**
  * `navigateCallback` (`function`): Router callback.
* **Returns:** `void`

### `formatGuideMarkdown(text)`
* **Description:** Escapes and parses strategy article markdown headings, bold sections, and checklists.
* **Parameters:**
  * `text` (`string`): Raw article markdown.
* **Returns:** `string` - Styled guide HTML content.
