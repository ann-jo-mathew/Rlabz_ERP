import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, getChatMessages, saveChatMessage, ensureDataLoaded } from './studentStore.js';
import { StudentSwal, showStudentWarning, showStudentError } from '../studentAlerts.js';
import '../student.css';

export async function StudentChat(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in student-comm-view';

  const projects = getProjects() || [];
  
  // Default select first project
  let selectedProjectTitle = projects.length > 0 ? projects[0].title : '';
  let chatSearch = '';
  let draftMessage = '';

  function render() {
    const messages = getChatMessages() || [];
    const currentProject = projects.find(p => p.title === selectedProjectTitle);
    
    // Filter messages for current project
    const projectMsgs = messages.filter(m => m.project === selectedProjectTitle);

    // KPI Metrics
    const totalSupervisorsCount = projects.length;
    const totalMsgsCount = messages.length;
    const projectMsgsCount = projectMsgs.length;
    const mySentCount = messages.filter(m => m.sender === 'student').length;

    // Filter project list for sidebar
    const filteredProjects = projects.filter(p => {
      if (!chatSearch.trim()) return true;
      const q = chatSearch.toLowerCase().trim();
      return (p.title || '').toLowerCase().includes(q) || (p.faculty || '').toLowerCase().includes(q);
    });

    // 1. Build chat sidebar lists (chats per project)
    const chatSidebarItems = filteredProjects.map(p => {
      const isSelected = p.title === selectedProjectTitle;
      const pMsgs = messages.filter(m => m.project === p.title);
      const lastMsg = pMsgs.length > 0 ? pMsgs[pMsgs.length - 1] : null;
      const initial = (p.faculty || 'S').charAt(0).toUpperCase();

      return `
        <div class="student-comm-item ${isSelected ? 'active' : ''}" data-project="${p.title}">
          <div class="student-comm-avatar">
            ${initial}
            <span class="student-comm-online-dot" title="Online Supervisor"></span>
          </div>
          <div class="student-comm-item-info">
            <div class="student-comm-item-title" title="${p.title}">${p.title}</div>
            <div class="student-comm-item-faculty">
              ${p.faculty} (Supervisor)
            </div>
          </div>
          ${pMsgs.length > 0 ? `
            <span class="student-badge student-badge-info" style="font-size: 0.65rem; padding: 2px 6px;">
              ${pMsgs.length}
            </span>
          ` : ''}
        </div>
      `;
    }).join('');

    // 2. Build message list HTML
    const messagesHtml = projectMsgs.map(m => {
      const isStudent = m.sender === 'student';
      const timeStr = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="student-comm-msg-wrap ${isStudent ? 'sent' : 'received'}">
          <div class="student-comm-bubble">
            ${m.text}
          </div>
          <div class="student-comm-meta">
            ${isStudent ? `
              <span style="font-weight: 700; color: #0284c7;">You</span>
              <span>•</span>
              <span>${timeStr}</span>
            ` : `
              <span style="font-weight: 700; color: #334155;">${currentProject ? currentProject.faculty : 'Supervisor'}</span>
              <span>•</span>
              <span>${timeStr}</span>
            `}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <!-- Header Banner -->
      <div class="student-comm-header-wrapper">
        <div class="student-comm-header-left">
          <div class="student-comm-brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <h1 class="student-comm-title">Faculty Communication</h1>
            <p class="student-comm-subtitle">Direct encrypted messaging and feedback exchange with your project supervisor.</p>
          </div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="student-comm-kpi-grid">
        <div class="student-comm-kpi-card kpi-blue">
          <div class="student-comm-kpi-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div class="student-comm-kpi-info">
            <div class="student-comm-kpi-val">${totalSupervisorsCount}</div>
            <div class="student-comm-kpi-lbl">Active Supervisors</div>
          </div>
        </div>

        <div class="student-comm-kpi-card kpi-indigo">
          <div class="student-comm-kpi-icon indigo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <div class="student-comm-kpi-info">
            <div class="student-comm-kpi-val">${totalMsgsCount}</div>
            <div class="student-comm-kpi-lbl">Total Messages</div>
          </div>
        </div>

        <div class="student-comm-kpi-card kpi-emerald">
          <div class="student-comm-kpi-icon emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div class="student-comm-kpi-info">
            <div class="student-comm-kpi-val">${mySentCount}</div>
            <div class="student-comm-kpi-lbl">Messages Sent</div>
          </div>
        </div>

        <div class="student-comm-kpi-card kpi-amber">
          <div class="student-comm-kpi-icon amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <div class="student-comm-kpi-info">
            <div class="student-comm-kpi-val" style="font-size: 1.15rem; font-weight: 800; color: #d97706;">Live & Direct</div>
            <div class="student-comm-kpi-lbl">Channel Status</div>
          </div>
        </div>
      </div>

      <!-- Messenger Workspace Layout -->
      <div class="student-comm-container-card">
        <div class="student-comm-layout">
          <!-- Chat Sidebar (Left) -->
          <div class="student-comm-sidebar">
            <div class="student-comm-sidebar-head">
              <div class="student-comm-sidebar-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span>Project Supervisors</span>
              </div>
              <div class="student-comm-sidebar-search-wrap">
                <svg class="student-comm-sidebar-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" id="comm-search-input" class="student-comm-sidebar-search-input" placeholder="Search chats..." value="${chatSearch}">
              </div>
            </div>
            <div class="student-comm-sidebar-list">
              ${chatSidebarItems || '<div style="padding:24px 16px; text-align:center; color:var(--text-muted); font-size:0.82rem;">No active project supervisors found.</div>'}
            </div>
          </div>

          <!-- Chat Conversation Area (Right) -->
          <div class="student-comm-main">
            ${currentProject ? `
              <!-- Header -->
              <div class="student-comm-header">
                <div class="student-comm-header-user">
                  <div class="student-comm-avatar" style="width: 38px; height: 38px; font-size: 0.95rem;">
                    ${(currentProject.faculty || 'S').charAt(0).toUpperCase()}
                    <span class="student-comm-online-dot"></span>
                  </div>
                  <div>
                    <div class="student-comm-header-title">${currentProject.title}</div>
                    <div class="student-comm-header-sub">
                      Supervisor: <strong style="color: #334155;">${currentProject.faculty}</strong>
                    </div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="student-badge student-badge-success" style="font-size: 0.74rem; font-weight: 700;">
                    ● Active Channel
                  </span>
                </div>
              </div>

              <!-- Message Stream -->
              <div class="student-comm-body" id="chat-body">
                <div class="student-comm-date-pill">Conversation History</div>
                ${messagesHtml || `
                  <div style="text-align:center; color:var(--text-muted); margin: 60px auto 0; font-size:0.88rem; max-width: 360px;">
                    <div style="font-size: 2rem; margin-bottom: 8px;">💬</div>
                    <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">No messages in this chat yet</div>
                    <div style="font-size: 0.8rem;">Start the conversation with your supervisor by sending a message below.</div>
                  </div>
                `}
              </div>

              <!-- Quick Prompt Suggestions -->
              <div class="student-comm-quick-prompts">
                <button type="button" class="student-comm-prompt-chip" data-prompt="Hi Professor, I have pushed updates to the sprint branch.">
                  🚀 Sprint updates pushed
                </button>
                <button type="button" class="student-comm-prompt-chip" data-prompt="Could you please review my pull request when convenient?">
                  🔍 Review Pull Request
                </button>
                <button type="button" class="student-comm-prompt-chip" data-prompt="I need clarification regarding the database schema task.">
                  ❓ Schema clarification
                </button>
                <button type="button" class="student-comm-prompt-chip" data-prompt="Can we schedule a quick 10-minute sync during your office hours?">
                  📅 Request sync
                </button>
              </div>

              <!-- Footer Input -->
              <form id="chat-form" class="student-comm-footer">
                <input type="text" id="chat-input" class="student-comm-input" placeholder="Type a message to ${currentProject.faculty}..." value="${draftMessage}" required autocomplete="off">
                <button type="submit" class="student-comm-send-btn">
                  <span>Send</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </form>
            ` : `
              <div style="display:flex; flex-direction: column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); gap: 10px;">
                <div style="font-size: 2.5rem;">📬</div>
                <div style="font-weight: 700; color: var(--text-primary);">Select a Project Chat</div>
                <div style="font-size: 0.85rem;">Choose a supervisor from the left list to open the conversation.</div>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    // Scroll chat stream to bottom
    const chatBody = container.querySelector('#chat-body');
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Bind sidebar clicks
    container.querySelectorAll('.student-comm-item').forEach(el => {
      el.addEventListener('click', () => {
        selectedProjectTitle = el.getAttribute('data-project');
        render();
      });
    });

    // Bind search input
    const searchInput = container.querySelector('#comm-search-input');
    searchInput?.addEventListener('input', (e) => {
      chatSearch = e.target.value;
      render();
      const input = container.querySelector('#comm-search-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });

    // Bind quick prompt chips
    container.querySelectorAll('.student-comm-prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-prompt');
        const input = container.querySelector('#chat-input');
        if (input) {
          input.value = text;
          draftMessage = text;
          input.focus();
        }
      });
    });

    // Bind chat form submit
    const chatForm = container.querySelector('#chat-form');
    chatForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = container.querySelector('#chat-input');
      const text = input ? input.value.trim() : '';

      if (!selectedProjectTitle) {
        showStudentWarning('No Project Selected', 'Please select a project chat from the left panel before sending a message.');
        return;
      }

      if (!text) {
        showStudentWarning('Empty Message', 'Please type a message before sending.');
        return;
      }

      try {
        await saveChatMessage(selectedProjectTitle, text);
        draftMessage = '';
        render();
      } catch (err) {
        showStudentError('Message Failed', 'Could not send message. Please try again.');
      }
    });
  }

  render();
  return container;
}

export default StudentChat;

