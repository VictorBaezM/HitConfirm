# Milestone 1: Video Relevance Validation Analysis & Recommendations

## Executive Summary
This report details the architectural design and integration recommendations for updating the post creator's video relevance validation system in **HitConfirm** for Milestone 1. The updates introduce:
1. **Twitch URL Support:** Seamless detection, extraction, and canonicalization of Twitch VOD and Clip URLs with graceful degradation to allowlist-validated inputs and secure oEmbed title querying.
2. **Character-Specific Keyword Validation:** Transition from generic game-wide character checks to granular character-specific title checks using a programmatic character keyword derivation engine.
3. **UI/UX Refinements:** Dynamic icon swapping based on the URL type (YouTube/Twitch) and dynamic character selector rendering in the post creator.

All proposed changes strictly adhere to modularity (Separation of Concerns/SRP), secure endpoint standards (SSRF & Open-Redirect prevention), and automated QA verification.

---

## 1. Analysis of Current YouTube Validation
The existing system (`src/js/utils/video-validator.js`) validates YouTube videos using the following workflow:
1. **Host Check:** Parses raw user URL strings via standard `URL` parser and matches the hostname against `['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be']`.
2. **ID Extraction:** Applies strict regex to isolate the 11-character video ID from watch queries (`?v=`), shortened pathnames (`youtu.be/`), or embed links (`/embed/`).
3. **SSRF Prevention:** Instead of fetching the raw user URL, it interpolates the validated 11-character ID into a clean base URL (`https://www.youtube.com/oembed?url=...`). This guarantees that no arbitrary internal endpoints or malicious external endpoints are requested.
4. **Graceful Degradation:** If the fetch fails, is blocked, or throws a network error, it returns `null` to degrade gracefully.
5. **Validation Rule:** The retrieved title must contain at least one game keyword AND at least one character keyword matching the selected game's static list of characters.

---

## 2. Twitch Video & Clip Integration Strategy
To securely integrate Twitch VOD and Clip URLs, we propose extending the validator module with:
- `extractTwitchInfo(url)`: To parse and validate Twitch hosts and paths.
- `fetchTwitchVideoTitle(canonicalUrl)`: To call Twitch's oEmbed endpoint.

### A. Supported Twitch Formats
We target two primary Twitch formats:
- **Videos (VODs):** `https://(www.|m.)?twitch.tv/videos/\d+` (numeric ID)
- **Clips:** `https://clips.twitch.tv/[a-zA-Z0-9_-]+` (slug) or `https://(www.)?twitch.tv/[a-zA-Z0-9_-]+/clip/[a-zA-Z0-9_-]+` (channel clip slug)

### B. Prevention of SSRF & Open-Redirect (Secure Endpoint Guard)
To prevent URL injection and SSRF:
1. **Strict Host Whitelist:** Only accept hostnames matching `['twitch.tv', 'www.twitch.tv', 'm.twitch.tv', 'clips.twitch.tv']`.
2. **Path Sanitization:** Extract the alphanumeric slug or numeric ID using precise regular expressions.
3. **Canonical Re-construction:** Build a brand new, clean URL from scratch before sending it to Twitch's oEmbed endpoint:
   - Videos canonical: `https://www.twitch.tv/videos/${videoId}`
   - Clips canonical: `https://clips.twitch.tv/${clipSlug}`
   This ensures that no query parameters, malicious redirection payloads, or port injection bypasses are executed.

### C. Graceful Degradation on Authentication Checks
Twitch's oEmbed endpoint (`https://api.twitch.tv/v5/oembed?url=...`) may return a `401 Unauthorized` or `403 Forbidden` response in client-side environments due to missing Client-IDs or headers. 
Our design handles this by catching non-OK responses and network errors:
- Returns `null` from title fetching.
- The UI controller receives `null` and defaults to a neutral warning banner: *"Could not verify video title (network issue). The confirmation checkbox is required to continue."* This ensures users are never blocked from submitting their posts when third-party APIs fail.

---

## 3. Character-Specific Keyword Check Design
Currently, `validateVideoTitle` checks if the title contains *any* character from the game's entire roster. We will update the signature to:
`validateVideoTitle(title, gameId, selectedChar)`

- If `selectedChar` is provided, the function validates the title specifically against the keywords derived from that character.
- If `selectedChar` is omitted/null/undefined, it falls back to the original roster-wide check to maintain backward compatibility.

