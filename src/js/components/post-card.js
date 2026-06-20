/* Social Post Card Component */
import store from '../store.js';
import { escapeHtml } from '../utils/security.js';
import { renderNotationHtml } from '../utils/combo-parser.js';

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

  let displayContent = post.content || '';
  let notation = '';
  const parts = displayContent.split('\n\n---NOTATION---\n');
  if (parts.length > 1) {
    displayContent = parts[0];
    notation = parts.slice(1).join('\n\n---NOTATION---\n');
  } else {
    const match = displayContent.match(/\nNotation:\s*`?([^`\n\r]+)`?/i);
    if (match) {
      notation = match[1].trim();
      displayContent = displayContent.replace(/\nNotation:\s*`?[^`\n\r]+`?/i, '').trim();
    }
  }

  let saveClass = '';
  if (currentUser && notation) {
    const matchingCombo = store.getCombos().find(function (c) {
      return c.notation === notation;
    });
    if (matchingCombo && currentUser.savedCombos && currentUser.savedCombos.includes(matchingCombo.id)) {
      saveClass = 'active';
    }
  }

  // Parse video iframe
  let videoHtml = '';
  if (post.videoUrl) {
    let embedUrl = post.videoUrl;
    let videoId = '';
    // Simple youtube URL replacement if not already in embed format
    if (post.videoUrl.includes('youtube.com/watch?v=')) {
      videoId = post.videoUrl.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
    } else if (post.videoUrl.includes('youtu.be/')) {
      videoId = post.videoUrl.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
    } else if (post.videoUrl.includes('youtube.com/embed/')) {
      embedUrl = post.videoUrl.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/');
      videoId = embedUrl.split('/embed/')[1]?.split('?')[0];
    }
    
    if (videoId) {
      embedUrl = `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`;
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      videoHtml = `
        <div class="wiki-video-wrapper video-facade-container" data-embed="${embedUrl}">
          <div class="wiki-video-facade" style="background-image: url('${thumbnailUrl}');">
            <div class="play-button-overlay">
              <span class="material-symbols-rounded">play_arrow</span>
            </div>
          </div>
        </div>
      `;
    } else {
      videoHtml = `
        <div class="wiki-video-wrapper">
          <iframe src="${embedUrl}" allowfullscreen></iframe>
        </div>
      `;
    }
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
      <div class="wiki-comments-list">
        ${post.comments.map(function (c) {
          return `
            <div class="wiki-comment-row">
              <div class="wiki-comment-meta">
                <span class="wiki-comment-user">${escapeHtml(c.username)}</span>
                <span class="wiki-comment-time">${escapeHtml(c.date)}</span>
              </div>
              <p class="wiki-comment-text">${escapeHtml(c.text)}</p>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Generate card element container
  const card = document.createElement('article');
  card.className = 'wiki-post-panel wiki-hoverable';
  card.id = `post-${post.id}`;

  const games = store.getGames();
  const gameBadge = post.game ? `<span class="wiki-badge wiki-badge-${post.game}">${games[post.game]?.name || post.game}</span>` : '';

  card.innerHTML = `
    <div class="wiki-post-header">
      <div class="wiki-post-author-row">
        <div class="wiki-user-avatar wiki-author-link" style="border: 2px solid ${post.avatarColor || '#00f0ff'}; cursor: pointer;">
          ${escapeHtml(post.username.substring(0,2).toUpperCase())}
        </div>
          <h4>
            <span class="wiki-author-link wiki-link">${escapeHtml(post.username)}</span>
          </h4>
          <span class="wiki-post-date">${dateStr}</span>
      </div>
      <br/>
              <div class="wiki-author-details">
          ${gameBadge}
          
        </div>
    </div>
    
    <div class="wiki-post-content">
      ${formatPostText(displayContent)}
    </div>
    
    ${videoHtml}
    
    ${renderNotationHtml(notation)}

    <div class="wiki-post-actions">
      <button class="wiki-action-btn btn-upvote ${upvoteClass}" data-id="${post.id}" title="Upvote post">
        <span class="material-symbols-rounded">mode_heat</span>
        ${post.upvotes}
      </button>
      
      ${notation ? `
        <button class="wiki-action-btn btn-save ${saveClass}" title="Save to Dojo">
          <span class="material-symbols-rounded">bookmark</span>
        </button>

        <button class="wiki-action-btn btn-copy" title="Copy Notation">
          <span class="material-symbols-rounded">content_copy</span>
        </button>
      ` : ''}
      
      <button class="wiki-action-btn btn-comment" title="Toggle comments" style="margin-left: auto;">
        <span class="material-symbols-rounded">chat_bubble</span>
        ${post.comments?.length || 0}
      </button>
    </div>

    <!-- Toggleable Comments Panel -->
    <div class="wiki-comments-panel hidden">
      <div class="wiki-comment-editor">
        <input type="text" class="wiki-comment-input comment-input" placeholder="Type your reply..." />
        <button class="wiki-btn wiki-btn-primary btn-submit-comment">Reply</button>
      </div>
      <div class="wiki-comments-container">
        ${commentsHtml}
      </div>
    </div>
  `;

  // Attach functionality
  const upvoteBtn = card.querySelector('.btn-upvote');
  upvoteBtn.addEventListener('click', async function () {
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

  if (notation) {
    const saveBtn = card.querySelector('.btn-save');
    saveBtn.addEventListener('click', async function () {
      if (!store.getCurrentUser()) {
        window.openAuthModal('login', navigateCallback);
        return;
      }
      
      let matchingCombo = store.getCombos().find(function (c) {
        return c.notation === notation;
      });

      if (!matchingCombo) {
        const charName = parseCharacterFromPost(post);
        const titleText = parseTitleFromPost(post);
        
        const comboData = {
          game: post.game || 'ggst',
          character: charName,
          title: titleText,
          notation: notation,
          damage: 'N/A',
          meter: 'None',
          difficulty: 'medium',
          description: post.content || '',
          videoUrl: post.videoUrl || ''
        };
        
        const createResult = await store.createComboWithoutPost(comboData);
        if (createResult.success) {
          matchingCombo = createResult.combo;
        } else {
          window.showToast(createResult.error || 'Failed to save combo to Dojo.');
          return;
        }
      }

      const result = await store.toggleSaveCombo(matchingCombo.id);
      if (result.success) {
        if (result.saved) {
          saveBtn.classList.add('active');
          window.showToast('Combo saved to your Dojo.');
        } else {
          saveBtn.classList.remove('active');
          window.showToast('Combo removed from your Dojo.');
        }
      } else {
        window.showToast(result.error || 'Failed to update bookmark.');
      }
    });

    const copyBtn = card.querySelector('.btn-copy');
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(notation);
      window.showToast('Combo notation copied to clipboard.');
    });
  }

  const commentBtn = card.querySelector('.btn-comment');
  const panel = card.querySelector('.wiki-comments-panel');
  commentBtn.addEventListener('click', function () {
    panel.classList.toggle('hidden');
  });

  const replyBtn = card.querySelector('.btn-submit-comment');
  const commentInput = card.querySelector('.comment-input');
  
  async function submitComment() {
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
      const container = card.querySelector('.wiki-comments-container');
      const countLabel = card.querySelector('.wiki-comment-counter');
      countLabel.innerText = result.comments.length;
      
      container.innerHTML = `
        <div class="wiki-comments-list">
          ${result.comments.map(function (c) {
            return `
              <div class="wiki-comment-row">
                <div class="wiki-comment-meta">
                  <span class="wiki-comment-user">${escapeHtml(c.username)}</span>
                  <span class="wiki-comment-time">${escapeHtml(c.date)}</span>
                </div>
                <p class="wiki-comment-text">${escapeHtml(c.text)}</p>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      window.showToast(result.error || 'Failed to post reply.');
    }
  }

  replyBtn.addEventListener('click', submitComment);
  commentInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') submitComment();
  });

  // Attach author click listener
  const authorLinks = card.querySelectorAll('.wiki-author-link');
  authorLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      navigateCallback('profile', { userId: post.userId });
    });
  });

  // Attach video facade play listener
  const facade = card.querySelector('.video-facade-container');
  if (facade) {
    facade.addEventListener('click', function () {
      const embedUrl = facade.getAttribute('data-embed');
      if (embedUrl) {
        facade.innerHTML = `<iframe src="${embedUrl}" allowfullscreen allow="autoplay"></iframe>`;
      }
    });
  }

  return card;
}

// Inline markdown/text formatting for posts (highlights combos/tags)
function formatPostText(text) {
  const escaped = escapeHtml(text);
  // Bold combos or text in asterisks
  let formatted = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="color-secondary">$1</strong>');
  
  // Highlight hashtag topics
  formatted = formatted.replace(/(#[a-zA-Z0-9_]+)/g, '<span class="color-primary">$1</span>');
  
  // Highlight inline backticked combo sequences
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="post-code-inline">$1</code>');
  
  return formatted;
}

function parseCharacterFromPost(post) {
  if (!post.game) return 'All';
  const games = store.getGames();
  const gameObj = games[post.game];
  if (!gameObj || !gameObj.characters) return 'All';
  
  const contentUpper = (post.content || '').toUpperCase();
  for (let i = 0; i < gameObj.characters.length; i++) {
    const charName = gameObj.characters[i];
    const normalizedChar = charName.toUpperCase();
    const noSpecialChar = normalizedChar.replace(/[-.\s]/g, '');
    if (contentUpper.includes(normalizedChar) || contentUpper.includes(noSpecialChar)) {
      return charName;
    }
  }
  return 'All';
}

function parseTitleFromPost(post) {
  const quoteMatch = (post.content || '').match(/"([^"]+)"/);
  if (quoteMatch) return quoteMatch[1];
  return 'Combo by ' + post.username;
}
