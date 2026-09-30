/**
 * OmniOps Enterprise Manager — Minimalist UI Interaction Engine
 * Pure Vanilla JavaScript (Zero External Dependencies)
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const sidebar = document.getElementById('sidebar');
  const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const commandDrawer = document.getElementById('commandDrawer');
  const toggleDrawerBtn = document.getElementById('toggleDrawerBtn');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  
  const chatInput = document.getElementById('chatInput');
  const chatForm = document.getElementById('chatForm');
  const chatStream = document.getElementById('chatStream');
  const chatViewport = document.getElementById('chatViewport');
  
  const winAgentToggle = document.getElementById('winAgentToggle');
  const switchWin = document.getElementById('switchWin');
  
  const headerModelBadge = document.getElementById('currentModelBadge');
  const headerLatencyBadge = document.getElementById('currentLatencyBadge');
  const headerCoreBadge = document.getElementById('currentCoreBadge');
  
  const modelCards = document.querySelectorAll('.model-select-card');
  const coreBtns = document.querySelectorAll('.core-btn');

  // ============================================================================
  // 1. Sidebar Toggle (Desktop Collapse & Mobile Drawer)
  // ============================================================================
  function toggleSidebar() {
    if (window.innerWidth <= 900) {
      const isOpen = sidebar.classList.contains('mobile-open');
      if (isOpen) {
        sidebar.classList.remove('mobile-open');
        drawerBackdrop.classList.remove('active');
      } else {
        sidebar.classList.add('mobile-open');
        drawerBackdrop.classList.add('active');
        // Close drawer if open
        commandDrawer.classList.remove('open');
      }
    } else {
      sidebar.classList.toggle('collapsed');
    }
  }

  if (sidebarCollapseBtn) sidebarCollapseBtn.addEventListener('click', toggleSidebar);
  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleSidebar);

  // ============================================================================
  // 2. Command Center Slide-Over Drawer (Zero-Popup Architecture)
  // ============================================================================
  function openCommandDrawer() {
    commandDrawer.classList.add('open');
    commandDrawer.setAttribute('aria-hidden', 'false');
    drawerBackdrop.classList.add('active');
    // On mobile, close sidebar if open
    if (sidebar.classList.contains('mobile-open')) {
      sidebar.classList.remove('mobile-open');
    }
  }

  function closeCommandDrawer() {
    commandDrawer.classList.remove('open');
    commandDrawer.setAttribute('aria-hidden', 'true');
    drawerBackdrop.classList.remove('active');
    if (sidebar.classList.contains('mobile-open')) {
      sidebar.classList.remove('mobile-open');
    }
  }

  if (toggleDrawerBtn) toggleDrawerBtn.addEventListener('click', openCommandDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeCommandDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', () => {
    closeCommandDrawer();
    sidebar.classList.remove('mobile-open');
  });

  // ESC key to close drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCommandDrawer();
      sidebar.classList.remove('mobile-open');
    }
    // Command/Ctrl + N for new chat
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      document.getElementById('newChatBtn')?.click();
    }
  });

  // ============================================================================
  // 3. Auto-Expanding Textarea (ChatGPT Behavior)
  // ============================================================================
  function autoExpandTextarea() {
    chatInput.style.height = 'auto';
    const newHeight = Math.min(chatInput.scrollHeight, 200);
    chatInput.style.height = `${newHeight}px`;
  }

  chatInput.addEventListener('input', autoExpandTextarea);

  // Enter to send (Shift+Enter for newline)
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  // ============================================================================
  // 4. Inset Tools & Agent Switches
  // ============================================================================
  if (winAgentToggle && switchWin) {
    winAgentToggle.addEventListener('click', () => {
      const newState = !winAgentToggle.classList.contains('active');
      winAgentToggle.classList.toggle('active', newState);
      switchWin.checked = newState;
    });

    switchWin.addEventListener('change', () => {
      winAgentToggle.classList.toggle('active', switchWin.checked);
    });
  }

  // ============================================================================
  // 5. Model Selection Interactions
  // ============================================================================
  modelCards.forEach((card) => {
    card.addEventListener('click', () => {
      modelCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      
      const title = card.querySelector('.card-title')?.innerText || '';
      const latency = card.querySelector('.card-meta span:last-child')?.innerText || '20ms';
      
      headerModelBadge.innerText = title.split('(')[0].trim();
      headerLatencyBadge.innerText = latency;
    });
  });

  // ============================================================================
  // 6. Multi-Core Target Switcher (Local vs Cloud Core)
  // ============================================================================
  coreBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      coreBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const coreType = btn.dataset.core;
      headerCoreBadge.innerText = coreType === 'cloud' ? 'Cloud Core (GDrive)' : 'Local Core';
    });
  });

  // ============================================================================
  // 7. Message Submission & Simulated Orchestration Response
  // ============================================================================
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Append User Message
    const userMsg = document.createElement('article');
    userMsg.className = 'message message-user';
    userMsg.innerHTML = `
      <div class="message-content">
        <div class="message-body">
          <p>${escapeHTML(text)}</p>
        </div>
        <div class="message-meta-end">
          <span>${timeStr}</span>
        </div>
      </div>
    `;
    chatStream.appendChild(userMsg);

    // Clear and reset textarea
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatViewport.scrollTop = chatViewport.scrollHeight;

    // Simulate AI Thinking / Orchestrating
    const isWinAgentActive = winAgentToggle.classList.contains('active');
    setTimeout(() => {
      const aiMsg = document.createElement('article');
      aiMsg.className = 'message message-ai';
      
      let responseBody = `درخواست شما تحلیل گردید و فرآیند پردازش با موفقیت آغاز شد.`;
      if (isWinAgentActive) {
        responseBody += ` بازوی ویندوز (Windows Agent) دستور را در محیط ایزوله اجرا نموده و وضعیت سلامت شبکه را پایش کرد.`;
      }

      aiMsg.innerHTML = `
        <div class="message-avatar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
        </div>
        <div class="message-content">
          <div class="message-sender">
            <span>هسته ارکستراسیون چندعاملی OmniOps</span>
            <span class="meta-separator">·</span>
            <span class="message-time">${timeStr}</span>
          </div>
          <div class="message-body">
            <p>${responseBody}</p>
          </div>
          <div class="message-actions">
            <button class="action-btn" title="کپی متن" onclick="copyText(this)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
        </div>
      `;
      chatStream.appendChild(aiMsg);
      chatViewport.scrollTop = chatViewport.scrollHeight;
    }, 600);
  });

  // Helpers
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
});

// Global Code Copy Function
window.copyCode = function(button) {
  const pre = button.closest('.code-block-wrapper').querySelector('pre code');
  if (pre) {
    navigator.clipboard.writeText(pre.innerText).then(() => {
      const orig = button.innerText;
      button.innerText = 'کپی شد!';
      setTimeout(() => button.innerText = orig, 2000);
    });
  }
};

window.copyText = function(button) {
  const p = button.closest('.message-content').querySelector('.message-body p');
  if (p) {
    navigator.clipboard.writeText(p.innerText).then(() => {
      button.style.color = '#10b981';
      setTimeout(() => button.style.color = '', 1800);
    });
  }
};