### A. Programmatic Character Keyword Derivation
Rather than maintaining static lists of keywords for every character, we implement a robust keyword generator:
- **Case-Insensitive base:** Convert the full character name to lowercase.
- **Punctuation Clean:** Remove symbols like `?`, `#`, `'`, `&` (e.g. `"Jack-O'"` -> `"jack-o"`, `"Bedman?"` -> `"bedman"`).
- **Slash Splitter:** Split grouped characters like `"Pyra/Mythra"` into separate targets: `"pyra"` and `"mythra"`.
- **Hyphen Replacer:** Generate alternatives for hyphens (e.g. `"Chun-Li"` -> `"chun li"`, `"chunli"`, `"chun-li"`).
- **Period Handling:** Generate alternatives for dotted initials (e.g. `"A.K.I."` -> `"aki"`, `"a.k.i"`; `"M. Bison"` -> `"m bison"`, `"mbison"`).
- **Title Stripping:** Remove single-letter honorifics to match the primary name (e.g. `"M. Bison"` -> `"bison"`, `"E. Honda"` -> `"honda"`).
- **Word Tokenization:** Split multi-word names (e.g. `"Sol Badguy"`) and filter out common stop words (`and`, `the`, `fit`, `trainer`). Add components longer than 2 characters (e.g. `"sol"`, `"badguy"`).

---

## 4. Proposed Code Integration

### A. `src/js/utils/video-validator.js`
```javascript
// --- Add new helper functions & update validateVideoTitle ---

/**
 * Extracts Twitch video ID or clip slug from a URL.
 * Supports:
 *   - VODs: https://(www.|m.)?twitch.tv/videos/<id>
 *   - Clips: https://clips.twitch.tv/<slug> or https://(www.)?twitch.tv/<channel>/clip/<slug>
 *
 * @param {string} url - Raw URL string from user input.
 * @returns {{ type: 'video'|'clip', id: string, canonicalUrl: string } | null}
 */
export function extractTwitchInfo(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return null;
  }

  const hostname = parsedUrl.hostname;
  const pathname = parsedUrl.pathname;

  const ALLOWED_HOSTS = ['twitch.tv', 'www.twitch.tv', 'm.twitch.tv', 'clips.twitch.tv'];
  if (!ALLOWED_HOSTS.includes(hostname)) return null;

  // 1. Clips: clips.twitch.tv/SlugName
  if (hostname === 'clips.twitch.tv') {
    const matchSlug = pathname.match(/^\/([a-zA-Z0-9_-]+)$/);
    if (matchSlug) {
      const slug = matchSlug[1];
      return {
        type: 'clip',
        id: slug,
        canonicalUrl: `https://clips.twitch.tv/${slug}`
      };
    }
  }

  // 2. VODs / channel clips: twitch.tv/videos/<id> or twitch.tv/<channel>/clip/<slug>
  if (['twitch.tv', 'www.twitch.tv', 'm.twitch.tv'].includes(hostname)) {
    const videoMatch = pathname.match(/^\/videos\/(\d+)$/);
    if (videoMatch) {
      const videoId = videoMatch[1];
      return {
        type: 'video',
        id: videoId,
        canonicalUrl: `https://www.twitch.tv/videos/${videoId}`
      };
    }

    const channelClipMatch = pathname.match(/^\/[a-zA-Z0-9_-]+\/clip\/([a-zA-Z0-9_-]+)$/);
    if (channelClipMatch) {
      const slug = channelClipMatch[1];
      return {
        type: 'clip',
        id: slug,
        canonicalUrl: `https://clips.twitch.tv/${slug}`
      };
    }
  }

  return null;
}

/**
 * Fetches Twitch video/clip title from Twitch's oEmbed API.
 * Uses a pre-validated, reconstructed canonical URL to prevent SSRF.
 * Degrades gracefully by returning null on network, CORS, 401, or 403 errors.
 *
 * @param {string} canonicalUrl - Validated Twitch video or clip canonical URL.
 * @returns {Promise<string|null>} The title string or null if fetch fails or auth is required.
 */
