# Milestone 1: Video Relevance Validation Updates - Analysis & Design

This report provides the analysis and design recommendations for extending the video relevance validation system in HitConfirm. It details how to support Twitch VOD and Clip URLs and how to implement a case-insensitive character-specific keyword check for video titles.

---

## 1. Review of Current YouTube Validation Architecture

In the current implementation (`src/js/utils/video-validator.js`):
* **URL Extraction**: `extractYouTubeVideoId(url)` extracts the 11-character video ID from standard watch links, shortened `youtu.be` links, and embed links. It uses a strict hostname allowlist (`youtube.com`, `www.youtube.com`, `youtu.be`, `www.youtu.be`) to prevent SSRF and open-redirect vulnerabilities.
* **Title Fetching**: `fetchVideoTitle(videoId)` takes a validated video ID and makes an asynchronous fetch call to YouTube's public oEmbed endpoint:
  ```
  https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json
  ```
  Any network failure, parsing error, or non-200 response results in returning `null`, allowing the UI to degrade gracefully by showing a neutral validation banner.
* **Title Validation**: `validateVideoTitle(title, gameId)` checks if the lowercase video title includes at least one keyword from `GAME_VIDEO_KEYWORDS[gameId].gameKeywords` AND at least one from `GAME_VIDEO_KEYWORDS[gameId].characterKeywords`. If either is missing, it reports failure but does not block submission, instead prompting the user with a confirmation checkbox.

---

## 2. Twitch VOD & Clip Support Strategy

Twitch VOD and Clip URLs can be verified using Twitch's public oEmbed API. To prevent SSRF/open-redirect vectors, we must parse incoming raw URLs, validate their structure, and reconstruct a clean, safe URL before calling the oEmbed API.

### 2.1 Twitch URL Identification & Component Extraction

We identify three distinct Twitch URL patterns:
1. **Twitch VODs**: `https://www.twitch.tv/videos/123456789`
2. **Standard Clips**: `https://clips.twitch.tv/FabulousSpunkyMonkey-abcde`
3. **Channel-specific Clips**: `https://www.twitch.tv/channel_name/clip/FabulousSpunkyMonkey-abcde`

To handle these securely, we will add an `extractAndCleanTwitchUrl(url)` function:
* Validate that the URL has an allowed hostname: `twitch.tv`, `www.twitch.tv`, or `clips.twitch.tv`.
* Use regular expressions to extract component parts (VOD numeric ID or Clip alphanumeric slug).
* Reconstruct a normalized, clean URL. For example:
  * Extracting `123456789` from a VOD URL reconstructs as `https://www.twitch.tv/videos/123456789`.
  * Extracting `FabulousSpunkyMonkey-abcde` from a clip URL (from either domain) reconstructs as `https://clips.twitch.tv/FabulousSpunkyMonkey-abcde`.

### 2.2 Call Twitch oEmbed API & Handle Graceful Degradation

The Twitch oEmbed endpoint is:
```
https://api.twitch.tv/v5/oembed?url=<reconstructed_url>
```
* **Authentication**: Depending on the client network environment, Twitch's v5 API may require auth headers or client IDs, or it may fail due to CORS. 
* **Graceful Degradation**: If Twitch's oEmbed endpoint rejects the request (non-200 response) or throws a network/CORS error, the function must catch the exception and return `null`. This matches the behavior of the YouTube oEmbed flow, where returning `null` signals the post-creator UI to display a neutral banner:
  > *"Could not verify video title (network issue). The confirmation checkbox is required to continue."*

### 2.3 Rendering Twitch Embeds in UI Components

To play embedded videos, `combo-card.js` and `post-card.js` must handle Twitch VODs and Clips. We will replace the inline YouTube-only extraction logic with a utility function `getEmbedUrl(url)` that supports both platforms:
* **Twitch VOD Embed**: Replaces `twitch.tv/videos/${videoId}` with:
  `https://player.twitch.tv/?video=${videoId}&parent=${window.location.hostname}&autoplay=false`
* **Twitch Clip Embed**: Replaces clip links with:
  `https://clips.twitch.tv/embed?clip=${clipSlug}&parent=${window.location.hostname}&autoplay=false`
