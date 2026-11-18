import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, fetchLiveChatMessages, sendLiveChatMessage, getWorkLogs, ensureDataLoaded } from './studentStore.js';
import { StudentSwal, showStudentWarning, showStudentError } from '../studentAlerts.js';
import { STORAGE_BASE } from '@/core/config/api.js';
import '../student.css';

export async function StudentChat(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in student-comm-view';

  const projects = getProjects() || [];

  // State
  let selectedProjectTitle = projects.length > 0 ? projects[0].title : '';
  let chatMode = 'individual'; // 'individual' (Direct with supervisor) | 'group' (Team group)
  let chatSearch = '';
  let draftMessage = '';
  let currentAttachment = null;
  let liveMessages = [];
  let isLoadingLive = false;
  let isSending = false;
  let pollInterval = null;

  function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  function startPolling() {
    stopPolling();
    pollInterval = setInterval(async () => {
      const curProj = projects.find(p => p.title === selectedProjectTitle);
      if (!curProj) return;
      try {
        const msgs = await fetchLiveChatMessages(curProj.id, chatMode);
        // Only update DOM if message count or last message changed
        const lastCurId = liveMessages.length > 0 ? liveMessages[liveMessages.length - 1].id : null;
        const lastNewId = msgs.length > 0 ? msgs[msgs.length - 1].id : null;
        if (msgs.length !== liveMessages.length || lastCurId !== lastNewId) {
          liveMessages = msgs;
          updateMessagesFeedDom();
        }
      } catch (err) {
        // silent fail on polling error
      }
    }, 3500);
  }

  // Load messages for currently selected project and mode
  async function loadCurrentChatMessages(showLoading = true) {
    const curProj = projects.find(p => p.title === selectedProjectTitle);
    if (!curProj) {
      liveMessages = [];
      return;
    }

    // If project has no faculty supervisor assigned, auto fallback to group chat
    if (chatMode === 'individual' && (!curProj.faculty || curProj.faculty === 'Unassigned' || curProj.faculty === '—')) {
      chatMode = 'group';
    }

    if (showLoading) {
      isLoadingLive = true;
      render();
    }

    try {
      liveMessages = await fetchLiveChatMessages(curProj.id, chatMode);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
      liveMessages = [];
    } finally {
      isLoadingLive = false;
      render();
      scrollToBottom();
      startPolling();
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      const chatBody = container.querySelector('#chat-body');
      if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }, 50);
  }

  function buildMessagesHtml(messages, currentProject) {
    if (!messages || messages.length === 0) {
      return `
        <div style="text-align:center; color:var(--text-muted); margin: 60px auto 0; font-size:0.88rem; max-width: 380px;">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">💬</div>
          <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
            ${chatMode === 'individual' ? 'No private messages yet' : 'No team group messages yet'}
          </div>
          <div style="font-size: 0.8rem; color: #64748b;">
            ${chatMode === 'individual'
              ? `Start the 1-on-1 conversation with your supervisor (${currentProject?.faculty || 'Faculty'}) below.`
              : 'Start collaborating with your project teammates and faculty in this group channel.'}
          </div>
        </div>
      `;
    }

    return messages.map(m => {
      const isStudent = (m.isMe !== undefined) ? m.isMe : (m.sender === 'student');
      let timeStr = '';
      try {
        timeStr = new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        timeStr = m.time || '';
      }
      const hasAttachment = Boolean(m.attachment && (m.attachment.url || m.attachment.dataUrl || m.attachment.name));

      const senderDisplay = isStudent
        ? 'You'
        : (m.senderName || (currentProject ? currentProject.faculty : 'Supervisor'));

      return `
        <div class="student-comm-msg-wrap ${isStudent ? 'sent' : 'received'}">
          <div class="student-comm-bubble">
            ${m.text ? `
              <div style="white-space: pre-wrap; word-break: break-word; ${hasAttachment ? 'margin-bottom: 8px;' : ''}">
                ${m.text}
              </div>
            ` : ''}
            ${hasAttachment ? `
              <div class="student-comm-file-card" data-filename="${m.attachment.name || 'file'}" data-fileurl="${m.attachment.url || m.attachment.dataUrl || ''}" title="Click to download ${m.attachment.name || 'attachment'}">
                <div class="student-comm-file-icon">
                  ${(m.attachment.name || '').toLowerCase().endsWith('.pdf') ? '📄' :
                    (m.attachment.name || '').toLowerCase().endsWith('.csv') || (m.attachment.name || '').toLowerCase().endsWith('.xlsx') ? '📊' :
                    (m.attachment.type || '').startsWith('image/') ? '🖼️' : '📎'}
                </div>
                <div class="student-comm-file-details">
                  <div class="student-comm-file-name">${m.attachment.name || 'Attached File'}</div>
                  <div class="student-comm-file-size">${formatFileSize(m.attachment.size) || 'Ready to download'}</div>
                </div>
                <button type="button" class="student-comm-file-download-btn" title="Download">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </button>
              </div>
            ` : ''}
          </div>
          <div class="student-comm-meta">
            <span style="font-weight: 700; color: ${isStudent ? '#00796B' : '#334155'};">${senderDisplay}</span>
            <span>•</span>
            <span>${timeStr}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateMessagesFeedDom() {
    const chatBody = container.querySelector('#chat-body');
    if (!chatBody) return;
    const curProj = projects.find(p => p.title === selectedProjectTitle);
    const wasNearBottom = chatBody.scrollHeight - chatBody.scrollTop - chatBody.clientHeight < 120;
    
    // Preserve date pill
    chatBody.innerHTML = `
      <div class="student-comm-date-pill">${chatMode === 'individual' ? '1-on-1 Supervisor Thread' : 'Project Group Thread'}</div>
      ${buildMessagesHtml(liveMessages, curProj)}
    `;

    bindAttachmentClicks();

    if (wasNearBottom) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  function bindAttachmentClicks() {
    container.querySelectorAll('.student-comm-file-card').forEach(card => {
      card.onclick = () => {
        let fileUrl = card.getAttribute('data-fileurl');
        const filename = card.getAttribute('data-filename') || 'download';
        if (fileUrl) {
          if (fileUrl.startsWith('/storage')) {
            fileUrl = `${STORAGE_BASE}${fileUrl.replace(/^\/storage/, '')}`;
          }
          const a = document.createElement('a');
          a.href = fileUrl;
          a.download = filename;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          showStudentWarning('File Unavailable', 'This attachment does not have a valid download link.');
        }
      };
    });
  }

  function render() {
    const currentProject = projects.find(p => p.title === selectedProjectTitle);
    const hasFaculty = currentProject && currentProject.faculty && currentProject.faculty !== 'Unassigned' && currentProject.faculty !== '—';

    // Metrics
    const totalSupervisorsCount = projects.filter(p => p.faculty && p.faculty !== 'Unassigned').length;
    const totalProjectsCount = projects.length;
    const currentMsgsCount = liveMessages.length;
    const mySentCount = liveMessages.filter(m => m.isMe || m.sender === 'student').length;

    // Filter projects for sidebar
    const filteredProjects = projects.filter(p => {
      if (!chatSearch.trim()) return true;
      const q = chatSearch.toLowerCase().trim();
      return (p.title || '').toLowerCase().includes(q) || (p.faculty || '').toLowerCase().includes(q);
    });

    // 1. Build chat sidebar lists (chats per project)
    const chatSidebarItems = filteredProjects.map(p => {
      const isSelected = p.title === selectedProjectTitle;
      const initial = (p.faculty || p.title || 'S').charAt(0).toUpperCase();

      return `
        <div class="student-comm-item ${isSelected ? 'active' : ''}" data-project="${p.title}">
          <div class="student-comm-avatar">
            ${initial}
            <span class="student-comm-online-dot" title="Project Channel"></span>
          </div>
          <div class="student-comm-item-info">
            <div class="student-comm-item-title" title="${p.title}">${p.title}</div>
            <div class="student-comm-item-faculty">
              ${p.faculty ? `${p.faculty} (Supervisor)` : 'No Faculty Assigned'}
            </div>
          </div>
        </div>
      `;
    }).join('');

    const messagesHtml = buildMessagesHtml(liveMessages, currentProject);

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
            <h1 class="student-comm-title">Project & Faculty Communication</h1>
            <p class="student-comm-subtitle" style="font-size:0.85rem; color:#64748b; margin:2px 0 0;">
              Live direct messaging with supervisors and collaborative project team discussions.
            </p>
          </div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="student-comm-kpi-grid">
        <div class="student-comm-kpi-card kpi-sidebar-primary" title="Assigned Supervisors">
          <div class="student-comm-kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div class="student-comm-kpi-info">
            <div class="student-comm-kpi-val">${totalSupervisorsCount}</div>
            <div class="student-comm-kpi-lbl">Supervisors</div>
          </div>
        </div>

        <div class="student-comm-kpi-card kpi-purple" title="My Projects">
          <div class="student-comm-kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <div class="student-comm-kpi-info">
            <div class="student-comm-kpi-val">${totalProjectsCount}</div>
            <div class="student-comm-kpi-lbl">Projects</div>
          </div>
        </div>

        <div class="student-comm-kpi-card kpi-indigo" title="Messages Sent by Me in Current Chat">
          <div class="student-comm-kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div class="student-comm-kpi-info">
            <div class="student-comm-kpi-val">${mySentCount}</div>
            <div class="student-comm-kpi-lbl">Sent by Me</div>
          </div>
        </div>

        <div class="student-comm-kpi-card kpi-amber" title="Messages in Current Channel">
          <div class="student-comm-kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </div>
          <div class="student-comm-kpi-info">
            <div class="student-comm-kpi-val">${currentMsgsCount}</div>
            <div class="student-comm-kpi-lbl">Channel Messages</div>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00796B" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span>Projects</span>
              </div>
              <div class="student-comm-sidebar-search-wrap">
                <svg class="student-comm-sidebar-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" id="comm-search-input" class="student-comm-sidebar-search-input" placeholder="Search projects..." value="${chatSearch}">
              </div>
            </div>
            <div class="student-comm-sidebar-list">
              ${chatSidebarItems || '<div style="padding:24px 16px; text-align:center; color:var(--text-muted); font-size:0.82rem;">No active projects found.</div>'}
            </div>
          </div>

          <!-- Chat Conversation Area (Right) -->
          <div class="student-comm-main">
            ${currentProject ? `
              <!-- Header with Mode Toggle -->
              <div class="student-comm-header" style="flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid #e2e8f0; padding: 0.85rem 1.25rem;">
                <div class="student-comm-header-user">
                  <div class="student-comm-avatar" style="width: 40px; height: 40px; font-size: 1rem; background: #00796B; color: #fff;">
                    ${(currentProject.faculty || currentProject.title || 'S').charAt(0).toUpperCase()}
                    <span class="student-comm-online-dot"></span>
                  </div>
                  <div>
                    <div class="student-comm-header-title" style="font-weight: 800; font-size: 1.05rem; color: #0f172a;">${currentProject.title}</div>
                    <div class="student-comm-header-sub" style="font-size: 0.82rem; color: #64748b;">
                      Supervisor: <strong style="color: #00796B;">${currentProject.faculty || 'Not Assigned'}</strong>
                    </div>
                  </div>
                </div>

                <!-- Chat Channel Tabs (Direct vs Group) -->
                <div class="student-chat-channel-tabs" style="display: flex; align-items: center; background: #f1f5f9; padding: 3px; border-radius: 8px; margin-left: auto;">
                  <button 
                    type="button" 
                    id="tab-mode-individual" 
                    class="btn-chat-tab ${chatMode === 'individual' ? 'active' : ''}" 
                    style="display: flex; align-items: center; gap: 5px; padding: 6px 14px; font-size: 0.82rem; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; transition: all 0.15s ease; ${chatMode === 'individual' ? 'background: #00796B; color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1);' : 'background: transparent; color: #64748b;'}"
                    ${!hasFaculty ? 'disabled title="No supervisor assigned to this project"' : ''}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <span>Direct with Supervisor</span>
                  </button>

                  <button 
                    type="button" 
                    id="tab-mode-group" 
                    class="btn-chat-tab ${chatMode === 'group' ? 'active' : ''}" 
                    style="display: flex; align-items: center; gap: 5px; padding: 6px 14px; font-size: 0.82rem; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; transition: all 0.15s ease; ${chatMode === 'group' ? 'background: #00796B; color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1);' : 'background: transparent; color: #64748b;'}"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    <span>Project Team Group</span>
                  </button>
                </div>
              </div>

              <!-- Message Stream -->
              <div class="student-comm-body" id="chat-body">
                <div class="student-comm-date-pill">
                  ${chatMode === 'individual' ? '1-on-1 Supervisor Thread' : 'Project Group Thread'}
                </div>
                ${isLoadingLive ? `
                  <div style="text-align:center; padding: 40px; color: var(--text-muted);">
                    <div class="spinner" style="border-top-color: #00796B; margin: 0 auto 10px; width: 28px; height: 28px;"></div>
                    <div style="font-size: 0.85rem;">Loading messages...</div>
                  </div>
                ` : messagesHtml}
              </div>

              <!-- Quick Prompt Suggestions -->
              <div class="student-comm-quick-prompts">
                <button type="button" class="student-comm-prompt-chip" data-prompt="__WORKLOG__" style="font-size:0.78rem; font-weight:600;">
                  📋 Insert Timesheet Summary
                </button>
                <button type="button" class="student-comm-prompt-chip" data-prompt="Hi Professor, I have pushed my latest updates to GitHub. Could you please review?" style="font-size:0.78rem;">
                  🚀 Code Updates Ready
                </button>
                <button type="button" class="student-comm-prompt-chip" data-prompt="Good morning! Please let me know when convenient for a quick sprint sync meeting." style="font-size:0.78rem;">
                  📅 Request Sprint Sync
                </button>
              </div>

              <!-- Attachment Preview Bar (shown when file is chosen) -->
              <div id="chat-attachment-preview-bar" class="student-comm-attachment-preview-bar" style="${currentAttachment ? 'display:flex;' : 'display:none;'}">
                <div class="student-comm-attachment-preview-chip">
                  <span class="student-comm-chip-icon">
                    ${currentAttachment && (currentAttachment.name || '').toLowerCase().endsWith('.pdf') ? '📄' :
                      currentAttachment && ((currentAttachment.name || '').toLowerCase().endsWith('.csv') || (currentAttachment.name || '').toLowerCase().endsWith('.xlsx')) ? '📊' : '📎'}
                  </span>
                  <span class="student-comm-chip-name" style="max-width: 220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    ${currentAttachment ? currentAttachment.name : ''}
                  </span>
                  <span class="student-comm-chip-size" style="color: #00796B; font-size: 0.75rem;">
                    (${currentAttachment ? formatFileSize(currentAttachment.size) : ''})
                  </span>
                  <button type="button" id="btn-remove-attachment" class="student-comm-chip-remove" title="Remove attachment">×</button>
                </div>
              </div>

              <!-- Footer Input -->
              <form id="chat-form" class="student-comm-footer">
                <input type="file" id="chat-file-input" style="display:none;" accept=".pdf,.csv,.xlsx,.xls,.doc,.docx,.txt,.zip,.png,.jpg,.jpeg">
                <button type="button" id="btn-attach-file" class="student-comm-attach-btn" title="Attach downloaded file (PDF, CSV, Timesheet, Docs)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>
                <input 
                  type="text" 
                  id="chat-input" 
                  class="student-comm-input" 
                  placeholder="${chatMode === 'individual' ? `Type a direct message to ${currentProject.faculty || 'Supervisor'}...` : 'Type a message to project team & faculty...'}" 
                  value="${draftMessage}" 
                  autocomplete="off"
                >
                <button type="submit" id="btn-send-message" class="student-comm-send-btn" ${isSending ? 'disabled' : ''}>
                  <span>${isSending ? 'Sending...' : 'Send'}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </form>
            ` : `
              <div style="display:flex; flex-direction: column; align-items:center; justify-content:center; height:100%; color:var(--text-muted); gap: 10px;">
                <div style="font-size: 2.5rem;">📬</div>
                <div style="font-weight: 700; color: var(--text-primary);">Select a Project Chat</div>
                <div style="font-size: 0.85rem;">Choose a project from the left panel to open the conversation.</div>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    bindEventListeners(currentProject);
    bindAttachmentClicks();
    scrollToBottom();
  }

  function bindEventListeners(currentProject) {
    // Mode tabs (Direct vs Group)
    const tabIndividual = container.querySelector('#tab-mode-individual');
    const tabGroup = container.querySelector('#tab-mode-group');

    tabIndividual?.addEventListener('click', () => {
      if (chatMode !== 'individual') {
        chatMode = 'individual';
        loadCurrentChatMessages(true);
      }
    });

    tabGroup?.addEventListener('click', () => {
      if (chatMode !== 'group') {
        chatMode = 'group';
        loadCurrentChatMessages(true);
      }
    });

    // Sidebar project select
    container.querySelectorAll('.student-comm-item').forEach(el => {
      el.addEventListener('click', () => {
        const nextTitle = el.getAttribute('data-project');
        if (nextTitle !== selectedProjectTitle) {
          selectedProjectTitle = nextTitle;
          draftMessage = '';
          currentAttachment = null;
          loadCurrentChatMessages(true);
        }
      });
    });

    // Sidebar search
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

    // File input
    const fileInput = container.querySelector('#chat-file-input');
    const attachBtn = container.querySelector('#btn-attach-file');
    attachBtn?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (file.size > 15 * 1024 * 1024) {
        showStudentWarning('File Too Large', 'Please select a file smaller than 15MB.');
        fileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        currentAttachment = {
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl: reader.result
        };
        render();
        StudentSwal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Attached: ${file.name}`,
          showConfirmButton: false,
          timer: 2000
        });
      };
      reader.readAsDataURL(file);
    });

    // Remove attachment
    const removeAttachBtn = container.querySelector('#btn-remove-attachment');
    removeAttachBtn?.addEventListener('click', () => {
      currentAttachment = null;
      if (fileInput) fileInput.value = '';
      render();
    });

    // Quick prompt chips
    container.querySelectorAll('.student-comm-prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-prompt');
        const input = container.querySelector('#chat-input');

        if (text === '__WORKLOG__') {
          const logs = getWorkLogs() || [];
          const projectLogs = logs.filter(l => l.project === selectedProjectTitle);
          if (projectLogs.length > 0) {
            const totalHours = projectLogs.reduce((sum, l) => sum + parseFloat(l.hours || 0), 0);
            const approvedHours = projectLogs.filter(l => (l.status || '').toLowerCase() === 'approved').reduce((sum, l) => sum + parseFloat(l.hours || 0), 0);
            const recentLogs = [...projectLogs].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 4);
            const entryLines = recentLogs.map(l => {
              const taskPart = l.taskCode ? `[${l.taskCode}] ` : '';
              return `• ${l.date}: ${taskPart}${parseFloat(l.hours || 0).toFixed(1)} hrs - ${l.description || 'Task work'}`;
            }).join('\n');
            const logMsg = `📋 Daily Work Log Summary (${selectedProjectTitle}):\n• Total Logged: ${totalHours.toFixed(1)} hrs (${approvedHours.toFixed(1)} hrs approved)\n${entryLines}\n\nPlease review my logged hours when convenient.`;
            if (input) {
              input.value = logMsg;
              draftMessage = logMsg;
              input.focus();
              StudentSwal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Work log summary loaded!',
                showConfirmButton: false,
                timer: 2000
              });
            }
          } else {
            const defaultMsg = `Hi Professor, I have logged my daily work hours on the portal for ${selectedProjectTitle}. Please review my timesheet when convenient.`;
            if (input) {
              input.value = defaultMsg;
              draftMessage = defaultMsg;
              input.focus();
            }
          }
          return;
        }

        if (input) {
          input.value = text;
          draftMessage = text;
          input.focus();
        }
      });
    });

    // Chat form submit
    const chatForm = container.querySelector('#chat-form');
    chatForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = container.querySelector('#chat-input');
      const text = input ? input.value.trim() : '';

      if (!currentProject) {
        showStudentWarning('No Project Selected', 'Please select a project from the left panel before sending a message.');
        return;
      }

      if (!text && !currentAttachment) {
        showStudentWarning('Empty Message', 'Please type a message or attach a file before sending.');
        return;
      }

      isSending = true;
      const sendBtn = container.querySelector('#btn-send-message');
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span>Sending...</span>';
      }

      try {
        const attachToSend = currentAttachment;
        await sendLiveChatMessage(currentProject.id, text, attachToSend, chatMode);

        draftMessage = '';
        currentAttachment = null;
        if (fileInput) fileInput.value = '';
        if (input) input.value = '';

        // Immediately reload messages for instant feedback
        liveMessages = await fetchLiveChatMessages(currentProject.id, chatMode);
        render();
        scrollToBottom();
      } catch (err) {
        console.error('Error sending message:', err);
        showStudentError('Message Failed', 'Could not send message. Please try again.');
      } finally {
        isSending = false;
        if (sendBtn) sendBtn.disabled = false;
      }
    });
  }

  // Initial load
  await loadCurrentChatMessages(false);

  // Clean up polling if element removed from DOM
  const observer = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      stopPolling();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return container;
}

export default StudentChat;
