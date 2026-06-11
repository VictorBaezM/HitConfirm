export function renderCharacterCard({ gameId, charName, navigate }) {
  const card = document.createElement('div');
  card.className = 'character-card card-hoverable';
  
  const sanitized = charName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const portraitUrl = `/src/images/characters/${gameId}/${sanitized}.png`;

  card.innerHTML = `
    <img src="${portraitUrl}" alt="${charName}" class="portrait" onerror="this.onerror=null; this.src='/src/images/placeholder.svg';"/>
    <div class="game-badge game-badge-${gameId}">${gameId.toUpperCase()}</div>
    <div class="char-name">${charName}</div>
  `;
  
  card.addEventListener('click', function () {
    // navigate to dedicated character page
    navigate('character', { gameId, charName });
  });
  return card;
}