* **Security & CORS**: The `parent` query parameter is **mandatory** for Twitch embeds; without it, modern browsers block the iframe from playing. Passing `window.location.hostname` ensures compatibility across local (localhost) and production domains.

---

## 3. Character-Specific Keyword Check Design

In addition to general game-wide validation, HitConfirm should support checking whether a video title specifically mentions the selected character when creating a post or building a combo.

### 3.1 Function Signature Update

We update `validateVideoTitle` to accept an optional third argument, `selectedChar`:
```javascript
export function validateVideoTitle(title, gameId, selectedChar)
```
* If `selectedChar` is provided, we match the video title specifically against keywords derived from that character.
* If `selectedChar` is omitted, the function falls back to checking the general `characterKeywords` array for the selected game.

### 3.2 Dynamic Character Keyword Derivation

To support newly added DLC characters without manual configuration updates, keywords are dynamically generated from the character's name using `deriveCharacterKeywords(charName)`:
1. **Normalize**: Lowercase and trim the name (e.g. `"Chun-Li"` $\rightarrow$ `"chun-li"`, `"M. Bison"` $\rightarrow$ `"m. bison"`).
2. **Original Name**: Keep the full normalized name as a keyword.
3. **Space-Replaced Name**: Replace dots, dashes, and underscores with spaces to support loose spelling (e.g. `"chun-li"` $\rightarrow$ `"chun li"`, `"m. bison"` $\rightarrow$ `"m bison"`).
4. **Collapsed Name**: Remove all spaces and punctuation entirely to support compressed spelling (e.g. `"chunli"`, `"mbison"`, `"aki"`).
5. **Stem/Word Extraction**: Split the space-normalized name by spaces into word parts. To prevent false positives from short, generic words (like "M" or "E"), only keep parts that are **3 or more characters** long (e.g., `"bison"` is kept, but `"m"` is ignored; `"chun"` is kept, but `"li"` is ignored to avoid matching words like "like" or "light").
   * *Note*: If a character's full name is short (e.g., `"JP"` or `"Ed"`), the full name is still included as a keyword by the earlier steps.

### 3.3 Matching Algorithm

We convert the title to lowercase and use `.some()` with `lowerTitle.includes(kw)` over the derived character keywords. Because we filter out stems under 3 characters (except for the full character name itself), substring matches remain highly reliable while preventing broad false positives.

---

## 4. Proposed Implementation Changes (Code Proposals)

### 4.1 Updates to `src/js/utils/video-validator.js`

```javascript
/**
 * Detects if a URL is a valid Twitch URL and returns a reconstructed clean Twitch URL.
 * Reconstructs standard VOD or Clip URLs to prevent SSRF / open-redirect.
 * Returns null if the URL does not match a recognized Twitch format.
 *
 * @param {string} url - Raw URL string from user input.
 * @returns {string|null} Reconstructed clean Twitch URL, or null if invalid.
 */
export function extractAndCleanTwitchUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  const ALLOWED_HOSTS = ['twitch.tv', 'www.twitch.tv', 'clips.twitch.tv'];
  let hostname, pathname;
  try {
    const parsed = new URL(trimmed);
    hostname = parsed.hostname;
    pathname = parsed.pathname;
  } catch {
    return null;
  }

  if (!ALLOWED_HOSTS.includes(hostname)) return null;

  if (hostname === 'clips.twitch.tv') {
    const match = pathname.match(/^\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://clips.twitch.tv/${match[1]}`;
    }
  } else {
    // VOD matching: /videos/12345
    const videoMatch = pathname.match(/^\/videos\/(\d+)/);
    if (videoMatch) {
      return `https://www.twitch.tv/videos/${videoMatch[1]}`;
    }

    // Clip matching: /channel/clip/Slug
    const clipMatch = pathname.match(/^\/[a-zA-Z0-9_]+\/clip\/([a-zA-Z0-9_-]+)/);
    if (clipMatch) {
      return `https://clips.twitch.tv/${clipMatch[1]}`;
    }
  }

  return null;
}

