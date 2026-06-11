/* Combo Dojo Card Component */
import store from '../store.js';
import { renderNotationHtml } from '../utils/combo-parser.js';
import { escapeHtml } from '../utils/security.js';


/**
 * Creates and renders a styled combo card element containing details, comments, and upvote controls.
 * @param {Object} combo - The combo metadata object.
 * @param {function} navigateCallback - SPA router callback.
 * @returns {HTMLDivElement} Configured card node element.
 */
export function renderComboCard(combo, navigateCallback) {
  const currentUser = store.getCurrentUser();
  const isUpvoted = currentUser && combo.upvotedBy && combo.upvotedBy.includes(currentUser.id);
  const upvoteClass = isUpvoted ? 'active' : '';

  // Check if bookmark/saved to Dojo
  const isSaved = currentUser && currentUser.savedCombos && currentUser.savedCombos.includes(combo.id);
  const saveClass = isSaved ? 'active' : '';

  const games = store.getGames();
  const gameName = games[combo.game]?.name || combo.game;

  // Render video iframe
  let videoHtml = '';
  if (combo.videoUrl) {
    let embedUrl = combo.videoUrl;
    if (combo.videoUrl.includes('youtube.com/watch?v=')) {
      const videoId = combo.videoUrl.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (combo.videoUrl.includes('youtu.be/')) {
      const videoId = combo.videoUrl.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    videoHtml = `
      <div class="wiki-video-container hidden">
        <div class="wiki-video-wrapper">
          <iframe src="${embedUrl}" allowfullscreen></iframe>
        </div>
      </div>
    `;
  }

  // Render difficulty badge
  const difficultyBadge = `<span class="wiki-badge wiki-badge-difficulty-${combo.difficulty}">${combo.difficulty}</span>`;
  const gameBadge = `<span class="wiki-badge wiki-badge-${combo.game}">${gameName}</span>`;

  const card = document.createElement('div');
  card.className = 'wiki-combo-panel wiki-hoverable';
  card.id = `combo-${combo.id}`;

  const dateStr = new Date(combo.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  card.innerHTML = `
    <div class="wiki-combo-header">
      <div class="wiki-combo-meta">
        ${gameBadge}
        ${difficultyBadge}
        <span class="wiki-badge wiki-char-badge">${escapeHtml(combo.character)}</span>
      </div>
      <div class="wiki-combo-date">${dateStr}</div>
    </div>

    <h3 class="wiki-combo-title">${escapeHtml(combo.title)}</h3>
    <div class="wiki-combo-author">
      Shared by <strong class="wiki-author-link">${escapeHtml(combo.username)}</strong>
    </div>

    <!-- Visual Combo Rendering -->
    ${renderNotationHtml(combo.notation)}

    <!-- Frame stats table -->
    <table class="wiki-frame-table">
      <thead>
        <tr>
          <th>Damage</th>
          <th>Meter Cost</th>
          <th>Difficulty</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="wiki-stat-val-damage">${escapeHtml(combo.damage)}</td>
          <td class="wiki-stat-val-meter">${escapeHtml(combo.meter)}</td>
          <td class="wiki-stat-val-diff">${escapeHtml(combo.difficulty)}</td>
        </tr>
      </tbody>
    </table>

    ${combo.description ? `<p class="wiki-combo-desc">${escapeHtml(combo.description)}</p>` : ''}

    ${videoHtml}

    <div class="wiki-combo-actions">
      <button class="wiki-action-btn btn-upvote ${upvoteClass}" title="Upvote Combo">
        <i class="fa-solid fa-fire"></i>
      </button>
      <span class="wiki-upvote-text upvote-count">${combo.upvotes} 🔥</span>

      <button class="wiki-action-btn btn-save ${saveClass}" title="Save to Dojo">
        <i class="fa-regular fa-bookmark"></i>
      </button>

      <button class="wiki-action-btn btn-copy" title="Copy Notation">
        <i class="fa-regular fa-copy"></i>
      </button>

      ${combo.videoUrl ? `
        <button class="wiki-btn wiki-btn-sm btn-video-toggle">
          <i class="fa-solid fa-video"></i> Video
        </button>
      ` : ''}
    </div>

    <!-- Combo Comments Section (hidden by default) -->
    <div class="wiki-comments-section hidden">
      <h4 class="wiki-comments-title">Comments</h4>
      <div class="wiki-comments-input-wrapper">
        <input type="text" class="wiki-comment-input" placeholder="Ask a question about execution..." />
        <button class="wiki-btn wiki-btn-primary wiki-btn-submit-comment">Post</button>
      </div>
      <div class="wiki-comments-container">
        ${renderCommentsList(combo.comments)}
      </div>
    </div>
  `;

  // Upvote Event Listener
  const upvoteBtn = card.querySelector('.btn-upvote');
  upvoteBtn.addEventListener('click', async function () {
    if (!store.getCurrentUser()) {
      window.openAuthModal('login', navigateCallback);
      return;
    }
    const result = await store.upvoteCombo(combo.id);
    if (result.success) {
      const counter = card.querySelector('.upvote-count');
      counter.innerText = `${result.upvotes} 🔥`;
      if (result.upvoted) {
        upvoteBtn.classList.add('active');
      } else {
        upvoteBtn.classList.remove('active');
      }
    } else {
      window.showToast(result.error || 'Failed to upvote.');
    }
  });

  // Save Event Listener
  const saveBtn = card.querySelector('.btn-save');
  saveBtn.addEventListener('click', async function () {
    if (!store.getCurrentUser()) {
      window.openAuthModal('login', navigateCallback);
      return;
    }
    const result = await store.toggleSaveCombo(combo.id);
    if (result.success) {
      if (result.saved) {
        saveBtn.classList.add('active');
        window.showToast('Combo saved to your Dojo.');
      } else {
        saveBtn.classList.remove('active');
        window.showToast('Combo removed from your Dojo.');
      }
    } else {
      window.showToast(result.error || 'Failed to save.');
    }
  });

  // Copy Notation Listener
  const copyBtn = card.querySelector('.btn-copy');
  copyBtn.addEventListener('click', function () {
    navigator.clipboard.writeText(combo.notation);
    window.showToast('Combo notation copied to clipboard.');
  });

  // Toggle Video Event Listener
  if (combo.videoUrl) {
    const videoToggle = card.querySelector('.btn-video-toggle');
    const videoContainer = card.querySelector('.wiki-video-container');
    videoToggle.addEventListener('click', function () {
      videoContainer.classList.toggle('hidden');
      videoToggle.classList.toggle('wiki-btn-primary');
    });
  }

  // Insert comments toggle button dynamically
  const actionsContainer = card.querySelector('.wiki-combo-actions');
  const commentToggleBtn = document.createElement('button');
  commentToggleBtn.className = 'wiki-action-btn btn-comment-toggle';
  commentToggleBtn.title = 'Comments';
  commentToggleBtn.style.marginLeft = '8px';
  commentToggleBtn.innerHTML = `<i class="fa-regular fa-comment"></i>`;
  
  const commentCountLabel = document.createElement('span');
  commentCountLabel.className = 'wiki-comment-counter';
  commentCountLabel.innerText = combo.comments?.length || 0;

  if (combo.videoUrl) {
    const videoBtn = card.querySelector('.btn-video-toggle');
    actionsContainer.insertBefore(commentToggleBtn, videoBtn);
    actionsContainer.insertBefore(commentCountLabel, videoBtn);
  } else {
    actionsContainer.appendChild(commentToggleBtn);
    actionsContainer.appendChild(commentCountLabel);
  }

  const commentPanel = card.querySelector('.wiki-comments-section');
  commentToggleBtn.addEventListener('click', function () {
    commentPanel.classList.toggle('hidden');
  });

  // Combo Comments Submission
  const commentInput = card.querySelector('.wiki-comment-input');
  const submitBtn = card.querySelector('.wiki-btn-submit-comment');
  
  async function submitComboComment() {
    const text = commentInput.value.trim();
    if (!text) return;

    if (!store.getCurrentUser()) {
      window.openAuthModal('login', navigateCallback);
      return;
    }

    const result = await store.addComboComment(combo.id, text);
    if (result.success) {
      commentInput.value = '';
      commentCountLabel.innerText = result.comments.length;
      const commentsContainer = card.querySelector('.wiki-comments-container');
      commentsContainer.innerHTML = renderCommentsList(result.comments);
    } else {
      window.showToast(result.error || 'Failed to post comment.');
    }
  }

  submitBtn.addEventListener('click', submitComboComment);
  commentInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') submitComboComment();
  });

  // Attach author click listener
  const authorLink = card.querySelector('.wiki-author-link');
  if (authorLink) {
    authorLink.addEventListener('click', function () {
      navigateCallback('profile', { userId: combo.userId });
    });
  }

  return card;
}

function renderCommentsList(comments) {
  if (!comments || comments.length === 0) {
    return `<p class="wiki-empty-text">No execution comments yet.</p>`;
  }

  return `
    <div class="wiki-comments-list">
      ${comments.map(function (c) {
        return `
          <div class="wiki-comment-item">
            <div class="wiki-comment-header">
              <span class="wiki-comment-author">${escapeHtml(c.username)}</span>
              <span class="wiki-comment-date">${escapeHtml(c.date)}</span>
            </div>
            <p class="wiki-comment-text">${escapeHtml(c.text)}</p>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
