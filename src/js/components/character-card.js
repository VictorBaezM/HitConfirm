import { resolvePortraitUrl, PLACEHOLDER_SVG, constructCdnUrl, getWikiFilename } from '../utils/portrait-resolver.js';

export function renderCharacterCard({ gameId, charName, navigate }) {
  const card = document.createElement('div');
  card.className = 'character-card card-hoverable';
  
  const sanitized = charName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const localPortraitUrl = `/src/images/characters/${gameId}/${sanitized}.png`;

  const img = document.createElement('img');
  img.alt = charName;
  img.className = 'portrait';
  img.src = localPortraitUrl;
  
  let stage = 0; // 0: local, 1: constructed CDN, 2: API query, 3: placeholder

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