/**
 * Fetches the video title from Twitch's oEmbed API using only the validated/cleaned URL.
 * Returns null on any network, parsing, or auth errors (graceful degradation).
 *
 * @param {string} cleanUrl - A validated and reconstructed Twitch VOD or Clip URL.
 * @returns {Promise<string|null>} The video/clip title string, or null on failure.
 */
export async function fetchTwitchVideoTitle(cleanUrl) {
  if (!cleanUrl) return null;

  const oEmbedUrl = `https://api.twitch.tv/v5/oembed?url=${encodeURIComponent(cleanUrl)}`;

  try {
    const response = await fetch(oEmbedUrl);
    if (!response.ok) return null;
    const data = await response.json();
    return data.title || null;
  } catch {
    return null; // Gracefully degrade if network fails or auth is required
  }
}

/**
 * Derives a list of lowercase, case-insensitive keywords for a character name.
 * Handles punctuation (dots, hyphens) and generates multiple spelling variations.
 *
 * @param {string} charName - The name of the character (e.g., "Chun-Li", "M. Bison").
 * @returns {string[]} An array of lowercase keywords.
 */
export function deriveCharacterKeywords(charName) {
  if (!charName || typeof charName !== 'string') return [];
  const normalized = charName.toLowerCase().trim();
  const keywords = new Set();

  keywords.add(normalized);

  const spaceNorm = normalized.replace(/[-_.]/g, ' ').replace(/\s+/g, ' ').trim();
  keywords.add(spaceNorm);

  const collapsed = normalized.replace(/[-_.\s]/g, '');
  keywords.add(collapsed);

  const parts = spaceNorm.split(' ');
  for (const part of parts) {
    // Only extract word stems of length >= 3 to prevent matching single letters (e.g., "M")
    if (part.length >= 3) {
      keywords.add(part);
    }
  }

  return Array.from(keywords);
}

/**
 * Validates whether a video title meets HitConfirm's relevance requirements.
 * Checks for game keywords and game-wide character list or specific selected character keywords.
 *
 * @param {string} title        - The raw video title returned from the oEmbed API.
 * @param {string} gameId       - The game ID selected by the user.
 * @param {string} [selectedChar] - Optional selected character name.
 * @returns {{ isValid: boolean, hasGameKeyword: boolean, hasCharKeyword: boolean, label: string }}
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
    const charKeywords = deriveCharacterKeywords(selectedChar);
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

### 4.2 Updates to post creator form inside `src/js/pages/feed.js`

We update the validation flow in `feed.js` to process both YouTube and Twitch URLs, displaying generic errors for unsupported links, and running platform-specific oEmbed calls:

```javascript
  // Wire: URL input loses focus → run oEmbed check
  videoInput.addEventListener('blur', async () => {
    const rawUrl = videoInput.value.trim();
    const gameId = gameSelect.value;

    if (!rawUrl) { resetValidationUI(); return; }
    if (!gameId)  { resetValidationUI(); return; }

    const ytId = extractYouTubeVideoId(rawUrl);
    const twitchUrl = extractAndCleanTwitchUrl(rawUrl);

    if (!ytId && !twitchUrl) {
      validationBanner.style.display = 'block';
      validationBanner.style.background = 'rgba(239,68,68,0.06)';
      validationBanner.style.border = '1px solid rgba(239,68,68,0.2)';
      validationBanner.style.color = 'var(--color-danger)';
      validationBanner.innerHTML =
        '<i class="fa-solid fa-link-slash" style="margin-right: 6px;"></i>' +
        'That does not look like a valid YouTube or Twitch URL. Please use a full youtube.com, youtu.be, twitch.tv, or clips.twitch.tv link.';
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
    if (ytId) {
      rawTitle = await fetchVideoTitle(ytId);
    } else if (twitchUrl) {
      rawTitle = await fetchTwitchVideoTitle(twitchUrl);
    }

    const safeTitle = escapeHtml(rawTitle || '');
    // In this panel, character is not selected, so selectedChar parameter is omitted
    const result = rawTitle ? validateVideoTitle(rawTitle, gameId) : null;
    renderValidationBanner(result, safeTitle);
  });
```

### 4.3 Unified Embed Utility for `post-card.js` and `combo-card.js`

To play both YouTube and Twitch videos properly in UI cards, a shared utility function can be introduced or integrated directly:

```javascript
/**
 * Resolves any YouTube or Twitch URL into its standard iframe embed format.
 * Includes CORS mitigation parent hostnames for Twitch.
 *
 * @param {string} url - The video URL.
 * @returns {string} The resolved iframe src embed URL.
 */