export async function fetchTwitchVideoTitle(canonicalUrl) {
  if (!canonicalUrl) return null;
  const oEmbedUrl = `https://api.twitch.tv/v5/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;

  try {
    const response = await fetch(oEmbedUrl);
    if (!response.ok) return null;
    const data = await response.json();
    return data.title || null;
  } catch {
    return null;
  }
}

/**
 * Derives search keywords from a character's name to support flexible, case-insensitive matching.
 * Converts "Chun-Li" -> ["chun-li", "chun li", "chunli", "chun", "li"]
 * Converts "M. Bison" -> ["m. bison", "m bison", "mbison", "bison"]
 *
 * @param {string} charName - Raw character name from database.
 * @returns {string[]} Lowercase derived keywords.
 */
export function getCharacterKeywords(charName) {
  if (!charName || typeof charName !== 'string') return [];

  const keywords = new Set();
  const lower = charName.toLowerCase().trim();

  keywords.add(lower);

  const cleanBase = lower.replace(/[?#'&]/g, '').trim();
  if (cleanBase && cleanBase !== lower) {
    keywords.add(cleanBase);
  }

  if (lower.includes('/')) {
    lower.split('/').forEach(p => {
      const trimmed = p.trim();
      if (trimmed) keywords.add(trimmed);
    });
  }

  if (lower.includes('-')) {
    keywords.add(lower.replace(/-/g, ' '));
    keywords.add(lower.replace(/-/g, ''));
  }

  if (lower.includes('.')) {
    keywords.add(lower.replace(/\.$/, '')); // strip trailing dot
    const noPeriods = lower.replace(/\./g, '');
    keywords.add(noPeriods);
    keywords.add(noPeriods.replace(/\s+/g, ''));

    const matchPrefix = lower.match(/^([a-z])\.\s+(.+)$/);
    if (matchPrefix) {
      keywords.add(matchPrefix[2]);
    }
  }

  const stopWords = new Set(['and', 'the', '&', 'fit', 'trainer', 'climancers', 'fighter']);
  const words = lower
    .replace(/[.\-/]/g, ' ')
    .split(/\s+/)
    .map(w => w.replace(/[?#'&]/g, '').trim())
    .filter(w => w.length > 0 && !stopWords.has(w));

  words.forEach(word => {
    if (word.length >= 2) {
      keywords.add(word);
    }
  });

  return Array.from(keywords);
}

/**
 * Validates whether a video title meets HitConfirm's relevance requirements.
 * Checks for game-related keywords AND character-related keywords.
 * If selectedChar is provided, character check is restricted to that character's keywords only.
 * If selectedChar is NOT provided, checks against any character in the game's default roster.
 */
export function validateVideoTitle(title, gameId, selectedChar) {
  const fallback = { isValid: false, hasGameKeyword: false, hasCharKeyword: false, label: gameId };

  if (!title || !gameId) return fallback;

  const gameData = GAME_VIDEO_KEYWORDS[gameId];
  if (!gameData) return { ...fallback, isValid: true };

  const lowerTitle = title.toLowerCase();
  const hasGameKeyword = gameData.gameKeywords.some(kw => lowerTitle.includes(kw));

  let targetKeywords = [];
  if (selectedChar) {
    targetKeywords = getCharacterKeywords(selectedChar);
  } else {
    targetKeywords = gameData.characterKeywords;
  }

  const hasCharKeyword = targetKeywords.some(kw => lowerTitle.includes(kw));

  return {
    isValid: hasGameKeyword && hasCharKeyword,
    hasGameKeyword,
    hasCharKeyword,
    label: gameData.label
  };
}
```

### B. UI Integration in `src/js/pages/feed.js`
1. **Dynamic Character Select Input:**
   Add a dropdown container `#post-character-select-container` in `renderCreatorBox` layout, which dynamically populates with character options based on the chosen game.
2. **Swap Platform Icon & Placeholder:**
   Monitor URL typing to swap out red YouTube logo (`fa-youtube`) / purple Twitch logo (`fa-twitch`) dynamically in the text field prefix.
3. **Generalized Title Fetching Flow:**
   Update the input `blur` handler to orchestrate both YouTube and Twitch queries:

```javascript
  // --- Inside renderCreatorBox in feed.js ---

  // HTML adjustment for character select and brand icon
  // Place inside mount.innerHTML:
  /*
  <div class="flex gap-3" style="flex-wrap: wrap; margin-bottom: 8px;">
    <!-- Game Dropdown tag -->
    <div style="flex: 1; min-width: 140px;">
      <select class="form-select post-game-select" style="padding: 8px 12px; font-size: 0.85rem;" id="post-game-select">
        <option value="">Tag Game (Optional)</option>
        ${Object.values(games).map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
      </select>
    </div>

    <!-- Character Dropdown tag (Dynamic) -->
    <div style="flex: 1; min-width: 140px; display: none;" id="post-character-select-container">
      <select class="form-select post-character-select" style="padding: 8px 12px; font-size: 0.85rem;" id="post-character-select">
        <option value="">Tag Character (Optional)</option>
      </select>
    </div>

    <!-- Video Input Link -->
    <div style="flex: 2; min-width: 200px; display: flex; align-items: center; position: relative;">
      <i class="fa-solid fa-video" id="video-input-icon" style="position: absolute; left: 12px; color: var(--text-muted); font-size: 1.1rem;"></i>
      <input type="text" class="form-input post-video-input" id="post-video-input"
        placeholder="YouTube or Twitch URL (Optional)"
        style="padding: 8px 12px 8px 36px; font-size: 0.85rem;" />
    </div>
  </div>
  */

  const charSelectContainer = mount.querySelector('#post-character-select-container');
  const charSelect = mount.querySelector('#post-character-select');
  const videoIcon = mount.querySelector('#video-input-icon');

  const updateCharacterDropdown = () => {
    const gameId = gameSelect.value;
    if (!gameId) {
      charSelectContainer.style.display = 'none';
      charSelect.value = '';
      return;
    }
    const gameData = games[gameId];
    if (!gameData || !gameData.characters) {
      charSelectContainer.style.display = 'none';
      charSelect.value = '';
      return;
    }
    charSelect.innerHTML = `
      <option value="">Tag Character (Optional)</option>
      ${gameData.characters.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
    `;
    charSelectContainer.style.display = 'block';
  };

  // Listen to game change to update characters
  gameSelect.addEventListener('change', () => {
    updateCharacterDropdown();
    updateFormatHint();
    if (videoInput.value.trim()) videoInput.dispatchEvent(new Event('blur'));
  });

  // Listen to character change to re-trigger validation on existing URL
  charSelect.addEventListener('change', () => {
    if (videoInput.value.trim()) videoInput.dispatchEvent(new Event('blur'));
  });

  // Real-time Brand Icon swap
  videoInput.addEventListener('input', () => {
    const val = videoInput.value.trim().toLowerCase();
    if (!val) {
      videoIcon.className = 'fa-solid fa-video';
      videoIcon.style.color = 'var(--text-muted)';
    } else if (val.includes('youtube.com') || val.includes('youtu.be')) {
      videoIcon.className = 'fa-brands fa-youtube';
      videoIcon.style.color = '#ff0000';
    } else if (val.includes('twitch.tv')) {
      videoIcon.className = 'fa-brands fa-twitch';
      videoIcon.style.color = '#9146ff';
    } else {
      videoIcon.className = 'fa-solid fa-video';
      videoIcon.style.color = 'var(--text-muted)';
    }
  });

  // Update input blur handler to resolve platform & titles
  videoInput.addEventListener('blur', async () => {
    const rawUrl = videoInput.value.trim();
    const gameId = gameSelect.value;
    const selectedChar = charSelect.value;

    if (!rawUrl || !gameId) { resetValidationUI(); return; }

    // Resolve Platform
    let platform = null;
    let videoId = null;
    let canonicalUrl = null;

    const ytId = extractYouTubeVideoId(rawUrl);
    if (ytId) {
      platform = 'youtube';
      videoId = ytId;
    } else {
      const twitchInfo = extractTwitchInfo(rawUrl);
      if (twitchInfo) {
        platform = 'twitch';
        canonicalUrl = twitchInfo.canonicalUrl;
      }
    }

    if (!platform) {
      validationBanner.style.display = 'block';
      validationBanner.style.background = 'rgba(239,68,68,0.06)';
      validationBanner.style.border = '1px solid rgba(239,68,68,0.2)';
      validationBanner.style.color = 'var(--color-danger)';
      validationBanner.innerHTML =
        '<i class="fa-solid fa-link-slash" style="margin-right: 6px;"></i>' +
        'That does not look like a valid YouTube or Twitch URL.';
      confirmRow.style.display = 'none';
      return;
    }

    // Checking UI state
    validationBanner.style.display = 'block';
    validationBanner.style.background = 'rgba(59,130,246,0.05)';
    validationBanner.style.border = '1px solid rgba(59,130,246,0.12)';
    validationBanner.style.color = 'var(--text-muted)';
    validationBanner.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i>Checking video title...';

    // Fetch Title
    let rawTitle = null;
    if (platform === 'youtube') {
      rawTitle = await fetchVideoTitle(videoId);
    } else if (platform === 'twitch') {
      rawTitle = await fetchTwitchVideoTitle(canonicalUrl);
    }

    const safeTitle = escapeHtml(rawTitle || '');
    const result = rawTitle ? validateVideoTitle(rawTitle, gameId, selectedChar) : null;
    renderValidationBanner(result, safeTitle);
  });
```

### C. Live Document Update for `docs/API_REFERENCE.md`
To align with the `Modular Architecture & Living Documentation Architect` skill instructions, the following additions should be appended to `docs/API_REFERENCE.md` in the `video-validator.js` section:

```markdown
#### `extractTwitchInfo(url)`
* **Description:** Extracts the video ID or clip slug from a full Twitch URL and generates a secure canonical URL. Whitelists Twitch hosts to mitigate SSRF.
* **Parameters:**
  * `url` (`string`): The raw URL entered by the user.
* **Returns:** `Object | null` - An object containing `type` ('video' | 'clip'), `id` (the parsed ID/slug), and `canonicalUrl` (clean target for oEmbed calls), or `null` if the URL is invalid.

#### `fetchTwitchVideoTitle(canonicalUrl)`
* **Description:** Fetches the title of a Twitch clip or VOD from Twitch's oEmbed endpoint. Gracefully degrades to return `null` on failure (e.g., auth, CORS, or offline).
* **Parameters:**
  * `canonicalUrl` (`string`): Whitelisted and canonicalized Twitch URL.
* **Returns:** `Promise<string | null>` - The video/clip title, or `null` if unauthorized/failed.

#### `getCharacterKeywords(charName)`
* **Description:** Generates a list of lowercase lookup keywords derived from a character's primary name to enable highly flexible and matching title validations.
* **Parameters:**
  * `charName` (`string`): The exact character name (e.g. `'Chun-Li'`).
* **Returns:** `string[]` - An array of derived lowercase keywords.
```

---

## 5. Verification Plan (Strategic Feature Verification Tester)

### A. Unit Testing Strategy
We will execute unit tests for the pure logic tier in `src/js/utils/video-validator.test.mjs` without any external I/O or DOM dependencies:
1. **Twitch URL Extraction:**
   - Happy Paths: Verify standard VOD links (`twitch.tv/videos/123`), mobile VODs (`m.twitch.tv/videos/123`), short clip links (`clips.twitch.tv/Slug`), and channel clip links (`twitch.tv/user/clip/Slug`) correctly output the clean ID and correct canonical URLs.
   - Attack Mitigation: Check that external domains (`evil.com/videos/123` or URLs with open redirects) return `null`.
2. **Keyword Generation:**
   - Verify `"Chun-Li"` generates `["chun-li", "chun li", "chunli", "chun", "li"]`.
   - Verify `"M. Bison"` generates `["m. bison", "m bison", "mbison", "bison"]`.
   - Verify `"A.K.I."` generates `["aki", "a.k.i.", "a.k.i"]`.
   - Verify `"Sol Badguy"` generates `["sol badguy", "sol", "badguy"]`.
3. **Relevance Validation:**
   - Verify `validateVideoTitle("SF6 Chun-Li combo guide", "sf6", "Chun-Li")` returns `isValid: true`.
   - Verify `validateVideoTitle("SF6 Ryu combos", "sf6", "Chun-Li")` returns `isValid: false` (since character mismatch occurs).
   - Verify `validateVideoTitle("SF6 Ryu combos", "sf6")` returns `isValid: true` (for backward compatibility when no character is selected).

### B. Manual / Integration Testing Strategy
1. **oEmbed Graceful Degradation:** Check that blocking network access to `api.twitch.tv` or mock-returning a `401 Unauthorized` allows the post creation box to show the fallback banner and confirmation checkbox without throwing errors.
2. **Dynamic UI Rendering:** Select "Street Fighter 6", verify the character dropdown appears and displays SF6 characters. Select "Chun-Li" and type in a video URL; check that the verification is updated to enforce the character.
