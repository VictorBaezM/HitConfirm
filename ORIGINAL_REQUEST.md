# Original User Request

## Initial Request — 2026-06-07T19:43:32Z

Implement video relevance validation (YouTube/Twitch oEmbed checks, formatting guides, and a mandatory confirmation checkbox) on the HitConfirm Combo Builder page so that any uploaded demonstration video is validated against both the currently selected game and character.

Working directory: `c:\Users\Omen\Desktop\GitHub\HitConfirm`
Integrity mode: development

## Requirements

### R1. Combo Builder Video Relevance Checking
- Detect when a user enters a video URL (YouTube or Twitch) in the Combo Builder video field.
- If it's a YouTube link, fetch the video title using the oEmbed API.
- If it's a Twitch link, fetch the video title using Twitch's oEmbed API (or gracefully degrade to unverified state if auth is required).
- Check if the title contains both the selected game name keywords and the selected character name keyword (case-insensitive).
- Display a green banner if both are present.
- Display a red warning banner if either is missing, specifying what is missing (e.g. game name, character name, or both).
- Display a neutral banner if the oEmbed fetch fails.

### R2. Formatting Hints & UI Nudges
- Display a dynamic formatting helper banner below the video input as soon as a game and character are selected, giving an example format (e.g. "Street Fighter 6 - Ryu BnB Combo Guide").
- The format hint should hide when game or character selection is cleared.

### R3. Mandatory Confirmation Checkbox
- Render an acknowledgement checkbox whenever a video URL is inputted: `I confirm this video is a [Game Name] combo or clip featuring [Character Name].`
- Intercept the "Publish to Dojo" click: if a video is entered, block publishing unless the confirmation checkbox is checked.
- If publishing is blocked, trigger a toast notification warning the user and focus the checkbox.

### R4. Automated E2E Verification
- Provide a Playwright E2E test suite in `tests/e2e/builder-video-validation.spec.js` covering these scenarios.
- The test suite must mock all oEmbed calls and Supabase connections to ensure the tests run fully offline and reliably in ~3 seconds.

## Acceptance Criteria

### Combo Builder UI Behavior
- [ ] Format hint appears automatically below the video input field on selecting a game and character.
- [ ] Banners update correctly: green banner on matching title; red banner on missing game or character title; neutral banner on network error.
- [ ] Publishing is blocked with a toast notification if the video URL is filled but the confirmation checkbox is unchecked.
- [ ] Publishing succeeds and saves to the database if the validation checkbox is checked.

### E2E Tests
- [ ] A Playwright spec file is created under `tests/e2e/` verifying all validation, banner states, publish blocking, and hints.
- [ ] All new E2E tests run successfully (green) using `npx playwright test`.
