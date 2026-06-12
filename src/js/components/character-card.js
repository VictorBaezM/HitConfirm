import { resolvePortraitUrl, PLACEHOLDER_SVG, constructCdnUrl, getWikiFilename, getLocalPortraitUrl } from '../utils/portrait-resolver.js';

export function renderCharacterCard({ gameId, charName, navigate }) {
  const card = document.createElement('div');
  card.className = 'character-card card-hoverable';
  
  const img = document.createElement('img');
  img.alt = charName;
  img.className = 'portrait';
  
  const localPortraitUrl = getLocalPortraitUrl(gameId, charName);
  let stage;

  if (localPortraitUrl) {
    img.src = localPortraitUrl;
    stage = 0; // 0: local, 1: constructed CDN, 2: API query, 3: placeholder
  } else {
    const filename = getWikiFilename(gameId, charName);
    img.src = constructCdnUrl(filename, gameId);
    stage = 1;
  }

  img.onerror = function () {
    if (stage === 0) {
      stage = 1;
      const filename = getWikiFilename(gameId, charName);
      img.src = constructCdnUrl(filename, gameId);
    } else if (stage === 1) {
      stage = 2;
      resolvePortraitUrl(gameId, charName).then(url => {
        img.src = url;
      }).catch(() => {
        stage = 3;
        img.onerror = null;
        img.src = PLACEHOLDER_SVG;
      });
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
