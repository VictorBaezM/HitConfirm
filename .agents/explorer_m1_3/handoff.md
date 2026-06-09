# Handoff Report — Explorer Milestone 1 (Video Relevance Validation)

This report details the investigation and design findings for adding Twitch oEmbed validation support and character-specific title verification to HitConfirm.

---

## 1. Observation

Direct code observations from the HitConfirm codebase:
1. **YouTube-Only Scope**: In `src/js/utils/video-validator.js`, the validation code is hardcoded to YouTube URLs:
   - Line 90: `const ALLOWED_HOSTS = ['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be'];`
   - Line 129: `const oEmbedUrl = \`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=\${videoId}&format=json\`;`
2. **Video Validation Flow**: In `src/js/pages/feed.js`, the creator box blur handler runs YouTube-specific checks:
   - Line 505: `const videoId = extractYouTubeVideoId(rawUrl);`
   - Line 525: `const rawTitle = await fetchVideoTitle(videoId);`
   - Line 527: `const result = rawTitle ? validateVideoTitle(rawTitle, gameId) : null;`
3. **Embed Layout Duplication**: Both `src/js/components/combo-card.js` (lines 28-35) and `src/js/components/post-card.js` (lines 19-27) perform inline string-splitting to convert standard YouTube watch URLs into `youtube.com/embed/...` format for standard iframes:
   - Line 29-31 (`combo-card.js`):
     ```javascript
     if (combo.videoUrl.includes('youtube.com/watch?v=')) {
       const videoId = combo.videoUrl.split('v=')[1]?.split('&')[0];
       embedUrl = `https://www.youtube.com/embed/${videoId}`;
     }
     ```
4. **Game & Character Structure**: Character names are arrays stored under game configs in `src/js/store.js` (lines 9, 15, 21, 27). For example:
   - Line 9: `sf6: { characters: ['A.K.I.', 'Akuma', 'Blanka', 'Cammy', 'Chun-Li', ...] }`
   - Line 15: `t8: { characters: ['Alisa', 'Asuka', ...] }`

---

## 2. Logic Chain

1. **Security & SSRF Mitigation**: To safely support Twitch URLs (VODs and Clips), we must parse, validate, and reconstruct URLs to avoid open-redirect and SSRF vectors (Observation 1 & 3). We do this by checking a strict hostname allowlist (`twitch.tv`, `www.twitch.tv`, `clips.twitch.tv`), extracting only numeric video IDs or alphanumeric clip slugs, and outputting clean canonical URLs.
2. **Graceful Degradation**: By calling `https://api.twitch.tv/v5/oembed?url=<url>`, if the request fails due to missing auth headers or CORS restrictions, the fetch catch block will return `null`. In the creator box UI, returning `null` correctly falls back to displaying a neutral banner prompting for manual checkmark confirmation (Observation 2).
3. **Selected Character Search**: To check if a title mentions the selected character, we update `validateVideoTitle` to accept `selectedChar` (Observation 4). To support DLC characters added dynamically in the database, we derive keywords dynamically by converting the name to lowercase, generating space/punctuation-stripped formats, and extracting word stems with length $\ge 3$ (e.g. `"Chun-Li"` $\rightarrow$ `"chun-li", "chun li", "chunli", "chun"`). This avoids false positives on short words like `"li"` or `"m"`.
4. **Embed Consolidation**: Creating a shared `getEmbedUrl(url)` utility avoids duplicate code in `combo-card.js` and `post-card.js` (Observation 3).

---

## 3. Caveats

* **External API Verification**: The Twitch oEmbed endpoint (`https://api.twitch.tv/v5/oembed`) was not hit live during this investigation due to code-only restrictions. Standard oEmbed structures are assumed.
* **Twitch Embed Host Restrictions**: Twitch embedded players require a `parent` query parameter matching the browser window's hostname. The parameter `&parent=${window.location.hostname}` has been incorporated into the design to satisfy this.

---

## 4. Conclusion

The video validation updates can be safely implemented without breaking existing YouTube functionality. The proposed changes:
* Add Twitch VOD and Clip detection and oEmbed lookup.
* Gracefully degrade oEmbed auth errors to a user-facing checkmark confirmation.
* Dynamically derive character-specific keywords (handling "Chun-Li" $\rightarrow$ "chun li", "M. Bison" $\rightarrow$ "bison", etc.) to validate post titles against the selected character.

Our complete design and code proposals have been written to `c:\Users\Omen\Desktop\GitHub\HitConfirm\.agents\explorer_m1_3\analysis.md`.

---

## 5. Verification Method

1. **Analysis Check**: Review `c:\Users\Omen\Desktop\GitHub\HitConfirm\.agents\explorer_m1_3\analysis.md`.
2. **Unit Tests**: Propose running the following test suite addition in `src/js/utils/video-validator.test.mjs`:
   - `extractAndCleanTwitchUrl('https://www.twitch.tv/videos/123456')` $\rightarrow$ `'https://www.twitch.tv/videos/123456'`
   - `extractAndCleanTwitchUrl('https://clips.twitch.tv/FabulousSlug')` $\rightarrow$ `'https://clips.twitch.tv/FabulousSlug'`
   - `deriveCharacterKeywords('Chun-Li')` $\rightarrow$ `['chun-li', 'chun li', 'chunli', 'chun']`
   - `deriveCharacterKeywords('M. Bison')` $\rightarrow$ `['m. bison', 'm bison', 'mbison', 'bison']`
3. **Execution command**: `node --experimental-vm-modules src/js/utils/video-validator.test.mjs`
