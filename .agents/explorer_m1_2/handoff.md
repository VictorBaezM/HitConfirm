# Handoff Report: Milestone 1 Video Relevance Validation Updates

## 1. Observation
- Existing video validation logic is defined in `src/js/utils/video-validator.js`, which exports `extractYouTubeVideoId`, `fetchVideoTitle`, `validateVideoTitle`, and `GAME_VIDEO_KEYWORDS`.
- The current implementation only supports YouTube URLs:
  - Line 90: `const ALLOWED_HOSTS = ['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be'];`
  - Line 129: `const oEmbedUrl = \`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=\${videoId}&format=json\`;`
- Current title verification checks if *any* character keyword matches the title (Line 171):
  `const hasCharKeyword = gameData.characterKeywords.some(kw => lowerTitle.includes(kw));`
- The user workflow is driven by event listeners on the `blur` event of the URL input field in `src/js/pages/feed.js` (Lines 498-529).
- Unit tests are located at `src/js/utils/video-validator.test.mjs` and run using:
  `node src/js/utils/video-validator.test.mjs` (or `npm test` via package.json script).
- E2E tests are located in `tests/e2e/video-validation.spec.js` and run using `npx playwright test`.

## 2. Logic Chain
- To support Twitch video/clip URLs, we need to detect the Twitch hostname (`twitch.tv`, `www.twitch.tv`, `clips.twitch.tv`) and match valid VOD path structures (`/videos/\d+`) or Clip path structures (`/clip/Slug` or `clips.twitch.tv/Slug`).
- The oEmbed endpoint for Twitch is `https://api.twitch.tv/v5/oembed?url=...`. Because this requires a Client-ID or is deprecated, public requests might fail (401/403/CORS blocks).
- To degrade gracefully, any failure in fetching the Twitch oEmbed title must return `null`. The existing front-end implementation (`src/js/pages/feed.js`, Line 424) handles `null` validation result gracefully by showing a warning banner and requiring the user to check a confirmation checkbox, which permits posting without completely blocking submission.
- Character display names (e.g. "Chun-Li", "M. Bison") must be parsed case-insensitively into a list of plausible keywords:
  - Standard lowercase: `"chun-li"`, `"m. bison"`
  - Strip formatting (alphanumeric only): `"chunli"`, `"mbison"`
  - Replaced hyphens: `"chun li"`
  - Removed periods: `"m bison"`
  - Spaced out tokens longer than 2 characters: `"chun"`, `"bison"`
- A third parameter, `selectedChar`, added to `validateVideoTitle(title, gameId, selectedChar)`, will enforce that the title contains at least one derived keyword for that specific character, falling back to checking any character keyword of the game if `selectedChar` is omitted.

## 3. Caveats
- The external Twitch oEmbed API was not physically invoked during analysis due to CODE_ONLY network mode restrictions.
- We assume that the user's browser environment allows CORS requests to Twitch oEmbed, but if not, the system will degrade gracefully to the neutral confirmation banner.

## 4. Conclusion
We have completed a comprehensive design strategy that extends current video validation to Twitch URLs and supports specific character keyword checks. The proposed additions are fully backwards-compatible, preserve the SSRF mitigation, and leverage the existing graceful degradation path.

## 5. Verification Method
- **Unit Verification**: Apply the changes and run the native test runner:
  `npm test`
  Confirm that all existing tests pass and verify that newly added assertions for Twitch parsing and `getCharacterKeywords` pass.
- **E2E Verification**: Run `npm run test:e2e` and verify that the mocked oEmbed intercepts continue to resolve successfully.
