// src/js/pages/character.js
// Page to display detailed frame data for a specific character with sorting and filtering.
// Expected navigation call: navigate('character', { gameId: 'ggst', charName: 'Sol Badguy' })

import store from '../store.js';
import { cleanDustloopValue, parseNumericValue, formatAdvantageBadge } from '../utils/dustloop-helpers.js';
import { parseStrategyHubNotationToHtml } from '../utils/combo-parser.js';
import { resolvePortraitUrl, resolveFileUrls, PLACEHOLDER_SVG, constructCdnUrl, getWikiFilename, getLocalPortraitUrl, getCachedPortraitUrl, WIKI_CONFIG, saveResolvedImageUrl, getResolvedImageUrl, deleteResolvedImageUrl, deleteCachedPortraitUrl } from '../utils/portrait-resolver.js';
import { hideGameSidebar } from '../components/game-sidebar.js';

export function renderCharacterPage(navigateCallback, options = {}) {
  const { gameId, charName } = options;
  const mount = document.getElementById('content-mount');
  if (!mount) return;

  hideGameSidebar();
  mount.className = 'has-right-sidebar';

  const localPortraitUrl = getLocalPortraitUrl(gameId, charName);
  const cachedUrl = getCachedPortraitUrl(gameId, charName);
  let portraitUrl;
  let initialStage;
  if (localPortraitUrl) {
    portraitUrl = localPortraitUrl;
    initialStage = 0;
  } else if (cachedUrl) {
    portraitUrl = cachedUrl;
    initialStage = 2;
  } else {
    const filename = getWikiFilename(gameId, charName);
    portraitUrl = constructCdnUrl(filename, gameId);
    initialStage = 1;
  }

  const KNOWN_LOGOS = ['ggst', 'sf6', 'ssbu', 't8'];
  const logoHtml = KNOWN_LOGOS.includes(gameId)
    ? `<img src="src/images/logo_${gameId}.png" alt="${getGameName(gameId)} Logo" class="game-header-logo-large" onerror="this.style.display='none';" />`
    : `<i class="fa-solid fa-gamepad game-header-logo-large text-muted" style="font-size: 28px; width: 32px; text-align: center;"></i>`;

  // Page level state
  let searchQuery = '';
  let sortByField = '';
  let sortOrder = 'asc'; // 'asc' or 'desc'
  let rawRows = [];

  // Stateful Loading Logic to hide overlay only when all elements are fully loaded
  let dataLoaded = false;
  let portraitLoaded = false;
  let logoLoaded = false;

  function updateProgress() {
    let resolvedCount = 0;
    if (dataLoaded) resolvedCount++;
    if (portraitLoaded) resolvedCount++;
    if (logoLoaded) resolvedCount++;

    const percentage = Math.round((resolvedCount / 3) * 100);
    
    const fill = document.getElementById('char-progress-fill');
    const text = document.getElementById('char-progress-text');
    if (fill) fill.style.width = `${percentage}%`;
    
    if (text) {
      let statusMsg = '';
      if (!dataLoaded) {
        statusMsg = 'Loading frame data...';
      } else if (!portraitLoaded) {
        statusMsg = 'Loading character portrait...';
      } else if (!logoLoaded) {
        statusMsg = 'Loading game logo...';
      } else {
        statusMsg = 'Ready!';
      }
      text.textContent = `${statusMsg} (${resolvedCount} / 3 loaded, ${percentage}%)`;
    }
  }

  function checkAllReady() {
    if (dataLoaded && portraitLoaded && logoLoaded) {
      hideLoader();
    }
  }

  function hideLoader() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    const overlay = document.getElementById('char-loading-overlay');
    const pageContainer = mount.querySelector('.character-page');
    if (overlay && pageContainer) {
      overlay.classList.add('fade-out');
      pageContainer.classList.remove('loading');
      setTimeout(() => {
        overlay.classList.add('hidden');
      }, 350);
    }
  }

  let timeoutId = setTimeout(() => {
    hideLoader();
  }, 15000); // 15-second safety fallback timeout

  // Main Page Layout Structure
  mount.innerHTML = `
    <div style="position: relative; min-height: 400px; width: 100%;">
      <!-- Page Loading Overlay -->
      <div id="char-loading-overlay" class="char-loading-overlay">
        <div class="loader-content">
          <div class="spinner"></div>
          <div class="loading-progress-container">
            <div class="loading-progress-bar">
              <div id="char-progress-fill" class="loading-progress-fill"></div>
            </div>
            <div id="char-progress-text" class="loading-progress-text">Loading character data...</div>
          </div>
        </div>
      </div>

      <div class="character-page char-page-container loading">
        <button class="btn btn-secondary btn-sm" id="btn-back">← Back to Strategy Hub</button>
        
        <div class="character-header flex justify-between items-end gap-4 mt-6 pb-6">
          <div class="flex items-center gap-4">
            <img id="char-header-portrait" src="${portraitUrl}" alt="${charName}" class="character-portrait-large" referrerpolicy="no-referrer" />
            <div>
              <h1 class="gradient-text m-0">${charName}</h1>
              <p class="text-secondary m-0 mt-1">${getGameName(gameId)} Frame Data</p>
            </div>
          </div>
          ${logoHtml}
        </div>

        <!-- Controls & Search -->
        <div id="character-table-mount">
          <!-- Will be populated dynamically by loading or drawing -->
          <div class="spinner-container p-12 text-center">
            <div class="spinner"></div>
            <p class="text-muted mt-2">Loading frame data from Supabase cache...</p>
          </div>
        </div>

        <div class="license-footer p-4 text-sm text-center">
          <a href="LICENSES.txt" target="_blank" class="text-muted hover:underline">Image Credits & Licenses</a>
        </div>
      </div>
    </div>
  `;

  // Initial progress update
  updateProgress();

  // Attach back button listener
  document.getElementById('btn-back').addEventListener('click', function () {
    navigateCallback('hub');
  });

  // Handle dismiss-on-click-outside for hitbox/hurtbox tooltips
  const clickOutsideHandler = function (e) {
    // If the character page is no longer in the DOM, clean up this event listener
    if (!document.getElementById('char-header-portrait')) {
      document.removeEventListener('click', clickOutsideHandler);
      return;
    }
    if (!e.target.closest('.hitbox-helper')) {
      document.querySelectorAll('.hitbox-helper.active').forEach(helper => {
        helper.classList.remove('active');
      });
    }
  };
  document.addEventListener('click', clickOutsideHandler);


  // Attach portrait fallback listener
  const headerImg = document.getElementById('char-header-portrait');
  
  function checkPortraitLoaded() {
    if (portraitLoaded) return;
    portraitLoaded = true;
    updateProgress();
    checkAllReady();
  }

  if (headerImg) {
    if (headerImg.complete) {
      checkPortraitLoaded();
    } else {
      headerImg.addEventListener('load', checkPortraitLoaded);
    }
    
    let stage = initialStage; // 0: local, 1: constructed CDN, 2: API query, 3: placeholder
    headerImg.onerror = function () {
      if (stage === 0) {
        stage = 1;
        const filename = getWikiFilename(gameId, charName);
        headerImg.src = constructCdnUrl(filename, gameId);
      } else if (stage === 1) {
        stage = 2;
        resolvePortraitUrl(gameId, charName).then(url => {
          headerImg.src = url;
        }).catch(() => {
          deleteCachedPortraitUrl(gameId, charName); // Invalidate cache on failure
          stage = 3;
          headerImg.onerror = null;
          headerImg.src = PLACEHOLDER_SVG;
          checkPortraitLoaded();
        });
      } else {
        deleteCachedPortraitUrl(gameId, charName); // Invalidate cache on failure
        headerImg.onerror = null;
        headerImg.src = PLACEHOLDER_SVG;
        checkPortraitLoaded();
      }
    };
  } else {
    portraitLoaded = true;
  }

  // Attach logo image listener
  const logoImg = mount.querySelector('.game-header-logo-large');
  
  function checkLogoLoaded() {
    if (logoLoaded) return;
    logoLoaded = true;
    updateProgress();
    checkAllReady();
  }

  if (logoImg && logoImg.tagName === 'IMG') {
    if (logoImg.complete) {
      checkLogoLoaded();
    } else {
      logoImg.addEventListener('load', checkLogoLoaded);
      logoImg.addEventListener('error', checkLogoLoaded);
    }
  } else {
    logoLoaded = true;
    updateProgress();
  }

  // Load the frame data
  store.fetchDustloopData(gameId).then(data => {
    // Check if the game is unsupported
    if (data && data._unsupported) {
      drawUnsupportedState(data.note || 'Data is not supported for this title.');
      dataLoaded = true;
      updateProgress();
      checkAllReady();
      return;
    }
    
    rawRows = data || [];
    drawTableContainer();
    dataLoaded = true;
    updateProgress();
    checkAllReady();
  }).catch(err => {
    const container = document.getElementById('character-table-mount');
    if (container) {
      container.innerHTML = `
        <div class="unsupported-notice">
          <i class="fa-solid fa-triangle-exclamation unsupported-icon"></i>
          <h3 class="text-danger">Failed to Load Frame Data</h3>
          <p class="text-muted">${err.message || err}</p>
        </div>
      `;
    }
    dataLoaded = true;
    updateProgress();
    checkAllReady();
  });

  // Draw notice for unsupported titles (Phase 2 placeholder)
  function drawUnsupportedState(note) {
    const container = document.getElementById('character-table-mount');
    if (!container) return;

    container.innerHTML = `
      <div class="unsupported-notice">
        <i class="fa-solid fa-triangle-exclamation unsupported-icon"></i>
        <h3>Phase 2 Expansion</h3>
        <p class="text-secondary max-w-md mt-2 mb-6">
          HitConfirm currently fetches frame data from Dustloop for Arc System Works titles in Phase 1. 
          Support for this title is coming in Phase 2.
        </p>
        <div class="badge badge-secondary p-3">${note}</div>
      </div>
    `;
  }

  // Draw the wrapper cards, search bar, and mount the table rows
  function drawTableContainer() {
    const container = document.getElementById('character-table-mount');
    if (!container) return;

    // Filter rows belonging to this character first
    const characterRows = rawRows.filter(r => 
      (r.chara || r.Character || r.character || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === 
      charName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    );

    if (characterRows.length === 0) {
      container.innerHTML = `
        <div class="unsupported-notice">
          <i class="fa-solid fa-folder-open unsupported-icon"></i>
          <h3>No Data Available</h3>
          <p class="text-muted">No frame data rows match character "${charName}".</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-controls flex justify-between items-center flex-wrap gap-4">
        <div class="search-wrapper w-full md:w-72 relative">
          <i class="fa-solid fa-magnifying-glass search-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-muted"></i>
          <input type="text" id="table-search" class="form-input pl-10 w-full" placeholder="Search moves by name or input... (Click rows to view hitboxes)" value="${searchQuery}" />
        </div>
        <div id="preloader-status-container" class="preloader-status-container hidden">
          <span id="preloader-status-text">Caching move images...</span>
          <div class="preloader-bar">
            <div id="preloader-fill" class="preloader-fill"></div>
          </div>
        </div>
        <!-- Joystick toggle UI removed -->
        </div>
      </div>

      <div class="frame-data-card">
        <div class="frame-data-table-wrapper">
          <table class="frame-data-table" id="data-table-el">
            <!-- Table headers and body will be injected here -->
          </table>
        </div>
      </div>
    `;

    // Attach search box listener
    const searchInput = document.getElementById('table-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderRows(characterRows);
      });
    }

    // Initial render of rows
    renderRows(characterRows);

    // Start background preloading of all character move images
    preloadCharacterMoveImages(characterRows, gameId);
  }

  // Render the table header and body rows based on search and sort states
  function renderRows(filteredRows) {
    const tableEl = document.getElementById('data-table-el');
    if (!tableEl) return;

    // 1. Filter moves matching the search input (name or input)
    let processedRows = filteredRows.filter(row => {
      const name = String(row.name || '').toLowerCase();
      const input = String(row.input || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query) || input.includes(query);
    });

    // 2. Map columns dynamically based on keys present in the first row
    // We omit 'chara' / 'character', 'images', and 'hitboxes' from columns
    const allKeys = processedRows.length > 0 ? Object.keys(processedRows[0]) : [];
    const fieldsToRender = allKeys.filter(key => 
      !['chara', 'character', 'Char', 'images', 'hitboxes'].includes(key)
    );

    // Map fields to friendly header labels
    const friendlyHeaders = fieldsToRender.map(key => {
      switch (key) {
        case 'name': return 'Move';
        case 'input': return 'Command';
        case 'damage': return 'Damage';
        case 'guard': return 'Guard';
        case 'startup': return 'Startup';
        case 'active': return 'Active';
        case 'recovery': return 'Recovery';
        case 'onBlock': return 'On Block';
        case 'onHit': return 'On Hit';
        default: return key.charAt(0).toUpperCase() + key.slice(1);
      }
    });

    // 3. Apply sorting if a field is active
    if (sortByField) {
      processedRows.sort((a, b) => {
        const valA = cleanDustloopValue(a[sortByField] || '');
        const valB = cleanDustloopValue(b[sortByField] || '');

        // Determine if numeric sorting should be used
        const isNumeric = ['startup', 'active', 'recovery', 'onBlock', 'onHit', 'damage'].includes(sortByField);
        
        if (isNumeric) {
          const numA = parseNumericValue(valA);
          const numB = parseNumericValue(valB);
          return sortOrder === 'asc' ? numA - numB : numB - numA;
        } else {
          return sortOrder === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }
      });
    }

    // 4. Generate Headers HTML
    const headersHtml = fieldsToRender.map((field, index) => {
      const label = friendlyHeaders[index];
      let sortClass = '';
      if (sortByField === field) {
        sortClass = sortOrder === 'asc' ? 'sorted-asc' : 'sorted-desc';
      }
      return `<th class="frame-data-th ${sortClass}" data-field="${field}">${label}</th>`;
    }).join('');

    // 5. Generate Body HTML
    let bodyHtml = '';
    if (processedRows.length === 0) {
      bodyHtml = `
        <tr>
          <td colspan="${fieldsToRender.length}" class="text-center p-6 text-muted">
            No moves match your search query.
          </td>
        </tr>
      `;
    } else {
      bodyHtml = processedRows.map((row, idx) => {
        const cells = fieldsToRender.map(field => {
          const rawVal = row[field];
          const cleanVal = cleanDustloopValue(rawVal);
          
          // Apply color coding for block and hit advantage
          if (['onBlock', 'onHit'].includes(field)) {
            return `<td class="frame-data-td">${formatAdvantageBadge(cleanVal)}</td>`;
          }
          if (field === 'input') {
            const visualHtml = parseStrategyHubNotationToHtml(cleanVal, gameId);
            return `<td class="frame-data-td" style="white-space: nowrap; vertical-align: middle;">${visualHtml}</td>`;
          }
          return `<td class="frame-data-td">${escapeHtml(cleanVal)}</td>`;
        }).join('');
        
        return `
          <tr class="frame-data-tr clickable-row" data-index="${idx}">
            ${cells}
          </tr>
          <tr class="frame-details-tr hidden" id="details-row-${idx}">
            <td colspan="${fieldsToRender.length}" class="p-0">
              <div class="move-details-expanded p-4" id="details-content-${idx}">
                <div class="loading-images text-center text-muted p-4">
                  <i class="fa-solid fa-spinner fa-spin mr-2"></i> Loading move images...
                </div>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    tableEl.innerHTML = `
      <thead>
        <tr>${headersHtml}</tr>
      </thead>
      <tbody>
        ${bodyHtml}
      </tbody>
    `;

    // 6. Attach sort click handlers to the new headers
    tableEl.querySelectorAll('.frame-data-th').forEach(th => {
      th.addEventListener('click', (e) => {
        e.stopPropagation();
        const field = th.getAttribute('data-field');
        if (sortByField === field) {
          sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          sortByField = field;
          sortOrder = 'asc';
        }
        renderRows(filteredRows);
      });
    });

    // 7. Attach click handlers to row expansion
    tableEl.querySelectorAll('.clickable-row').forEach(rowEl => {
      rowEl.addEventListener('click', () => {
        const idx = parseInt(rowEl.getAttribute('data-index'), 10);
        const detailsRow = document.getElementById(`details-row-${idx}`);
        if (!detailsRow) return;

        const isCollapsed = detailsRow.classList.contains('hidden');
        
        // Collapse all other details rows first
        tableEl.querySelectorAll('.frame-details-tr').forEach(r => r.classList.add('hidden'));
        tableEl.querySelectorAll('.clickable-row').forEach(r => r.classList.remove('expanded'));

        if (isCollapsed) {
          detailsRow.classList.remove('hidden');
          rowEl.classList.add('expanded');
          
          // Load images for this move dynamically
          loadMoveImages(processedRows[idx], idx);
        }
      });
    });
  }

  // Background preloader for all character moves
  // Background preloader for all character moves
  function preloadCharacterMoveImages(characterRows, gameId) {
    const filesToPreload = [];
    const seenFiles = new Set();

    characterRows.forEach(move => {
      const imagesStr = move.images || '';
      const hitboxesStr = move.hitboxes || '';

      let imageFiles;
      if (imagesStr.includes('http://') || imagesStr.includes('https://') || imagesStr.toLowerCase().includes('.mp4')) {
        imageFiles = imagesStr.split(/[;,]+/).map(f => f.trim()).filter(Boolean);
      } else {
        imageFiles = imagesStr.split(/[;,\\/]+/).map(f => f.trim()).filter(Boolean);
      }

      let hitboxFiles;
      if (hitboxesStr.includes('http://') || hitboxesStr.includes('https://') || hitboxesStr.toLowerCase().includes('.mp4')) {
        hitboxFiles = hitboxesStr.split(/[;,]+/).map(f => f.trim()).filter(Boolean);
      } else {
        hitboxFiles = hitboxesStr.split(/[;,\\/]+/).map(f => f.trim()).filter(Boolean);
      }

      // Guess files if Cargo is empty
      if (move.input) {
        const gamePrefix = gameId.toUpperCase();
        const charClean = charName.replace(/\s+/g, '_');
        const inputClean = move.input.replace(/\s+/g, '');
        const moveNameClean = (move.name || '').replace(/\s+/g, '_');

        if (imageFiles.length === 0) {
          imageFiles.push(`${gamePrefix}_${charClean}_${inputClean}.png`);
          imageFiles.push(`${gamePrefix} ${charName} ${move.input}.png`);
          if (moveNameClean) {
            imageFiles.push(`${gamePrefix}_${charClean}_${moveNameClean}.png`);
            imageFiles.push(`${gamePrefix} ${charName} ${move.name}.png`);
          }
        }

        if (hitboxFiles.length === 0) {
          hitboxFiles.push(`${gamePrefix}_${charClean}_${inputClean}_Hitbox.png`);
          hitboxFiles.push(`${gamePrefix} ${charName} ${move.input} Hitbox.png`);
          if (moveNameClean) {
            hitboxFiles.push(`${gamePrefix}_${charClean}_${moveNameClean}_Hitbox.png`);
            hitboxFiles.push(`${gamePrefix} ${charName} ${move.name} Hitbox.png`);
          }
        }
      }

      const primaryImage = imageFiles[0];
      const primaryHitbox = hitboxFiles[0];

      if (primaryImage && !seenFiles.has(primaryImage)) {
        seenFiles.add(primaryImage);
        filesToPreload.push({
          filename: primaryImage,
          guesses: imageFiles,
          cacheKey: `${gameId}:move:${primaryImage}`
        });
      }

      if (primaryHitbox && !seenFiles.has(primaryHitbox)) {
        seenFiles.add(primaryHitbox);
        filesToPreload.push({
          filename: primaryHitbox,
          guesses: hitboxFiles,
          cacheKey: `${gameId}:move:${primaryHitbox}`
        });
      }
    });

    const totalFiles = filesToPreload.length;
    if (totalFiles === 0) return;

    const container = document.getElementById('preloader-status-container');
    const statusText = document.getElementById('preloader-status-text');
    const fill = document.getElementById('preloader-fill');

    if (container) {
      container.classList.remove('hidden');
    }

    let activeIndex = 0;
    let loadedCount = 0;

    function updatePreloadProgress() {
      const percentage = Math.round((loadedCount / totalFiles) * 100);
      if (fill) fill.style.width = `${percentage}%`;
      if (statusText) {
        statusText.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-secondary mr-1"></i> Caching move images: ${loadedCount} / ${totalFiles} (${percentage}%)`;
      }

      if (loadedCount === totalFiles) {
        if (statusText) {
          statusText.innerHTML = `<i class="fa-solid fa-circle-check text-success mr-1"></i> All move images cached!`;
        }
        setTimeout(() => {
          if (container) {
            container.classList.add('hidden');
          }
        }, 2000);
      }
    }

    function runFallbackResolution(filename, guesses, cacheKey) {
      return new Promise((resolve) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(PLACEHOLDER_SVG);
          }
        }, 5000);

        const onDone = (val) => {
          clearTimeout(timeout);
          if (!resolved) {
            resolved = true;
            resolve(val);
          }
        };

        const config = WIKI_CONFIG[gameId] || { primary: 'https://www.dustloop.com/wiki', fallbacks: [] };
        const allBases = [config.primary, ...config.fallbacks];
        let tryIdx = 0;

        const isVideo = filename.toLowerCase().endsWith('.mp4');

        if (isVideo) {
          const video = document.createElement('video');
          video.muted = true;
          video.playsinline = true;

          function tryNextBase() {
            if (tryIdx < allBases.length) {
              const currentBase = allBases[tryIdx];
              tryIdx++;
              video.src = constructCdnUrl(filename, gameId, currentBase);
            } else {
              resolveFileUrls(guesses, gameId).then(urlsMap => {
                let resolvedUrl = '';
                for (const file of guesses) {
                  const urlKey = file.toLowerCase().replace(/[\s_]/g, '');
                  if (urlsMap[urlKey]) {
                    resolvedUrl = urlsMap[urlKey];
                    break;
                  }
                }
                if (resolvedUrl) {
                  const apiVideo = document.createElement('video');
                  apiVideo.muted = true;
                  apiVideo.playsinline = true;
                  apiVideo.onloadedmetadata = () => {
                    saveResolvedImageUrl(cacheKey, resolvedUrl);
                    onDone(resolvedUrl);
                  };
                  apiVideo.onerror = () => {
                    onDone(PLACEHOLDER_SVG);
                  };
                  apiVideo.src = resolvedUrl;
                } else {
                  onDone(PLACEHOLDER_SVG);
                }
              }).catch(() => {
                onDone(PLACEHOLDER_SVG);
              });
            }
          }

          video.onloadedmetadata = () => {
            saveResolvedImageUrl(cacheKey, video.src);
            onDone(video.src);
          };

          video.onerror = () => {
            tryNextBase();
          };

          tryNextBase();
        } else {
          const img = new Image();
          img.referrerPolicy = 'no-referrer';

          function tryNextBase() {
            if (tryIdx < allBases.length) {
              const currentBase = allBases[tryIdx];
              tryIdx++;
              img.src = constructCdnUrl(filename, gameId, currentBase);
            } else {
              resolveFileUrls(guesses, gameId).then(urlsMap => {
                let resolvedUrl = '';
                for (const file of guesses) {
                  const urlKey = file.toLowerCase().replace(/[\s_]/g, '');
                  if (urlsMap[urlKey]) {
                    resolvedUrl = urlsMap[urlKey];
                    break;
                  }
                }

                if (resolvedUrl) {
                  const apiImg = new Image();
                  apiImg.referrerPolicy = 'no-referrer';
                  apiImg.onload = () => {
                    saveResolvedImageUrl(cacheKey, resolvedUrl);
                    onDone(resolvedUrl);
                  };
                  apiImg.onerror = () => {
                    onDone(PLACEHOLDER_SVG);
                  };
                  apiImg.src = resolvedUrl;
                } else {
                  onDone(PLACEHOLDER_SVG);
                }
              }).catch(() => {
                onDone(PLACEHOLDER_SVG);
              });
            }
          }

          img.onload = () => {
            saveResolvedImageUrl(cacheKey, img.src);
            onDone(img.src);
          };

          img.onerror = () => {
            tryNextBase();
          };

          tryNextBase();
        }
      });
    }

    function preloadFile(fileItem) {
      const { filename, guesses, cacheKey } = fileItem;

      return new Promise((resolve) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(PLACEHOLDER_SVG);
          }
        }, 5000);

        const onDone = (val) => {
          clearTimeout(timeout);
          if (!resolved) {
            resolved = true;
            resolve(val);
          }
        };

        const cachedResolved = getResolvedImageUrl(cacheKey);
        if (cachedResolved) {
          if (filename.toLowerCase().endsWith('.mp4')) {
            const video = document.createElement('video');
            video.muted = true;
            video.playsinline = true;
            video.onloadedmetadata = () => onDone(cachedResolved);
            video.onerror = () => {
              deleteResolvedImageUrl(cacheKey);
              runFallbackResolution(filename, guesses, cacheKey).then(onDone);
            };
            video.src = cachedResolved;
          } else {
            const img = new Image();
            img.referrerPolicy = 'no-referrer';
            img.onload = () => onDone(cachedResolved);
            img.onerror = () => {
              deleteResolvedImageUrl(cacheKey);
              runFallbackResolution(filename, guesses, cacheKey).then(onDone);
            };
            img.src = cachedResolved;
          }
          return;
        }

        runFallbackResolution(filename, guesses, cacheKey).then(onDone);
      });
    }

    function startPreloadWorker() {
      if (activeIndex >= totalFiles) return Promise.resolve();

      const fileItem = filesToPreload[activeIndex++];
      return preloadFile(fileItem).then(() => {
        loadedCount++;
        updatePreloadProgress();
        return startPreloadWorker();
      });
    }

    updatePreloadProgress();

    const MAX_CONCURRENT = 4;
    const workers = [];
    for (let i = 0; i < Math.min(MAX_CONCURRENT, totalFiles); i++) {
      workers.push(startPreloadWorker());
    }
    Promise.all(workers);
  }

  // Extract a static video frame at 0.1s and paint it to canvas. If CORS or paint errors, fall back to a paused video.
  function extractVideoFrame(videoUrl, containerEl) {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsinline = true;
    video.crossOrigin = 'anonymous';

    const timeout = setTimeout(() => {
      video.onerror = null;
      video.onseeked = null;
      containerEl.innerHTML = `<img src="${PLACEHOLDER_SVG}" alt="Placeholder" class="move-details-img" />`;
    }, 6000);

    video.onerror = () => {
      clearTimeout(timeout);
      containerEl.innerHTML = `<img src="${PLACEHOLDER_SVG}" alt="Placeholder" class="move-details-img" />`;
    };

    video.onloadedmetadata = () => {
      video.currentTime = 0.1;
    };

    video.onseeked = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.className = 'move-details-img move-details-canvas';
        canvas.width = video.videoWidth || 400;
        canvas.height = video.videoHeight || 300;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        containerEl.innerHTML = '';
        containerEl.appendChild(canvas);
      } catch (e) {
        console.warn('Canvas video frame extraction failed (cross-origin). Falling back to auto-paused video:', e);
        containerEl.innerHTML = `
          <video src="${videoUrl}" class="move-details-video" muted playsinline style="width: 100%; height: auto; border-radius: 4px; display: block;" referrerpolicy="no-referrer"></video>
        `;
        const fallbackVideo = containerEl.querySelector('video');
        if (fallbackVideo) {
          fallbackVideo.currentTime = 0.1;
        }
      }
    };

    video.load();
  }

  // Helper to load move images synchronously using constructed direct CDN URLs
  function loadMoveImages(move, index) {
    const contentContainer = document.getElementById(`details-content-${index}`);
    if (!contentContainer) return;

    if (contentContainer.getAttribute('data-loaded') === 'true') return;

    const imagesStr = move.images || '';
    const hitboxesStr = move.hitboxes || '';

    let imageFiles;
    if (imagesStr.includes('http://') || imagesStr.includes('https://') || imagesStr.toLowerCase().includes('.mp4')) {
      imageFiles = imagesStr.split(/[;,]+/).map(f => f.trim()).filter(Boolean);
    } else {
      imageFiles = imagesStr.split(/[;,\\/]+/).map(f => f.trim()).filter(Boolean);
    }

    let hitboxFiles;
    if (hitboxesStr.includes('http://') || hitboxesStr.includes('https://') || hitboxesStr.toLowerCase().includes('.mp4')) {
      hitboxFiles = hitboxesStr.split(/[;,]+/).map(f => f.trim()).filter(Boolean);
    } else {
      hitboxFiles = hitboxesStr.split(/[;,\\/]+/).map(f => f.trim()).filter(Boolean);
    }

    // Guess fallback files if data is missing from Cargo
    if (move.input) {
      const gamePrefix = gameId.toUpperCase();
      const charClean = charName.replace(/\s+/g, '_');
      const inputClean = move.input.replace(/\s+/g, '');
      const moveNameClean = (move.name || '').replace(/\s+/g, '_');

      if (imageFiles.length === 0) {
        imageFiles.push(`${gamePrefix}_${charClean}_${inputClean}.png`);
        imageFiles.push(`${gamePrefix} ${charName} ${move.input}.png`);
        if (moveNameClean) {
          imageFiles.push(`${gamePrefix}_${charClean}_${moveNameClean}.png`);
          imageFiles.push(`${gamePrefix} ${charName} ${move.name}.png`);
        }
      }

      if (hitboxFiles.length === 0) {
        hitboxFiles.push(`${gamePrefix}_${charClean}_${inputClean}_Hitbox.png`);
        hitboxFiles.push(`${gamePrefix} ${charName} ${move.input} Hitbox.png`);
        if (moveNameClean) {
          hitboxFiles.push(`${gamePrefix}_${charClean}_${moveNameClean}_Hitbox.png`);
          hitboxFiles.push(`${gamePrefix} ${charName} ${move.name} Hitbox.png`);
        }
      }
    }

    if (imageFiles.length === 0 && hitboxFiles.length === 0) {
      contentContainer.innerHTML = `
        <div class="text-center text-muted p-4">
          <i class="fa-solid fa-image-slash mr-2"></i> No move images or hitboxes available for this move.
        </div>
      `;
      contentContainer.setAttribute('data-loaded', 'true');
      return;
    }

    let imagesHtml = '';
    let hitboxesHtml = '';

    if (imageFiles.length > 0) {
      const firstFile = imageFiles[0];
      const isVideo = firstFile.toLowerCase().endsWith('.mp4');
      const cacheKey = `${gameId}:move:${firstFile}`;
      const cachedResolved = getResolvedImageUrl(cacheKey);
      
      let actionUrl;
      let fromCacheAttr = '';
      if (cachedResolved) {
        actionUrl = cachedResolved;
        fromCacheAttr = ' data-loaded-from-cache="true"';
      } else {
        actionUrl = constructCdnUrl(firstFile, gameId);
      }
      const guessesAttr = escapeHtml(imageFiles.join(';'));
      
      if (isVideo) {
        imagesHtml = `
          <div class="move-image-card">
            <h5 class="move-image-card-title title-action">
              <i class="fa-solid fa-gamepad"></i> Action Frame
            </h5>
            <div class="move-image-wrapper" id="action-video-container-${index}">
              <div class="loading-video-frame text-muted p-2" style="font-size: 0.9rem;">
                <i class="fa-solid fa-spinner fa-spin mr-1"></i> Extracting frame...
              </div>
            </div>
          </div>
        `;
      } else {
        imagesHtml = `
          <div class="move-image-card">
            <h5 class="move-image-card-title title-action">
              <i class="fa-solid fa-gamepad"></i> Action Frame
            </h5>
            <div class="move-image-wrapper">
              <img src="${actionUrl}" alt="Action Frame" class="move-details-img" data-guesses="${guessesAttr}" data-filename="${firstFile}" data-game="${gameId}" data-try-idx="0"${fromCacheAttr} onload="if(!this.getAttribute('data-loaded-from-cache')){ window.handleMoveImageLoad && window.handleMoveImageLoad(this); }" onerror="window.handleMoveImageError && window.handleMoveImageError(this, '${gameId}');" referrerpolicy="no-referrer" />
            </div>
          </div>
        `;
      }
    }

    if (hitboxFiles.length > 0) {
      const firstFile = hitboxFiles[0];
      const isVideo = firstFile.toLowerCase().endsWith('.mp4');
      const cacheKey = `${gameId}:move:${firstFile}`;
      const cachedResolved = getResolvedImageUrl(cacheKey);
      
      let hitboxUrl;
      let fromCacheAttr = '';
      if (cachedResolved) {
        hitboxUrl = cachedResolved;
        fromCacheAttr = ' data-loaded-from-cache="true"';
      } else {
        hitboxUrl = constructCdnUrl(firstFile, gameId);
      }
      const guessesAttr = escapeHtml(hitboxFiles.join(';'));
      
      if (isVideo) {
        hitboxesHtml = `
          <div class="move-image-card">
            <h5 class="move-image-card-title title-hitbox">
              <span>
                <i class="fa-solid fa-shield-halved"></i> Hitbox / Hurtbox
              </span>
            </h5>
            <div class="move-image-wrapper">
              <video src="${hitboxUrl}" autoplay loop muted playsinline class="move-details-video" referrerpolicy="no-referrer" style="width: 100%; height: auto; border-radius: 4px; display: block;" onerror="window.handleMoveVideoError && window.handleMoveVideoError(this);"></video>
            </div>
          </div>
        `;
      } else {
        hitboxesHtml = `
          <div class="move-image-card">
            <h5 class="move-image-card-title title-hitbox">
              <span>
                <i class="fa-solid fa-shield-halved"></i> Hitbox / Hurtbox
              </span>
              <span class="hitbox-helper" onclick="event.stopPropagation(); this.classList.toggle('active');">
                <i class="fa-solid fa-circle-question"></i>
                <div class="hitbox-tooltip">
                  <div class="tooltip-title">Box Color Guide</div>
                  <ul>
                    <li><strong style="color: #ff4a4a;">Red (Hitbox):</strong> Active strike area. Deals damage/hitstun on contact.</li>
                    <li><strong style="color: #00f0ff;">Blue/Cyan (Hurtbox):</strong> Vulnerable area. Contact here registers as getting hit.</li>
                    <li><strong style="color: #ffd200;">Yellow/Green (Pushbox):</strong> Physical collision boundary. Prevents walking through.</li>
                    <li><strong style="color: #ffffff;">White / Absence (Invincibility):</strong> Immune to hits. Represented by white/dashed boxes or the complete disappearance of blue hurtboxes.</li>
                  </ul>
                </div>
              </span>
            </h5>
            <div class="move-image-wrapper">
              <img src="${hitboxUrl}" alt="Hitbox Frame" class="move-details-img" data-guesses="${guessesAttr}" data-filename="${firstFile}" data-game="${gameId}" data-try-idx="0"${fromCacheAttr} onload="if(!this.getAttribute('data-loaded-from-cache')){ window.handleMoveImageLoad && window.handleMoveImageLoad(this); }" onerror="window.handleMoveImageError && window.handleMoveImageError(this, '${gameId}');" referrerpolicy="no-referrer" />
            </div>
          </div>
        `;
      }
    }

    contentContainer.innerHTML = `
      <div class="move-images-flex">
        ${imagesHtml}
        ${hitboxesHtml}
      </div>
    `;
    contentContainer.setAttribute('data-loaded', 'true');

    // Run video frame extraction if needed
    if (imageFiles.length > 0 && imageFiles[0].toLowerCase().endsWith('.mp4')) {
      const firstFile = imageFiles[0];
      const cacheKey = `${gameId}:move:${firstFile}`;
      const cachedResolved = getResolvedImageUrl(cacheKey);
      const actionUrl = cachedResolved || constructCdnUrl(firstFile, gameId);
      
      const wrapper = document.getElementById(`action-video-container-${index}`);
      if (wrapper) {
        extractVideoFrame(actionUrl, wrapper);
      }
    }
  }
}

