# Milestone 1: Video Relevance Validation Updates - Analysis & Recommendations

## Executive Summary
This analysis outlines the design strategy to expand HitConfirm's video relevance validation for Milestone 1. The updates introduce support for Twitch URLs (VODs and clips), handle Twitch's oEmbed authentication gracefully via fallback degradation, and add strict character-specific validation to verify that the video title contains keywords representing a user-selected character.

---

## 1. Existing YouTube Validation Architecture
In `src/js/utils/video-validator.js`, YouTube validation is implemented using pure utility functions and an oEmbed title fetcher:
- **`extractYouTubeVideoId(url)`**: Extracts an 11-character YouTube video ID using regex. It performs an host allowlist check against `youtube.com`, `www.youtube.com`, `youtu.be`, and `www.youtu.be` to prevent Server-Side Request Forgery (SSRF) and URL injection.
- **`fetchVideoTitle(videoId)`**: Builds a YouTube oEmbed request URL using the validated ID:
  `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`.
  It fetches the metadata and returns `data.title`. If the fetch fails, it returns `null` for graceful degradation.
- **`validateVideoTitle(title, gameId)`**: Case-insensitively checks if the video title contains:
  1. At least one game keyword defined in `GAME_VIDEO_KEYWORDS[gameId].gameKeywords`.
  2. At least one character keyword defined in `GAME_VIDEO_KEYWORDS[gameId].characterKeywords`.
  If either is missing, it marks the validation as invalid, prompting the user for manual confirmation.

---

## 2. Supporting Twitch Video/Clip URLs

### A. URL Detection & Extraction
Twitch has two types of user-facing video URLs: VODs (Videos) and Clips.
1. **Videos (VODs)**: Format is `https://(www.)twitch.tv/videos/<numeric_id>`. E.g., `https://www.twitch.tv/videos/123456789`.
2. **Clips (Subdomain)**: Format is `https://clips.twitch.tv/<slug>`. E.g., `https://clips.twitch.tv/TemperedSpookySpaghetti-8328120`.
3. **Clips (Path-based)**: Format is `https://(www.)twitch.tv/<channel>/clip/<slug>`. E.g., `https://www.twitch.tv/brian_f/clip/TemperedSpookySpaghetti-8328120`.

We propose a utility function `extractTwitchVideoUrl(url)` that validates the hostname against `['twitch.tv', 'www.twitch.tv', 'clips.twitch.tv']` and checks whether the path corresponds to a video or a clip. If valid, it returns the trimmed, normalized URL to be used in the oEmbed API query parameter.

```javascript
/**
 * Extracts and normalizes a Twitch video or clip URL if valid.
 * Returns null if the URL is not a recognized Twitch video/clip format.
 *
 * @param {string} url - Raw URL string from user input.
 * @returns {string|null} The normalized Twitch URL, or null if invalid.
 */
export function extractTwitchVideoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return null; // Not a valid URL structure
  }

  const ALLOWED_HOSTS = ['twitch.tv', 'www.twitch.tv', 'clips.twitch.tv'];
  if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) return null;

  const pathname = parsedUrl.pathname;
  // Match VOD: /videos/123456789
  const isVideo = /^\/videos\/\d+/.test(pathname);
  // Match Clip: /clip/Slug or host is clips.twitch.tv
  const isClip = /^\/clip\/[a-zA-Z0-9_-]+/.test(pathname) || parsedUrl.hostname === 'clips.twitch.tv';

  if (isVideo || isClip) {
    return trimmed;
  }

  return null;
}
```

### B. Calling Twitch's oEmbed API and Graceful Degradation
Twitch's oEmbed endpoint is:
`https://api.twitch.tv/v5/oembed?url=${encodeURIComponent(twitchUrl)}`

**Authentication / Access Constraints**:
Twitch's `v5` API is legacy and public calls may fail with `401 Unauthorized` or `403 Forbidden` if a `Client-ID` header is not provided, or if the request is blocked by CORS policy.
To handle this:
- If `fetch(oEmbedUrl)` returns `!response.ok` or throws a CORS / network error, the title-fetching logic must catch the failure and return `null`.
- Returning `null` triggers the app's existing UI neutral banner degradation:
  > *"Could not verify video title (network issue). The confirmation checkbox is required to continue."*
- This ensures users are never blocked from submitting their posts when oEmbed checks fail.

---

## 3. Character-Specific Keyword Check Design
Currently, `validateVideoTitle` checks if the video title contains *any* character from the game's keyword array. We will enhance this by supporting a third argument: `validateVideoTitle(title, gameId, selectedChar)`.

