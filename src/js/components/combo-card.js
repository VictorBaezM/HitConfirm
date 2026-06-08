/* Combo Dojo Card Component */
import store from '../store.js';
import { parseComboToHtml } from '../utils/combo-parser.js';
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
      <div class="video-container combo-video-container hidden">
        <div class="video-wrapper">
          <iframe src="${embedUrl}" allowfullscreen></iframe>
        </div>
      </div>
    `;
  }

  // Parse combo notation to HTML buttons
  const visualNotationHtml = parseComboToHtml(combo.notation);

  // Render difficulty badge
  const difficultyBadge = `<span class="badge badge-difficulty-${combo.difficulty}">${combo.difficulty}</span>`;
  const gameBadge = `<span class="badge badge-${combo.game}">${gameName}</span>`;

  const card = document.createElement('div');
  card.className = 'card card-hoverable mb-5 combo-card';
  card.id = `combo-${combo.id}`;

  const dateStr = new Date(combo.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  card.innerHTML = `
    <div class="combo-card-header">
      <div class="flex items-center gap-2">
        ${gameBadge}
        ${difficultyBadge}
        <span class="badge combo-char-badge">${escapeHtml(combo.character)}</span>
      </div>
      <div class="combo-date-text">${dateStr}</div>
    </div>

    <h3 class="combo-title-heading">${escapeHtml(combo.title)}</h3>
    <div class="combo-author-wrapper">
      Shared by <strong class="combo-author-link">${escapeHtml(combo.username)}</strong>
    </div>

    <!-- Visual Combo Rendering -->
    <div class="combo-notation-wrapper">
      ${visualNotationHtml}
    </div>

    <!-- Stats grid -->
    <div class="combo-stats-grid-container">
      <div class="combo-stat-cell">
        <div class="combo-stat-label">Damage</div>
        <div class="combo-stat-val-damage">${escapeHtml(combo.damage)}</div>
      </div>
      <div class="combo-stat-cell">
        <div class="combo-stat-label">Meter Cost</div>
        <div class="combo-stat-val-meter">${escapeHtml(combo.meter)}</div>
      </div>
      <div class="combo-stat-cell">
        <div class="combo-stat-label">Difficulty</div>
        <div class="combo-stat-val-diff">${escapeHtml(combo.difficulty)}</div>
      </div>
    </div>

    ${combo.description ? `<p class="combo-description-text">${escapeHtml(combo.description)}</p>` : ''}

    ${videoHtml}

    <div class="combo-footer-actions">
      <button class="btn-icon btn-upvote ${upvoteClass}" title="Upvote Combo">
        <i class="fa-solid fa-fire"></i>
      </button>
      <span class="upvote-count combo-upvote-text">${combo.upvotes} 🔥</span>

      <button class="btn-icon btn-save ${saveClass} combo-action-margin" title="Save to My Dojo">
        <i class="fa-regular fa-bookmark"></i>
      </button>

      <button class="btn-icon btn-copy combo-action-margin" title="Copy Combo Notation">
        <i class="fa-regular fa-copy"></i>
      </button>

      ${combo.videoUrl ? `
        <button class="btn btn-secondary btn-sm btn-video-toggle combo-video-toggle-btn">
          <i class="fa-solid fa-video"></i> Video
        </button>
      ` : ''}
    </div>

    <!-- Combo Comments Section (hidden by default) -->
    <div class="combo-comments-section hidden">
      <h4 class="combo-comments-title">Comments</h4>
      <div class="combo-comments-input-wrapper">
        <input type="text" class="form-input combo-comment-input combo-comment-field" placeholder="Ask a question about execution..." />
        <button class="btn btn-primary btn-sm btn-submit-combo-comment">Post</button>
      </div>
      <div class="combo-comments-container">
        ${renderCommentsList(combo.comments)}
      </div>
    </div>
  `;

  // Upvote Event Listener
  const upvoteBtn = card.querySelector('.btn-upvote');
  upvoteBtn.addEventListener('click', async () => {
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
      window.showToast(result.error || 'Failed to update reaction.');
    }
  });

  // Save/Bookmark Event Listener
  const saveBtn = card.querySelector('.btn-save');
  saveBtn.addEventListener('click', async () => {
    if (!store.getCurrentUser()) {
      window.openAuthModal('login', navigateCallback);
      return;
    }
    const result = await store.toggleSaveCombo(combo.id);
    if (result.success) {
      if (result.saved) {
        saveBtn.classList.add('active');
        saveBtn.querySelector('i').className = 'fa-solid fa-bookmark';
        window.showToast('Combo added to your Training Dojo.');
      } else {
        saveBtn.classList.remove('active');
        saveBtn.querySelector('i').className = 'fa-regular fa-bookmark';
        window.showToast('Combo removed from your Dojo.');
      }
    } else {
      window.showToast(result.error || 'Failed to update bookmark.');
    }
  });

  // Copy Notation Event Listener
  const copyBtn = card.querySelector('.btn-copy');
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(combo.notation).then(() => {
      window.showToast('Combo notation copied to clipboard!');
      copyBtn.querySelector('i').className = 'fa-solid fa-check';
      setTimeout(() => {
        copyBtn.querySelector('i').className = 'fa-regular fa-copy';
      }, 1500);
    });
  });

  // Toggle Video Event Listener
  if (combo.videoUrl) {
    const videoToggle = card.querySelector('.btn-video-toggle');
    const videoContainer = card.querySelector('.video-container');
    videoToggle.addEventListener('click', () => {
      videoContainer.classList.toggle('hidden');
      videoToggle.classList.toggle('btn-primary');
      videoToggle.classList.toggle('btn-secondary');
    });
  }

  // Comments toggler (we can double click the card header, or add comment text section)
  // Let's just make clicking upvote counter or details trigger show comments!
  // Wait, let's create a comment action or just reveal it when the user clicks the card, or let's append a Comments toggle next to save button.
  // Actually, we can add comments toggle easily. Let's make it reveal when commenting or let's add a comments toggle trigger. Let's make copy button a simple toggle or double-click to reveal. Let's show it when they click comments. Let's add a comment toggle button.
  // Oh, wait, we can append a comment icon badge to toggle! Let's insert a comments toggle button in the button actions.
  // Wait, let's rewrite the footer actions to include the comment icon.
  // That would be even cleaner! Let's edit the card.innerHTML string to include a comment button:
  // Yes! The button actions:
  // `<button class="btn-icon btn-comment-toggle" title="Comments" style="margin-left: 8px;">
  //    <i class="fa-regular fa-comment"></i>
  //  </button>
  //  <span style="font-family: var(--font-heading); font-weight: 700; font-size: 0.9rem;">${combo.comments?.length || 0}</span>`
  
  // Let's update card actions layout to include comments toggle.
  const actionsContainer = card.querySelector('.combo-footer-actions');
  const commentToggleBtn = document.createElement('button');
  commentToggleBtn.className = 'btn-icon btn-comment-toggle';
  commentToggleBtn.title = 'Comments';
  commentToggleBtn.style.marginLeft = '8px';
  commentToggleBtn.innerHTML = `<i class="fa-regular fa-comment"></i>`;
  
  const commentCountLabel = document.createElement('span');
  commentCountLabel.style.fontFamily = 'var(--font-heading)';
  commentCountLabel.style.fontWeight = '700';
  commentCountLabel.style.fontSize = '0.9rem';
  commentCountLabel.innerText = combo.comments?.length || 0;

  // Insert before the video toggle
  if (combo.videoUrl) {
    const videoBtn = card.querySelector('.btn-video-toggle');
    actionsContainer.insertBefore(commentToggleBtn, videoBtn);
    actionsContainer.insertBefore(commentCountLabel, videoBtn);
  } else {
    actionsContainer.appendChild(commentToggleBtn);
    actionsContainer.appendChild(commentCountLabel);
  }

  const commentPanel = card.querySelector('.combo-comments-section');
  commentToggleBtn.addEventListener('click', () => {
    commentPanel.classList.toggle('hidden');
  });

  // Combo Comments Submission
  const commentInput = card.querySelector('.combo-comment-input');
  const submitBtn = card.querySelector('.btn-submit-combo-comment');
  
  const submitComboComment = async () => {
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
      const commentsContainer = card.querySelector('.combo-comments-container');
      commentsContainer.innerHTML = renderCommentsList(result.comments);
    } else {
      window.showToast(result.error || 'Failed to post comment.');
    }
  };

  submitBtn.addEventListener('click', submitComboComment);
  commentInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitComboComment();
  });

  // Attach author click listener
  const authorLink = card.querySelector('.combo-author-link');
  if (authorLink) {
    authorLink.addEventListener('click', () => {
      navigateCallback('profile', { userId: combo.userId });
    });
  }

  return card;
}

function renderCommentsList(comments) {
  if (!comments || comments.length === 0) {
    return `<p class="font-xs text-muted m-0">No execution comments yet.</p>`;
  }

  return `
    <div class="combo-comments-list">
      ${comments.map(c => `
        <div class="combo-comment-item">
          <div class="combo-comment-header">
            <span class="combo-comment-author">${escapeHtml(c.username)}</span>
            <span class="combo-comment-date">${escapeHtml(c.date)}</span>
          </div>
          <p class="combo-comment-text">${escapeHtml(c.text)}</p>
        </div>
      `).join('')}
    </div>
  `;
}
