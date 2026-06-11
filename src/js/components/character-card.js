import { resolvePortraitUrl } from '../utils/portrait-resolver.js';

export function renderCharacterCard({ gameId, charName, navigate }) {
  const card = document.createElement('div');
  card.className = 'character-card card-hoverable';
  
  const sanitized = charName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const localPortraitUrl = `/src/images/characters/${gameId}/${sanitized}.png`;

  const img = document.createElement('img');
  img.alt = charName;
  img.className = 'portrait';
  img.src = localPortraitUrl;
  
  let hasTriedWiki = false;

  img.onerror = function () {
    if (!hasTriedWiki) {
      hasTriedWiki = true;
      resolvePortraitUrl(gameId, charName).then(url => {
        img.src = url;
      }).catch(() => {
        img.src = '/src/images/placeholder.svg';
      });
    } else {
      img.onerror = null;
      img.src = '/src/images/placeholder.svg';
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