export function getEmbedUrl(url) {
  if (!url) return '';
  
  // YouTube watch
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  // YouTube short
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  // YouTube embed
  if (url.includes('youtube.com/embed/')) {
    return url;
  }

  // Twitch VOD
  if (url.includes('twitch.tv/videos/')) {
    const videoId = url.split('videos/')[1]?.split(/[?&]/)[0];
    return `https://player.twitch.tv/?video=${videoId}&parent=${window.location.hostname}&autoplay=false`;
  }

  // Twitch Clips domain
  if (url.includes('clips.twitch.tv/')) {
    const clipSlug = url.split('clips.twitch.tv/')[1]?.split(/[?&]/)[0];
    return `https://clips.twitch.tv/embed?clip=${clipSlug}&parent=${window.location.hostname}&autoplay=false`;
  }

  // Twitch Channel Clip URL: twitch.tv/channel_name/clip/slug
  if (url.includes('/clip/')) {
    const clipSlug = url.split('/clip/')[1]?.split(/[?&]/)[0];
    return `https://clips.twitch.tv/embed?clip=${clipSlug}&parent=${window.location.hostname}&autoplay=false`;
  }

  return url;
}
```

---

## 5. Testing & Verification Plan

### 5.1 Unit Tests for Twitch Extraction

We add verification assertions in `src/js/utils/video-validator.test.mjs` to test clean-up functions:

```javascript
// Test extractAndCleanTwitchUrl
assert(
  'Twitch VOD URL extracts numeric ID and cleans',
  extractAndCleanTwitchUrl('https://www.twitch.tv/videos/18392019?t=00h10m15s'),
  'https://www.twitch.tv/videos/18392019'
);
assert(
  'Twitch Clip domain URL extracts slug and cleans',
  extractAndCleanTwitchUrl('https://clips.twitch.tv/FabulousSpunkyMonkey-abcde?filter=clips'),
  'https://clips.twitch.tv/FabulousSpunkyMonkey-abcde'
);
assert(
  'Twitch Channel Clip URL extracts slug and cleans',
  extractAndCleanTwitchUrl('https://www.twitch.tv/shroud/clip/FabulousSpunkyMonkey-abcde'),
  'https://clips.twitch.tv/FabulousSpunkyMonkey-abcde'
);
assert(
  'Unallowed hostnames return null',
  extractAndCleanTwitchUrl('https://evil-twitch.tv/videos/18392019'),
  null
);
```

### 5.2 Unit Tests for Character Keyword Check

We add verification assertions for character-specific validation:

```javascript
// Test deriveCharacterKeywords
assert(
  'Chun-Li generates correct keywords',
  deriveCharacterKeywords('Chun-Li').sort(),
  ['chun-li', 'chun li', 'chunli', 'chun'].sort()
);
assert(
  'M. Bison generates correct keywords',
  deriveCharacterKeywords('M. Bison').sort(),
  ['m. bison', 'm bison', 'mbison', 'bison'].sort()
);
assert(
  'A.K.I. generates correct keywords',
  deriveCharacterKeywords('A.K.I.').sort(),
  ['a.k.i.', 'a k i', 'aki'].sort()
);

// Test validateVideoTitle with selectedChar
assert(
  'Title matching game + selected character is valid',
  validateVideoTitle('SF6 Chun Li Combo Guide', 'sf6', 'Chun-Li').isValid,
  true
);
assert(
  'Title matching game + other character fails validation for selected character',
  validateVideoTitle('SF6 Ryu Combo Guide', 'sf6', 'Chun-Li').isValid,
  false
);
```
