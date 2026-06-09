# Handoff Report — Video Relevance Validation Review

## 1. Observation
We have inspected the modified files and related files in the codebase:
- `src/js/utils/video-validator.js`: Implements video URL parsers, Twitch/YouTube fetch, and relevance validation.
- `src/js/utils/video-validator.test.mjs`: Test suite for the pure utility functions.
- `src/js/pages/builder.js`: Integration of video validation on the Combo Builder page.
- `docs/API_REFERENCE.md`: Javadocs-standard documentation updates.
- `tests/e2e/builder-video-validation.spec.js`: Playwright E2E test scenarios.

Specific code snippets observed:
1. **Twitch Host Allowlisting & Extraction** in `src/js/utils/video-validator.js` (lines 201-232):
   ```javascript
   const ALLOWED_HOSTS = ['twitch.tv', 'www.twitch.tv', 'm.twitch.tv', 'clips.twitch.tv'];
   ...
   const vodMatch = pathname.match(/\/videos\/(\d+)/);
   ...
   const clipMatch = pathname.match(/\/clip\/([a-zA-Z0-9_-]+)/);
   ```
2. **Twitch oEmbed construction** in `src/js/utils/video-validator.js` (lines 242-254):
   ```javascript
   const oEmbedUrl = `https://api.twitch.tv/v5/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
   ```
3. **XSS Protection** in `src/js/pages/builder.js` (lines 436-479):
   ```javascript
   const safeTitle = escapeHtml(rawTitle || '');
   ...
   validationBanner.innerHTML = `Video "${safeTitle}" looks relevant to <strong>${escapeHtml(result.label)}</strong>.`;
   ```
4. **Validation Checkbox Reveal on Submission** in `src/js/pages/builder.js` (lines 717-725):
   ```javascript
   const videoUrlVal = document.getElementById('combo-video').value.trim();
   if (videoUrlVal && !document.getElementById('video-confirm-checkbox').checked) {
     window.showToast('Please confirm that the video is relevant to the tagged game.');
     const confirmRow = document.getElementById('video-confirm-row');
     if (confirmRow) confirmRow.style.display = 'block';
     ...
   }
   ```
5. **Video Embed Rendering** in `src/js/components/combo-card.js` (lines 37-44) and `src/js/components/post-card.js` (lines 29-34):
   ```javascript
   videoHtml = `
     <div class="video-container hidden" style="margin-top: 16px;">
       <div class="video-wrapper">
         <iframe src="${embedUrl}" allowfullscreen></iframe>
       </div>
     </div>
   `;
   ```

## 2. Logic Chain
1. **Correctness**:
   - The validation rules correctly parse and check YouTube and Twitch titles against per-game keyword definitions.
   - For character-specific validation, `getCharacterKeywords` decomposes character names (e.g. `Chun-Li`, `M. Bison`) into multiple variants (spaced, collapsed, tokenized, and stop-words filtered). This ensures that variations commonly found in video titles (e.g., "Chun Li", "Chunli", "Bison") are matched successfully.
   - Twitch VODs and clips are parsed correctly, resolving to canonical URLs and fetching from Twitch's oEmbed endpoint.
2. **Security & SSRF Mitigation**:
   - URL parsing uses a strict host allowlist (`ALLOWED_HOSTS`).
   - Only validated, structured parts of the URLs (11-character ID for YouTube, digit-only VOD ID or alphanumeric Clip slug for Twitch) are used to build the oEmbed fetch URL. This prevents SSRF or open redirect injection via malformed query parameters or user-controlled hosts.
3. **CORS Handling**:
   - Direct requests to `https://api.twitch.tv/v5/oembed` may trigger CORS restrictions in standard browsers. The code correctly handles this by enclosing the fetch in a `try-catch` block and returning `null`.
   - The UI handles the `null` response gracefully by notifying the user that the title could not be automatically verified, but allows them to proceed by checking the confirmation checkbox.
4. **XSS Mitigation**:
   - Both the video title and the game label are escaped using `escapeHtml()` before inserting them into the banner's `innerHTML`.
5. **Security Gaps (Adversarial Review)**:
   - **Validation Bypass**: If a user enters a completely invalid/malicious URL (e.g. `https://evil.com/phishing`), the blur handler flags it and hides the confirmation checkbox. However, when the user clicks "Publish", the submit handler reveals the checkbox (`confirmRow.style.display = 'block'`). Once checked, the submission is allowed to proceed.
   - **Unsandboxed Iframe Injection**: The unvalidated URL is saved to the database. During rendering in `combo-card.js` and `post-card.js`, this URL is loaded directly as the `src` of an iframe without any `sandbox` attributes. This introduces a vulnerability where malicious hosts can load clickjacking/phishing pages or execute frame busting scripts.

## 3. Caveats
- We assumed browser-side oEmbed is intended, which has inherent CORS limitations for Twitch. The graceful degradation path (manual confirmation checkbox) successfully mitigates this.
- Database-level constraint validation was not investigated since it is out of the scoped client-side files, but client-side controls currently allow saving arbitrary video URLs.

## 4. Conclusion
The implementation of video relevance validation on the Combo Builder page is **Correct, Modular, and Conforms to API Design Guidelines**. It introduces robust SSRF/XSS protection in URL parsing and title rendering.

However, a **Security Gap** exists:
- Users can bypass the YouTube/Twitch URL check by checking the confirmation checkbox (which is revealed upon a blocked submission), allowing arbitrary URLs to be saved.
- These URLs are rendered in unsandboxed iframes in `combo-card.js` and `post-card.js`, leading to a potential iframe injection/phishing vulnerability.

**Verdict**: **PASS WITH RECOMMENDATIONS** (The requested functionality is correct, but security mitigations should be applied).
*Recommendation*:
1. Validate that the submitted URL is indeed a valid YouTube or Twitch URL (by ensuring it extracts a valid ID/info) in the submit handler, rather than allowing any arbitrary URL when the checkbox is checked.
2. Add a `sandbox="allow-scripts allow-same-origin"` attribute to the iframes in `combo-card.js` and `post-card.js`.

## 5. Verification Method
1. Run Playwright E2E tests:
   ```powershell
   npx playwright test tests/e2e/builder-video-validation.spec.js
   ```
2. Run unit tests for validation utilities:
   ```powershell
   node --experimental-vm-modules src/js/utils/video-validator.test.mjs
   ```
3. Inspect `src/js/pages/builder.js` line 718 to see the validation bypass path, and `src/js/components/combo-card.js` line 40 to see iframe injection.
