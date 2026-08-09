import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, getChatMessages, saveChatMessage } from './mockStore.js';
import '../student.css';

export function StudentChat(route, router) {
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  const projects = getProjects();
  
  // Default select first project
  let selectedProjectTitle = projects.length > 0 ? projects[0].title : '';

  function render() {
    const messages = getChatMessages();
    const currentProject = projects.find(p => p.title === selectedProjectTitle);
    
    // Filter messages for current project
    const projectMsgs = messages.filter(m => m.project === selectedProjectTitle);

    // 1. Build chat sidebar lists (chats per project)
    const chatSidebarItems = projects.map(p => `
      <div class="student-chat-list-item ${p.title === selectedProjectTitle ? 'active' : ''}" data-project="${p.title}">
        <span class="student-chat-list-name">${p.title}</span>
        <span class="student-chat-list-role">${p.faculty} (Supervisor)</span>
      </div>
    `).join('');

    // 2. Build message list HTML
    const messagesHtml = projectMsgs.map(m => {
      const isStudent = m.sender === 'student';
      const timeStr = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="student-chat-msg-wrapper ${isStudent ? 'sent' : 'received'}">
          <div class="student-chat-msg">
            ${m.text}
          </div>
          <span class="student-chat-msg-meta">${isStudent ? 'You' : currentProject.faculty} • ${timeStr}</span>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="student-header">
        <h1>Faculty Communication</h1>
        <p>Direct communication channel with your assigned project supervisor.</p>
      </div>

      <div class="student-card" style="padding: 0;">
        <div class="student-chat-layout">
          <!-- Chat Sidebar (Left) -->
          <div class="student-chat-sidebar">
            <div class="student-chat-search">
              <div style="font-weight:700; font-size:0.9rem; color:var(--text-main);">My Project Chats</div>
            </div>
            <div class="student-chat-list">
              ${chatSidebarItems || '<div style="padding:16px;text-align:center;color:var(--text-muted);">No active project supervisors.</div>'}
            </div>
          </div>

          <!-- Chat Conversation (Right) -->
          <div class="student-chat-main">
            ${currentProject ? `
              <!-- Header -->
              <div class="student-chat-header">
                <div>
                  <div class="student-chat-header-title">${currentProject.title}</div>
                  <div class="student-chat-header-subtitle">Supervisor: <strong>${currentProject.faculty}</strong></div>
                </div>
                <div>
                  <span class="student-badge student-badge-success">Online</span>
                </div>
              </div>

              <!-- Message Stream -->
              <div class="student-chat-body" id="chat-body">
                ${messagesHtml || `
                  <div style="text-align:center; color:var(--text-muted); margin-top:40px; font-size:0.9rem;">
                    No messages in this chat. Start the conversation by sending a message below.
                  </div>
                `}
              </div>

              <!-- Footer Input -->
              <form id="chat-form" class="student-chat-footer">
                <input type="text" id="chat-input" class="student-input" style="flex:1; border-radius: 20px; padding: 10px 20px;" placeholder="Type a message to ${currentProject.faculty}..." required>
                <button type="submit" class="student-btn student-btn-primary" style="border-radius:20px; padding: 10px 24px;">
                  Send
                </button>
              </form>
            ` : `
              <div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-muted);">
                Select a project chat from the left panel.
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
    container.querySelectorAll('.student-chat-list-item').forEach(el => {
      el.addEventListener('click', () => {
        selectedProjectTitle = el.getAttribute('data-project');
        render();
      });
    });

    // Bind chat form submit
    const chatForm = container.querySelector('#chat-form');
    chatForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = container.querySelector('#chat-input');
      const text = input.value.trim();

      if (!text || !selectedProjectTitle) return;

      saveChatMessage(selectedProjectTitle, text);
      input.value = '';
      render();
    });
  }

  render();
  return container;
}

export default StudentChat;
