## 2026-06-07T19:46:48Z

You are tasked with implementing the Video Relevance Validation updates for the Combo Builder page.

### 📚 Loadable Skills
Please read and adhere strictly to these skills:
- Strategic Feature Verification Tester: c:\Users\Omen\Gemini\config\skills\strategic-feature-verification-tester\SKILL.md
- Secure Web & DB Endpoint Guard: c:\Users\Omen\Gemini\config\skills\secure-web-db-endpoint-guard\SKILL.md
- Modular Architecture & Living Documentation Architect: c:\Users\Omen\Gemini\config\skills\modular-doc-architect-guard\SKILL.md

### 🛠️ Scope of Modifications
Please perform all the following code modifications:

1. **`src/js/utils/video-validator.js`**:
   - Keep `extractYouTubeVideoId` and existing code.
   - Implement `extractTwitchInfo(url)`:
     - Allowlist Twitch hosts: `['twitch.tv', 'www.twitch.tv', 'm.twitch.tv', 'clips.twitch.tv']`.
     - Extract VOD numeric ID from `/videos/\d+` paths or Clip alphanumeric slug from `clips.twitch.tv/<slug>` or `/clip/<slug>` paths.
     - Reconstruct and return canonical Twitch URL: `https://www.twitch.tv/videos/${videoId}` or `https://clips.twitch.tv/${clipSlug}`.
   - Implement `fetchTwitchVideoTitle(canonicalUrl)` calling the public oEmbed API `https://api.twitch.tv/v5/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`. Catch any network, CORS, 401/403, or parsing errors and return `null` (graceful degradation).
   - Implement `getCharacterKeywords(charName)` to derive a set of lowercase keywords:
     - Case-insensitive base.
     - Strip symbols `?`, `#`, `'`, `&`.
     - Handle slash `/` splits (e.g. `"Pyra/Mythra"`).
     - Handle hyphens and periods (e.g. `"Chun-Li"` -> `"chun li"`, `"chunli"`; `"M. Bison"` -> `"m bison"`, `"mbison"`, `"bison"`).
     - Tokenize multi-word names and exclude stop words.
     - For tokenized name parts, only keep parts with length >= 3 to prevent matching short initials like "M" or "E" (unless it is the full name itself, which is kept).
   - Update `validateVideoTitle(title, gameId, selectedChar)`:
     - If `selectedChar` is provided, validate the title against both the game's keywords and the specific character keywords derived via `getCharacterKeywords(selectedChar)`.
     - If `selectedChar` is omitted, default to the game's full roster `characterKeywords` for backwards compatibility.

2. **`src/js/utils/video-validator.test.mjs`**:
   - Add unit tests verifying Twitch VOD/Clip URL detection, character keyword derivation, and character-specific validation rules. Ensure all unit tests run and pass using `npm test`.

3. **`src/js/pages/builder.js`**:
   - Modify `renderBuilderPage` to add:
     - Format hint container `#video-format-hint` and text element `#video-format-hint-text` below the video input field.
     - Validation banner `#video-validation-banner` (hidden by default) below the video input field.
     - Confirmation checkbox row `#video-confirm-row` with checkbox `#video-confirm-checkbox` and label `#video-confirm-label` (hidden by default) below the video input field.
     - Event Listeners:
       - Update format hint text dynamically when game select `#builder-game-select` or character select `#builder-char-select` changes. Give example formats (e.g. "Street Fighter 6 - Ryu BnB Combo Guide"). Hide if game or character is not selected.
       - On `blur` event on video input `#combo-video`, if a URL is entered, determine if YouTube or Twitch, fetch the oEmbed title (using `fetchVideoTitle` or `fetchTwitchVideoTitle` accordingly), validate against selected game and character using `validateVideoTitle(title, gameId, selectedChar)`.
       - Render the validation banners matching the styles, colors, and text messages used in `feed.js` (green banner on success, red banner with specific missing items, neutral banner on fetch failure, red banner on invalid URL).
       - On `input` event on video input `#combo-video`, update the platform icon in real-time (YouTube logo for YouTube, Twitch logo for Twitch, Video logo default).
       - Intercept publish button `#btn-publish-combo` click: if video URL is present, block publishing unless `#video-confirm-checkbox` is checked. Trigger a toast notification `window.showToast(...)` and focus the checkbox.

4. **`docs/API_REFERENCE.md`**:
   - Append Javadocs-standard API documentation registry details for `extractTwitchInfo`, `fetchTwitchVideoTitle`, and `getCharacterKeywords`. Update the documentation entry for `validateVideoTitle` to include the third parameter.

5. **`tests/e2e/builder-video-validation.spec.js`**:
   - Create a Playwright E2E spec file testing:
     - Format hint showing correctly on game/character selection.
     - Banner states: green on match, red on missing items, neutral on network error (simulate oEmbed API fetch failing by returning a mock non-200 or throwing error).
     - Publish blocking: verify publishing blocks and triggers toast if video URL is filled but checkbox is unchecked.
     - Publish success: verify publishing succeeds when checkbox is checked.
     - All oEmbed calls and Supabase connections must be fully mocked (similar to `tests/e2e/video-validation.spec.js`) to run offline in ~3s.
