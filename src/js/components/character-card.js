import { resolvePortraitUrl, PLACEHOLDER_SVG, constructCdnUrl, getWikiFilename, getLocalPortraitUrl, getCachedPortraitUrl, WIKI_CONFIG, saveResolvedImageUrl, getResolvedImageUrl, deleteResolvedImageUrl } from '../utils/portrait-resolver.js';

export function renderCharacterCard({ gameId, charName, navigate }) {
  const card = document.createElement('div');
  card.className = 'character-card card-hoverable';
  
  const img = document.createElement('img');
  img.alt = charName;
  img.className = 'portrait';
  
  const localPortraitUrl = getLocalPortraitUrl(gameId, charName);
  const cacheKey = `${gameId}:portrait:${charName}`;
  const resolvedCached = getResolvedImageUrl(cacheKey);

  let stage = 0;
  let tryIdx = 0;

  if (localPortraitUrl) {
    img.src = localPortraitUrl;
    stage = 0;
  } else if (resolvedCached) {
    img.src = resolvedCached;
    img.setAttribute('data-loaded-from-cache', 'true');
    stage = 1;
  } else {
    const filename = getWikiFilename(gameId, charName);
    img.src = constructCdnUrl(filename, gameId);
    stage = 1;
  }

  img.onload = function () {
    if (!img.getAttribute('data-loaded-from-cache') && stage > 0 && stage < 3) {
      saveResolvedImageUrl(cacheKey, img.src);
    }
  };

  img.onerror = function () {
    const filename = getWikiFilename(gameId, charName);
    
    // Stale cache validation: if failed and loaded from cache, invalidate and restart chain!
    if (img.getAttribute('data-loaded-from-cache') === 'true') {
      img.removeAttribute('data-loaded-from-cache');
      deleteResolvedImageUrl(cacheKey);
      stage = 1;
      tryIdx = 0;
      img.src = constructCdnUrl(filename, gameId);
      return;
    }

    if (stage === 0) {
      stage = 1;
      tryIdx = 0;
      img.src = constructCdnUrl(filename, gameId);
    } else if (stage === 1) {
      const config = WIKI_CONFIG[gameId] || { primary: 'https://www.dustloop.com/wiki', fallbacks: [] };
      if (tryIdx < config.fallbacks.length) {
        const nextBase = config.fallbacks[tryIdx];
        tryIdx++;
        img.src = constructCdnUrl(filename, gameId, nextBase);
      } else {
        // Fallbacks exhausted, move to MediaWiki API lookup (Stage 2)
        stage = 2;
        resolvePortraitUrl(gameId, charName).then(url => {
          if (url && url !== PLACEHOLDER_SVG) {
            img.src = url;
            saveResolvedImageUrl(cacheKey, url);
          } else {
            stage = 3;
            img.onerror = null;
            img.src = PLACEHOLDER_SVG;
          }
        }).catch(() => {
          stage = 3;
          img.onerror = null;
          img.src = PLACEHOLDER_SVG;
        });
      }
    } else {
      img.onerror = null;
      img.src = PLACEHOLDER_SVG;
    }
  };

  card.appendChild(img);

  const badge = document.createElement('div');
  badge.className = `game-badge game-badge-${gameId}`;
  badge.innerText = gameId.toUpperCase();
  card.appendChild(badge);

  const nameDiv = document.createElement('div');
  nameDiv.className = 'char-name';
  nameDiv.innerText = charName;
  card.appendChild(nameDiv);
  
  card.addEventListener('click', function () {
    navigate('character', { gameId, charName });
  });
  return card;
}
