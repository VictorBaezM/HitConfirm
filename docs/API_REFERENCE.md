# HitConfirm Codebase API Reference

This document provides a comprehensive Javadocs-standard API documentation registry for all javascript functions, methods, and classes within the **HitConfirm** project.

---

## 1. Utilities

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