// ================================================================
// Helpers
// ================================================================

function getGameName(id) {
  const game = store.getGame(id);
  return game ? game.name : id.toUpperCase();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Global handler for video load errors
window.handleMoveVideoError = function (videoEl) {
  videoEl.onerror = null;
  const parent = videoEl.parentElement;
  if (parent) {
    parent.innerHTML = `<img src="${PLACEHOLDER_SVG}" alt="Placeholder" class="move-details-img" />`;
  }
};

/// Global handler for successful move image loads
window.handleMoveImageLoad = function (imgEl) {
  const filename = imgEl.getAttribute('data-filename');
  const gameId = imgEl.getAttribute('data-game');
  if (filename && gameId) {
    const cacheKey = `${gameId}:move:${filename}`;
    saveResolvedImageUrl(cacheKey, imgEl.src);
  }
};

// Global handler for move image load errors to lazily fall back to API query
window.handleMoveImageError = function (imgEl, gameId) {
  imgEl.onerror = null; // Prevent loops temporarily
  
  const filename = imgEl.getAttribute('data-filename') || '';
  const cacheKey = `${gameId}:move:${filename}`;
  
  // Stale cache validation: if it failed and was loaded from cache, invalidate it and restart chain!
  if (imgEl.getAttribute('data-loaded-from-cache') === 'true') {
    imgEl.removeAttribute('data-loaded-from-cache');
    deleteResolvedImageUrl(cacheKey);
    // Restart fallback chain starting from base primary CDN URL
    imgEl.setAttribute('data-try-idx', '0');
    imgEl.onerror = () => window.handleMoveImageError(imgEl, gameId);
    imgEl.src = constructCdnUrl(filename, gameId);
    return;
  }
  
  // Otherwise, proceed with the sequential fallback chain!
  let tryIdx = parseInt(imgEl.getAttribute('data-try-idx') || '0', 10);
  const config = WIKI_CONFIG[gameId] || { primary: 'https://www.dustloop.com/wiki', fallbacks: [] };
  const allBases = [config.primary, ...config.fallbacks];
  
  tryIdx++;
  if (tryIdx < allBases.length) {
    imgEl.setAttribute('data-try-idx', tryIdx);
    imgEl.onerror = () => window.handleMoveImageError(imgEl, gameId);
    imgEl.src = constructCdnUrl(filename, gameId, allBases[tryIdx]);
  } else {
    // If all wiki databases failed for this filename, let's try our guesses fallback!
    const guessesStr = imgEl.getAttribute('data-guesses') || '';
    const fileGuesses = guessesStr.split(';').map(f => f.trim()).filter(Boolean);
    
    // Fall back to MediaWiki API search to resolve other guesses (Approach A final fallback)
    resolveFileUrls(fileGuesses, gameId).then(urlsMap => {
      let resolvedUrl = '';
      for (const file of fileGuesses) {
        const urlKey = file.toLowerCase().replace(/[\s_]/g, '');
        if (urlsMap[urlKey]) {
          resolvedUrl = urlsMap[urlKey];
          break;
        }
      }
      if (resolvedUrl) {
        imgEl.onerror = () => {
          imgEl.onerror = null;
          imgEl.src = PLACEHOLDER_SVG;
        };
        imgEl.src = resolvedUrl;
        saveResolvedImageUrl(cacheKey, resolvedUrl); // cache it
      } else {
        imgEl.src = PLACEHOLDER_SVG;
      }
    }).catch(() => {
      imgEl.src = PLACEHOLDER_SVG;
    });
  }
};
