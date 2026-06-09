# Changes Summary

This document summarizes the changes made to implement Video Relevance Validation for the Combo Builder page:

### 1. `src/js/utils/video-validator.js`
- Implemented `extractTwitchInfo(url)` to support allowlisted Twitch VOD/Clip URL parsing and construct canonical Twitch links.
- Implemented `fetchTwitchVideoTitle(canonicalUrl)` to retrieve title details from the Twitch oEmbed API.
- Implemented `getCharacterKeywords(charName)` to derive lowercase character matching variations.
- Updated `validateVideoTitle` to accept an optional `selectedChar` and validate titles using character-specific rules.

### 2. `src/js/utils/video-validator.test.mjs`
- Added comprehensive unit tests testing Twitch URL recognition, character keyword derivation, and character-specific validation rules.

### 3. `src/js/pages/builder.js`
- Added the video format hint, validation banner, confirmation checkbox, and custom platform icon layout to the template.
- Implemented a reactive format hint update handler.
- Implemented video input `input` listener to update platform icons.
- Implemented `blur` listener to validate video URLs against oEmbed and display warning/success messages.
- Intercepted the publish button to block submission if a video URL is present but the validation checkbox is unchecked.

### 4. `docs/API_REFERENCE.md`
- Documented updated `validateVideoTitle` signature, `extractTwitchInfo`, `fetchTwitchVideoTitle`, and `getCharacterKeywords`.

### 5. `tests/e2e/builder-video-validation.spec.js`
- Created E2E test file covering all four visual video validation and validation block scenarios on the Combo Builder.
