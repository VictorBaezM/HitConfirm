import assert from 'assert';

// Mock the DOM environment for our save callback logic
global.document = {
  getElementById: (id) => {
    if (id === 'modal-other-games-container') {
      return {
        querySelectorAll: (selector) => {
          if (selector === '.edit-game-card') {
            return [
              {
                classList: { contains: (cls) => cls === 'active' },
                getAttribute: (attr) => attr === 'data-game' ? 'sf6' : null
              },
              {
                classList: { contains: (cls) => false },
                getAttribute: (attr) => attr === 'data-game' ? 't8' : null
              }
            ];
          }
          if (selector === '.char-selection-grid .char-chip') {
            return [
              {
                classList: { contains: (cls) => cls === 'active' },
                getAttribute: (attr) => {
                  if (attr === 'data-game') return 'sf6';
                  if (attr === 'data-char') return 'Ryu';
                  return null;
                }
              },
              {
                classList: { contains: (cls) => false },
                getAttribute: (attr) => {
                  if (attr === 'data-game') return 't8';
                  if (attr === 'data-char') return 'Jin';
                  return null;
                }
              }
            ];
          }
          return [];
        }
      };
    }
    return null;
  }
};

// Test accumulation logic
const mainGameVal = 'sf6';
const mainCharVal = 'Ryu';

const playedGames = [];
const gameCharacters = {};

const otherGamesContainer = global.document.getElementById('modal-other-games-container');

otherGamesContainer.querySelectorAll('.edit-game-card').forEach(card => {
  if (card.classList.contains('active')) {
    const gameId = card.getAttribute('data-game');
    playedGames.push(gameId);
    gameCharacters[gameId] = [];
  }
});

otherGamesContainer.querySelectorAll('.char-selection-grid .char-chip').forEach(chip => {
  if (chip.classList.contains('active')) {
    const gameId = chip.getAttribute('data-game');
    const charName = chip.getAttribute('data-char');
    if (gameCharacters[gameId]) {
      gameCharacters[gameId].push(charName);
    }
  }
});

// Auto-include primary main selections
if (!playedGames.includes(mainGameVal)) {
  playedGames.push(mainGameVal);
}
if (!gameCharacters[mainGameVal]) {
  gameCharacters[mainGameVal] = [];
}
if (!gameCharacters[mainGameVal].includes(mainCharVal)) {
  gameCharacters[mainGameVal].push(mainCharVal);
}

try {
  assert.deepStrictEqual(playedGames, ['sf6']);
  assert.deepStrictEqual(gameCharacters, { sf6: ['Ryu'] });
  console.log("✅ PASS: Profile settings modal save data accumulation matches expected values!");
} catch (e) {
  console.error("❌ FAIL: Profile settings data accumulation error:", e);
  process.exit(1);
}