### A. Algorithmic Keyword Derivation
When `selectedChar` is provided, we must automatically derive the logical case-insensitive keywords for that specific character name to ensure clean matching. 

We define a keyword derivation algorithm with the following rules:
1. **Full lowercase name**: e.g., `"chun-li"`, `"m. bison"`.
2. **Condensed alphanumeric name**: Strip all spaces, hyphens, and periods. E.g., `"chunli"`, `"mbison"`, `"aki"`.
3. **Hyphen-to-space replacement**: E.g., `"chun-li"` -> `"chun li"`.
4. **Period removal**: E.g., `"m. bison"` -> `"m bison"`.
5. **Partial name matching**: Split by space/hyphen/period and extract individual name parts (ignoring short initials like `"m"` or `"e"` by enforcing `part.length > 2`). E.g., `"M. Bison"` splits into `["m", "bison"]`, matching `"bison"`.

```javascript
/**
 * Derives a set of case-insensitive keywords from a character's display name.
 * Handles hyphens (Chun-Li), periods/initials (M. Bison, E. Honda, A.K.I.),
 * and multi-word names (Dee Jay, Devil Jin).
 *
 * @param {string} charName - Display name of the character.
 * @returns {string[]} An array of lowercase keyword strings.
 */
export function getCharacterKeywords(charName) {
  if (!charName) return [];
  const name = charName.toLowerCase();
  const keywords = new Set();

  // 1. Full lowercase name
  keywords.add(name);

  // 2. Condensed form (no hyphens, spaces, or periods)
  keywords.add(name.replace(/[-.\s]/g, ''));

  // 3. Hyphens to spaces
  if (name.includes('-')) {
    keywords.add(name.replace(/-/g, ' '));
  }

  // 4. Period removal (keep spaces)
  if (name.includes('.')) {
    keywords.add(name.replace(/\./g, ''));
  }

  // 5. Individual name parts (exclude short prefixes/initials like 'M' or 'E')
  const parts = name.split(/[-.\s]+/);
  parts.forEach(part => {
    const cleanPart = part.trim();
    if (cleanPart.length > 2) {
      keywords.add(cleanPart);
    }
  });

  return Array.from(keywords);
}
```

---

## 4. Proposed Code Changes

### A. File: `src/js/utils/video-validator.js`
We recommend adding `extractTwitchVideoUrl` and `getCharacterKeywords`, and updating `fetchVideoTitle` and `validateVideoTitle`:

```javascript
// Add imports/exports as needed

/**
 * Extracts and normalizes Twitch video or clip URLs.
 */
export function extractTwitchVideoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return null;
  }

  const ALLOWED_HOSTS = ['twitch.tv', 'www.twitch.tv', 'clips.twitch.tv'];
  if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) return null;

  const pathname = parsedUrl.pathname;
  const isVideo = /^\/videos\/\d+/.test(pathname);
  const isClip = /^\/clip\/[a-zA-Z0-9_-]+/.test(pathname) || parsedUrl.hostname === 'clips.twitch.tv';

  return (isVideo || isClip) ? trimmed : null;
}

/**
 * Fetches the video title from YouTube or Twitch oEmbed APIs.
 * Supports graceful degradation to return null if unauthorized or network error occurs.
 */
export async function fetchVideoTitle(idOrUrl, provider = 'youtube') {
  if (!idOrUrl) return null;

  let oEmbedUrl;
  if (provider === 'youtube') {
    if (!/^[a-zA-Z0-9_-]{11}$/.test(idOrUrl)) return null;
    oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${idOrUrl}&format=json`;
  } else if (provider === 'twitch') {
    oEmbedUrl = `https://api.twitch.tv/v5/oembed?url=${encodeURIComponent(idOrUrl)}`;
  } else {
    return null;
  }

  try {
    const response = await fetch(oEmbedUrl);
    if (!response.ok) return null;
    const data = await response.json();
    return data.title || null;
  } catch {
    return null; // Degrade gracefully on network / CORS / Auth failure
  }
}

/**
 * Validates whether a video title meets HitConfirm's relevance requirements.
 * If selectedChar is provided, matches case-insensitively against derived character keywords.
 */
