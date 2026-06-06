/* Social Post Card Component */
import store from '../store.js';
import { escapeHtml } from '../utils/security.js';

/**
 * Creates and renders a timeline social post card node supporting voting, replying, and youtube media embeds.
 * @param {Object} post - The post metadata object.
 * @param {function} navigateCallback - SPA router callback.
 * @returns {HTMLHtmlElement} Configured post article element node.
 */
export function renderPostCard(post, navigateCallback) {
  const currentUser = store.getCurrentUser();
  const isUpvoted = currentUser && post.upvotedBy && post.upvotedBy.includes(currentUser.id);
  const upvoteClass = isUpvoted ? 'active' : '';

  // Parse video iframe
  let videoHtml = '';
  if (post.videoUrl) {
    let embedUrl = post.videoUrl;
    // Simple youtube URL replacement if not already in embed format
    if (post.videoUrl.includes('youtube.com/watch?v=')) {
      const videoId = post.videoUrl.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (post.videoUrl.includes('youtu.be/')) {
      const videoId = post.videoUrl.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    
    videoHtml = `
      <div class="video-wrapper" style="margin-top: 16px;">
        <iframe src="${embedUrl}" allowfullscreen></iframe>
      </div>
    `;
  }

  // Format creation date
  const dateStr = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Comments list html
  let commentsHtml = '';
  if (post.comments && post.comments.length > 0) {
    commentsHtml = `
      <div class="post-comments-list" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 8px;">
        ${post.comments.map(c => `
          <div style="background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 6px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span style="font-family:var(--font-heading); font-weight:700; font-size:0.8rem; color:var(--color-secondary);">${escapeHtml(c.username)}</span>
              <span style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(c.date)}</span>
            </div>
            <p style="font-size:0.85rem; color:var(--text-primary); margin:0;">${escapeHtml(c.text)}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Generate card element container
  const card = document.createElement('article');
  card.className = 'card card-hoverable';
  card.style.marginBottom = '20px';
  card.id = `post-${post.id}`;

  const games = store.getGames();
  const gameBadge = post.game ? `<span class="badge badge-${post.game}" style="margin-left: 10px;">${games[post.game]?.name || post.game}</span>` : '';

  card.innerHTML = `
    <div class="flex items-center justify-between" style="margin-bottom: 12px;">
      <div class="flex items-center gap-3">
        <div class="avatar" style="border-color: ${post.avatarColor || '#00f0ff'}">
          ${escapeHtml(post.username.substring(0,2).toUpperCase())}
        </div>
        <div>
          <h4 style="margin: 0; line-height: 1.2;">
            ${escapeHtml(post.username)}
            ${gameBadge}
          </h4>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</span>
        </div>
      </div>
    </div>
    
    <div class="post-content" style="white-space: pre-wrap; font-size: 0.95rem;">
      ${formatPostText(post.content)}
    </div>
    
    ${videoHtml}

    <div class="flex items-center gap-4" style="margin-top: 18px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px;">
      <button class="btn-icon btn-upvote ${upvoteClass}" data-id="${post.id}" title="Upvote post">
        <i class="fa-solid fa-fire"></i>
      </button>
      <span class="upvote-count" style="font-family: var(--font-heading); font-weight: 700; font-size: 0.9rem;">${post.upvotes} 🔥</span>
      
      <button class="btn-icon btn-comment" title="Toggle comments" style="margin-left: auto;">
        <i class="fa-regular fa-comment"></i>
      </button>
      <span style="font-family: var(--font-heading); font-weight: 700; font-size: 0.9rem;">${post.comments?.length || 0}</span>
    </div>

    <!-- Toggleable Comments Panel -->
    <div class="comments-panel hidden" style="margin-top: 16px;">
      <div class="flex gap-2">
        <input type="text" class="form-input comment-input" placeholder="Type your reply..." style="padding: 8px 12px; font-size: 0.85rem;" />
        <button class="btn btn-primary btn-sm btn-submit-comment">Reply</button>
      </div>
      <div class="comments-container">
        ${commentsHtml}
      </div>
    </div>
  `;

  // Attach functionality
  const upvoteBtn = card.querySelector('.btn-upvote');
  upvoteBtn.addEventListener('click', async () => {
    if (!store.getCurrentUser()) {
      window.openAuthModal('login', navigateCallback);
      return;
    }
    const result = await store.upvotePost(post.id);
    if (result.success) {
      const counter = card.querySelector('.upvote-count');
      counter.innerText = `${result.upvotes} 🔥`;
      if (result.upvoted) {
        upvoteBtn.classList.add('active');
      } else {
        upvoteBtn.classList.remove('active');
      }
    }
  });

  const commentBtn = card.querySelector('.btn-comment');
  const panel = card.querySelector('.comments-panel');
  commentBtn.addEventListener('click', () => {
    panel.classList.toggle('hidden');
  });

  const replyBtn = card.querySelector('.btn-submit-comment');
  const commentInput = card.querySelector('.comment-input');
  
  const submitComment = async () => {
    const text = commentInput.value.trim();
    if (!text) return;
    
    if (!store.getCurrentUser()) {
      window.openAuthModal('login', navigateCallback);
      return;
    }

    const result = await store.addPostComment(post.id, text);
    if (result.success) {
      commentInput.value = '';
      
      // Re-render list
      const container = card.querySelector('.comments-container');
      const countLabel = card.querySelector('.btn-comment + span');
      countLabel.innerText = result.comments.length;
      
      container.innerHTML = `
        <div class="post-comments-list" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 8px;">
          ${result.comments.map(c => `
            <div style="background: rgba(0,0,0,0.15); padding: 8px 12px; border-radius: 6px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="font-family:var(--font-heading); font-weight:700; font-size:0.8rem; color:var(--color-secondary);">${escapeHtml(c.username)}</span>
                <span style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(c.date)}</span>
              </div>
              <p style="font-size:0.85rem; color:var(--text-primary); margin:0;">${escapeHtml(c.text)}</p>
            </div>
          `).join('')}
        </div>
      `;
    }
  };

  replyBtn.addEventListener('click', submitComment);
  commentInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitComment();
  });

  return card;
}

// Inline markdown/text formatting for posts (highlights combos/tags)
function formatPostText(text) {
  const escaped = escapeHtml(text);
  // Bold combos or text in asterisks
  let formatted = escaped.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--color-secondary); font-family: var(--font-heading);">$1</strong>');
  
  // Highlight hashtag topics
  formatted = formatted.replace(/(#[a-zA-Z0-9_]+)/g, '<span style="color: var(--color-primary); font-weight: 600;">$1</span>');
  
  // Highlight inline backticked combo sequences
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="font-family: var(--font-mono); color: var(--color-secondary); background: var(--bg-input); padding: 2px 6px; border-radius: 4px; font-size: 0.85rem;">$1</code>');
  
  return formatted;
}
