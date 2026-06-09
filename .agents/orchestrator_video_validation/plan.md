# Project Plan: Combo Builder Video Relevance Validation

This plan outlines the milestones and steps to implement video relevance validation (YouTube/Twitch oEmbed checks, formatting guides, and a mandatory confirmation checkbox) on the HitConfirm Combo Builder page, along with automated E2E tests.

## Architecture & Design
- **Helper module**: Update `src/js/utils/video-validator.js` to parse Twitch URLs and fetch video title from Twitch oEmbed, and extend keyword validation to target a specific character name.
- **UI Integration**: Modify `src/js/pages/builder.js` to render the format hint, oEmbed validation banner, and confirmation checkbox. Hook into selection changes, input blur, and form submission.
- **Testing**: Add a new Playwright test suite in `tests/e2e/builder-video-validation.spec.js` using mocked oEmbed and Supabase APIs.

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Video Validator Update | Enhance `video-validator.js` with Twitch parsing/oEmbed fetch and character-specific validation. | None | DONE |
| 2 | Combo Builder UI Integration | Implement validation banners, format hints, confirmation checkbox, and publish blocking in `builder.js`. | M1 | DONE |
| 3 | Automated E2E Verification | Create `tests/e2e/builder-video-validation.spec.js` covering all builder validation requirements. | M2 | DONE |
| 4 | Verification & Audit | Run Playwright test suite, perform reviews, and pass Forensic Integrity Audit. | M3 | DONE |

## Interface Contracts
- `extractTwitchVideoId(url)`: Extract video ID or slug from a Twitch URL.
- `fetchVideoTitle(videoId, isTwitch = false)` or similar: Fetch title from YouTube/Twitch oEmbed API.
- `validateVideoTitle(title, gameId, selectedChar)`: Check if video title contains both game keywords and the selected character keywords.
