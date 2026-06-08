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
      <div class="video-wrapper post-video-wrapper">
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

  let commentsHtml = '';
  if (post.comments && post.comments.length > 0) {
    commentsHtml = `
      <div class="post-comments-list">
        ${post.comments.map(c => `
          <div class="post-comment-row">
            <div class="post-comment-meta">
              <span class="post-comment-user">${escapeHtml(c.username)}</span>
              <span class="post-comment-time">${escapeHtml(c.date)}</span>
            </div>
            <p class="post-comment-text">${escapeHtml(c.text)}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Generate card element container
  const card = document.createElement('article');
  card.className = 'card card-hoverable mb-5 post-card';
  card.id = `post-${post.id}`;

  const games = store.getGames();
  const gameBadge = post.game ? `<span class="badge badge-${post.game} ml-2">${games[post.game]?.name || post.game}</span>` : '';

  card.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-3">
        <div class="avatar post-author-link cursor-pointer" style="border-color: ${post.avatarColor || '#00f0ff'};">
          ${escapeHtml(post.username.substring(0,2).toUpperCase())}
        </div>
        <div>
          <h4>
            <span class="post-author-link underline-link">${escapeHtml(post.username)}</span>
            ${gameBadge}
          </h4>
          <span class="font-xs text-muted">${dateStr}</span>
        </div>
      </div>
    </div>
    
    <div class="post-content">
      ${formatPostText(post.content)}
    </div>
    
    ${videoHtml}

    <div class="flex items-center gap-4 post-footer-actions">
      <button class="btn-icon btn-upvote ${upvoteClass}" data-id="${post.id}" title="Upvote post">
        <i class="fa-solid fa-fire"></i>
      </button>
      <span class="upvote-count font-heading font-bold font-md">${post.upvotes} 🔥</span>
      
      <button class="btn-icon btn-comment ml-auto" title="Toggle comments">
        <i class="fa-regular fa-comment"></i>
      </button>
      <span class="font-heading font-bold font-md">${post.comments?.length || 0}</span>
    </div>

    <!-- Toggleable Comments Panel -->
    <div class="comments-panel hidden mt-4">
      <div class="post-comment-editor-row mt-0">
        <input type="text" class="form-input comment-input post-comment-box" placeholder="Type your reply..." />
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
    } else {
      window.showToast(result.error || 'Failed to update reaction.');
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
        <div class="post-comments-list">
          ${result.comments.map(c => `
            <div class="post-comment-row">
              <div class="post-comment-meta">
                <span class="post-comment-user">${escapeHtml(c.username)}</span>
                <span class="post-comment-time">${escapeHtml(c.date)}</span>
              </div>
              <p class="post-comment-text">${escapeHtml(c.text)}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      window.showToast(result.error || 'Failed to post reply.');
    }
  };

  replyBtn.addEventListener('click', submitComment);
  commentInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitComment();
  });

  // Attach author click listener
  const authorLinks = card.querySelectorAll('.post-author-link');
  authorLinks.forEach(link => {
    link.addEventListener('click', () => {
      navigateCallback('profile', { userId: post.userId });
    });
  });

  return card;
}

// Inline markdown/text formatting for posts (highlights combos/tags)
function formatPostText(text) {
  const escaped = escapeHtml(text);
  // Bold combos or text in asterisks
  let formatted = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="color-secondary font-heading">$1</strong>');
  
  // Highlight hashtag topics
  formatted = formatted.replace(/(#[a-zA-Z0-9_]+)/g, '<span class="color-primary font-semibold">$1</span>');
  
  // Highlight inline backticked combo sequences
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="post-code-inline">$1</code>');
  
  return formatted;
}