export function validateVideoTitle(title, gameId, selectedChar) {
  const fallback = { isValid: false, hasGameKeyword: false, hasCharKeyword: false, label: gameId };

  if (!title || !gameId) return fallback;

  const gameData = GAME_VIDEO_KEYWORDS[gameId];
  if (!gameData) return { ...fallback, isValid: true }; // Unknown game — pass through

  const lowerTitle = title.toLowerCase();
  const hasGameKeyword = gameData.gameKeywords.some(kw => lowerTitle.includes(kw));
  
  let hasCharKeyword = false;
  if (selectedChar) {
    const charKeywords = getCharacterKeywords(selectedChar);
    hasCharKeyword = charKeywords.some(kw => lowerTitle.includes(kw));
  } else {
    hasCharKeyword = gameData.characterKeywords.some(kw => lowerTitle.includes(kw));
  }

  return {
    isValid: hasGameKeyword && hasCharKeyword,
    hasGameKeyword,
    hasCharKeyword,
    label: gameData.label
  };
}
```

### B. File: `src/js/pages/feed.js`
Update the blur handler within `renderCreatorBox` to support Twitch validation and fetch:

```javascript
  // Wire: URL input loses focus → run oEmbed check
  videoInput.addEventListener('blur', async () => {
    const rawUrl = videoInput.value.trim();
    const gameId = gameSelect.value;

    if (!rawUrl) { resetValidationUI(); return; }
    if (!gameId)  { resetValidationUI(); return; }

    const ytId = extractYouTubeVideoId(rawUrl);
    const twitchUrl = extractTwitchVideoUrl(rawUrl);

    if (!ytId && !twitchUrl) {
      validationBanner.style.display = 'block';
      validationBanner.style.background = 'rgba(239,68,68,0.06)';
      validationBanner.style.border = '1px solid rgba(239,68,68,0.2)';
      validationBanner.style.color = 'var(--color-danger)';
      validationBanner.innerHTML =
        '<i class="fa-solid fa-link-slash" style="margin-right: 6px;"></i>' +
        'That does not look like a valid YouTube or Twitch URL. Please use a full youtube.com, youtu.be, or twitch.tv link.';
      confirmRow.style.display = 'none';
      return;
    }

    validationBanner.style.display = 'block';
    validationBanner.style.background = 'rgba(59,130,246,0.05)';
    validationBanner.style.border = '1px solid rgba(59,130,246,0.12)';
    validationBanner.style.color = 'var(--text-muted)';
    validationBanner.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i>Checking video title...';

    let rawTitle = null;
    let provider = '';
    if (ytId) {
      provider = 'youtube';
      rawTitle = await fetchVideoTitle(ytId, 'youtube');
    } else if (twitchUrl) {
      provider = 'twitch';
      rawTitle = await fetchVideoTitle(twitchUrl, 'twitch');
    }

    // Determine if we can extract selectedChar. If there is a character tag or profile main character:
    // (For future expansion or if character context is available, pass it here)
    const selectedChar = null; 

    const safeTitle = escapeHtml(rawTitle || '');
    const result = rawTitle ? validateVideoTitle(rawTitle, gameId, selectedChar) : null;
    renderValidationBanner(result, safeTitle);
  });
```

---

## 5. Verification Plan

### A. Unit Tests (Pure Logic)
Add focused unit tests to `src/js/utils/video-validator.test.mjs` verifying:
1. **Twitch Detection**:
   - Happy paths for Twitch VOD and clip URLs (`twitch.tv/videos/123`, `clips.twitch.tv/MyClipSlug`, etc.).
   - Rejection of non-Twitch hostnames and invalid paths.
2. **Keyword Derivation**:
   - Assert `getCharacterKeywords('Chun-Li')` contains `'chun-li'`, `'chun li'`, `'chunli'`, `'chun'`.
   - Assert `getCharacterKeywords('M. Bison')` contains `'m. bison'`, `'mbison'`, `'m bison'`, `'bison'`.
   - Assert `getCharacterKeywords('A.K.I.')` contains `'a.k.i.'`, `'aki'`.
3. **Character-Specific validation**:
   - Assert `validateVideoTitle('SF6 Ryu Combo', 'sf6', 'Ryu').isValid === true`.
   - Assert `validateVideoTitle('SF6 Ken Combo', 'sf6', 'Ryu').isValid === false` (character mismatch).

### B. E2E / Integration Tests
In `tests/e2e/video-validation.spec.js`:
- Intercept the Twitch oEmbed endpoint (mock oEmbed response) to verify that the UI renders the success green banner when a relevant Twitch video is input.
- Intercept with a 401/403/500 mock response to verify the UI displays the neutral warn banner and forces the confirmation checkbox rather than blocking user input.
