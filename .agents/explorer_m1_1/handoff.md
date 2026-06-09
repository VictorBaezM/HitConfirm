# Handoff Report — explorer_m1_1

## 1. Observation
- **Codebase File Paths & Line Numbers:**
  - `src/js/utils/video-validator.js`:
    - Lines 23-72: `GAME_VIDEO_KEYWORDS` definition containing game and character keyword arrays.
    - Lines 85-113: `extractYouTubeVideoId(url)` function containing hostname validation and regex extraction.
    - Lines 126-139: `fetchVideoTitle(videoId)` fetching from YouTube's oEmbed endpoint.
    - Lines 160-179: `validateVideoTitle(title, gameId)` checking game & character relevance.
  - `src/js/pages/feed.js`:
    - Lines 306-385: `renderCreatorBox(navigateCallback)` where the HTML for game selector and YouTube video input are defined.
    - Lines 400-414: `updateFormatHint` formatting instructions dynamically.
    - Lines 423-464: `renderValidationBanner` displaying checks or warning fallbacks.
    - Lines 498-530: `videoInput.addEventListener('blur', async () => { ... })` checking and validating titles when the input loses focus.
    - Line 527: `const result = rawTitle ? validateVideoTitle(rawTitle, gameId) : null;` calling the validation.
  - `src/js/store.js`:
    - Lines 9, 15, 21, 27: Roster arrays for each game (`sf6.characters`, `t8.characters`, `ggst.characters`, `ssbu.characters`).
  - `docs/API_REFERENCE.md`:
    - Lines 11-76: Documentation of the helper functions inside `video-validator.js`.
- **Verbatim Excerpts:**
  - `video-validator.js:170-171`:
    ```javascript
    const hasGameKeyword = gameData.gameKeywords.some(kw => lowerTitle.includes(kw));
    const hasCharKeyword = gameData.characterKeywords.some(kw => lowerTitle.includes(kw));
    ```
  - `feed.js:505-506`:
    ```javascript
    const videoId = extractYouTubeVideoId(rawUrl);
    if (!videoId) {
    ```
- **External Integration Requirements:**
  - Twitch oEmbed URL format: `https://api.twitch.tv/v5/oembed?url=<url>`
  - Graceful degradation requirement: degrade to neutral warning banner (which is triggered when `fetchVideoTitle` returning `null` renders the fallback UI in `feed.js`).

---

## 2. Logic Chain
1. **YouTube & Twitch URL Coexistence:** Since `feed.js` handles the input blur event, we must be able to identify both YouTube and Twitch URLs. The logic can determine the platform by trying `extractYouTubeVideoId` first, and if that returns null, running a new `extractTwitchInfo` helper.
2. **SSRF Mitigation:** Following the security pattern used by YouTube ID validation (which doesn't fetch raw user inputs but instead queries oEmbed via isolated IDs), `extractTwitchInfo` must validate Twitch domains (`twitch.tv`, `www.twitch.tv`, `m.twitch.tv`, `clips.twitch.tv`), extract the numeric video ID or alphanumeric clip slug, and reconstruct a clean, canonical URL (`https://www.twitch.tv/videos/${id}` or `https://clips.twitch.tv/${slug}`).
3. **Graceful Degradation:** Since Twitch oEmbed (`https://api.twitch.tv/v5/oembed?url=...`) might require authorization or fail due to CORS, wrapping it in `try-catch` block returning `null` ensures the caller can fallback to manual user confirmation, preventing blocked posts.
4. **Keyword Derivation:** To make the check character-specific when `selectedChar` is provided to `validateVideoTitle(title, gameId, selectedChar)`, we need a generator `getCharacterKeywords(selectedChar)` that extracts matching variations (e.g. replacing hyphens, stripping periods and titles, tokenizing compound names) to perform a robust case-insensitive check.
5. **Backward Compatibility:** Omitting `selectedChar` from the parameters list must fall back to the original game roster-wide search (`gameData.characterKeywords.some(...)`), preventing regression.

---

## 3. Caveats
- **Twitch oEmbed Availability:** If Twitch's oEmbed endpoint is highly locked down, title checking will degrade to `null` more frequently, triggering the warning banner. This is an expected and handled edge case.
- **Stop Words:** Highly common words in multi-word character names (like "fit", "trainer", "and", "the") are filtered out in our word tokenization to avoid false-positives (e.g. matching any video with the word "fit" as a Wii Fit Trainer combo). However, rare stop-words might still cause slight matching overlaps.

---

## 4. Conclusion
The design strategy described in `analysis.md` provides a complete, secure, and backwards-compatible blueprint for the video relevance updates of Milestone 1. 

**Summary of Actionable Deliverables for Implementer:**
1. Extend `src/js/utils/video-validator.js` with `extractTwitchInfo`, `fetchTwitchVideoTitle`, and `getCharacterKeywords` functions, and update `validateVideoTitle`.
2. Integrate the dynamic character dropdown `#post-character-select` and dynamic icon toggling inside `src/js/pages/feed.js` creator UI.
3. Update `docs/API_REFERENCE.md` with Javadocs descriptions for the new functions.
4. Add unit test assertions covering the new features in `src/js/utils/video-validator.test.mjs`.

---

## 5. Verification Method
The implementer can verify the implementation by:
1. **Running tests:**
   - Execute the test suite using command: `node --experimental-vm-modules src/js/utils/video-validator.test.mjs`
   - All tests must pass.
2. **Visual Inspection:**
   - Verify the post creator panel dynamically displays/hides the character selection dropdown depending on whether a game is tagged.
   - Enter a Twitch URL and check if the input box icon dynamically changes to the Twitch icon.
3. **Behavioral Invalidation Condition:**
   - Verify that adding a character-specific tag causes the relevance banner to reject video titles mentioning other characters, while typing matching titles returns a successful match banner.
