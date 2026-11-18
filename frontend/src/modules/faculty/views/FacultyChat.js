import { API_BASE, STORAGE_BASE } from '@/core/config/api.js';
import { authStore } from '@/core/stores/auth.js';

export function FacultyChat(route, router) {
    const container = document.createElement('div');
    container.className = 'faculty-chat-container animate-fade-in';
    container.style.padding = '1.5rem 2rem';
    container.style.maxWidth = '1400px';
    container.style.margin = '0 auto';

    // State
    let currentView = 'project-list'; // 'project-list' | 'project-hub' | 'group-chat' | 'student-list' | 'individual-chat'
    let assignedProjects = [];
    let isLoadingProjects = true;
    let searchQuery = '';

    let selectedProject = null;
    let projectStudents = [];
    let isLoadingStudents = false;
    let studentSearchQuery = '';

    let selectedStudent = null;
    let chatMessages = [];
    let isLoadingMessages = false;
    let draftText = '';
    let selectedFile = null;
    let isSending = false;
    let pollInterval = null;

    const token = authStore.token || localStorage.getItem('token') || '';
    const storedUser = authStore.user || JSON.parse(localStorage.getItem('user') || '{}');

    function getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    function formatTime(timeStr) {
        if (!timeStr) return '';
        try {
            const d = new Date(timeStr);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch (e) {
            return timeStr;
        }
    }

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

    function startPolling(fetchFn) {
        stopPolling();
        pollInterval = setInterval(fetchFn, 4000);
    }

    // =========================================================================
    // 1. DATA LOADERS
    // =========================================================================
    async function loadProjects() {
        isLoadingProjects = true;
        render();

        try {
            const queryParam = storedUser?.email ? `?email=${encodeURIComponent(storedUser.email)}` : '';
            const res = await fetch(`${API_BASE}/faculty/projects${queryParam}`, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                assignedProjects = Array.isArray(data) ? data : [];
            } else {
                assignedProjects = [];
            }
        } catch (err) {
            console.error('Failed to load faculty projects for chat:', err);
            assignedProjects = [];
        } finally {
            isLoadingProjects = false;
            render();
        }
    }

    async function loadGroupChat(projectId, isBackgroundPoll = false) {
        if (!isBackgroundPoll) {
            isLoadingMessages = true;
            render();
        }

        try {
            const res = await fetch(`${API_BASE}/faculty/chat/projects/${projectId}/group`, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                chatMessages = data.messages || [];
                if (!isBackgroundPoll) {
                    scrollToBottom();
                }
            }
        } catch (err) {
            console.error('Failed to load group chat:', err);
        } finally {
            if (!isBackgroundPoll) {
                isLoadingMessages = false;
                render();
                scrollToBottom();
            } else {
                updateMessageFeedDom();
            }
        }
    }

    async function loadProjectStudents(projectId) {
        isLoadingStudents = true;
        render();

        try {
            const res = await fetch(`${API_BASE}/faculty/chat/projects/${projectId}/students`, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                projectStudents = data.students || [];
            } else {
                projectStudents = [];
            }
        } catch (err) {
            console.error('Failed to load project students:', err);
            projectStudents = [];
        } finally {
            isLoadingStudents = false;
            render();
        }
    }

    async function loadIndividualChat(projectId, studentId, isBackgroundPoll = false) {
        if (!isBackgroundPoll) {
            isLoadingMessages = true;
            render();
        }

        try {
            const res = await fetch(`${API_BASE}/faculty/chat/projects/${projectId}/individual/${studentId}`, { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                chatMessages = data.messages || [];
                if (!isBackgroundPoll) {
                    scrollToBottom();
                }
            }
        } catch (err) {
            console.error('Failed to load individual chat:', err);
        } finally {
            if (!isBackgroundPoll) {
                isLoadingMessages = false;
                render();
                scrollToBottom();
            } else {
                updateMessageFeedDom();
            }
        }
    }

    async function sendGroupMessage() {
        const text = draftText.trim();
        if (!text && !selectedFile) return;

        isSending = true;
        updateSendButtonState();

        try {
            let res;
            if (selectedFile) {
                const formData = new FormData();
                formData.append('text', text);
                formData.append('file', selectedFile);

                res = await fetch(`${API_BASE}/faculty/chat/projects/${selectedProject.id}/group/messages`, {
                    method: 'POST',
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                    body: formData
                });
            } else {
                res = await fetch(`${API_BASE}/faculty/chat/projects/${selectedProject.id}/group/messages`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ text })
                });
            }

            if (res.ok) {
                draftText = '';
                selectedFile = null;
                await loadGroupChat(selectedProject.id, true);
                render();
                scrollToBottom();
            }
        } catch (err) {
            console.error('Error sending group message:', err);
        } finally {
            isSending = false;
            updateSendButtonState();
        }
    }

    async function sendIndividualMessage() {
        const text = draftText.trim();
        if (!text && !selectedFile) return;

        isSending = true;
        updateSendButtonState();

        try {
            let res;
            if (selectedFile) {
                const formData = new FormData();
                formData.append('text', text);
                formData.append('file', selectedFile);

                res = await fetch(`${API_BASE}/faculty/chat/projects/${selectedProject.id}/individual/${selectedStudent.id}/messages`, {
                    method: 'POST',
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                    body: formData
                });
            } else {
                res = await fetch(`${API_BASE}/faculty/chat/projects/${selectedProject.id}/individual/${selectedStudent.id}/messages`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ text })
                });
            }

            if (res.ok) {
                draftText = '';
                selectedFile = null;
                await loadIndividualChat(selectedProject.id, selectedStudent.id, true);
                render();
                scrollToBottom();
            }
        } catch (err) {
            console.error('Error sending individual message:', err);
        } finally {
            isSending = false;
            updateSendButtonState();
        }
    }

    function scrollToBottom() {
        setTimeout(() => {
            const feed = container.querySelector('#chat-messages-feed');
            if (feed) {
                feed.scrollTop = feed.scrollHeight;
            }
        }, 50);
    }

    function updateSendButtonState() {
        const btn = container.querySelector('#btn-send-chat-msg');
        if (btn) {
            btn.disabled = isSending;
            btn.innerHTML = isSending ? '<span>Sending...</span>' : `<span>Send</span> <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
        }
    }

    function updateMessageFeedDom() {
        const feed = container.querySelector('#chat-messages-feed');
        if (!feed) return;
        const wasNearBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 120;
        feed.innerHTML = renderMessagesHtml();
        if (wasNearBottom) {
            feed.scrollTop = feed.scrollHeight;
        }
    }

    // =========================================================================
    // 2. VIEW RENDERERS
    // =========================================================================

    function render() {
        if (currentView === 'project-list') {
            stopPolling();
            renderProjectsView();
        } else if (currentView === 'project-hub') {
            stopPolling();
            renderProjectHubView();
        } else if (currentView === 'group-chat') {
            renderGroupChatView();
        } else if (currentView === 'student-list') {
            stopPolling();
            renderStudentListView();
        } else if (currentView === 'individual-chat') {
            renderIndividualChatView();
        }
    }

    // --- VIEW 1: PROJECTS LIST (Same as in My Projects Section) ---
    function renderProjectsView() {
        const query = searchQuery.trim().toLowerCase();
        const filteredProjects = query
            ? assignedProjects.filter(p => (p.title || p.name || '').toLowerCase().includes(query) || (p.client_name || '').toLowerCase().includes(query))
            : assignedProjects;

        container.innerHTML = `
            <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <h1 style="font-size: 1.65rem; font-weight: 800; color: var(--text-main, #0f172a); margin: 0 0 0.35rem;">Project Chats</h1>
                    <p style="color: var(--text-muted, #64748b); font-size: 0.95rem; margin: 0;">Select a project to initiate group collaboration or 1-on-1 private messaging with students.</p>
                </div>
                <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                    <div style="position: relative; width: 340px; max-width: 100%;">
                        <input 
                            type="text" 
                            id="input-search-chat-projects" 
                            class="premium-input" 
                            placeholder="Search project by name or client..." 
                            value="${searchQuery}" 
                            style="width: 100%; padding-left: 2.25rem; font-size: 0.88rem; height: 42px; border-radius: 8px; border: 1px solid var(--border-color, #cbd5e1); background: var(--surface-card, #fff);"
                        />
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 14px; color: var(--text-secondary, #94a3b8);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                </div>
            </div>

            <!-- Projects Table Panel -->
            <div class="faculty-card-panel" style="padding: 0; overflow-x: auto; border: 1px solid var(--border-color, var(--border-subtle)); border-radius: 12px; background: var(--surface-card, #fff); box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                ${isLoadingProjects ? `
                    <div style="padding: 4rem 2rem; text-align: center; color: var(--text-muted, #64748b);">
                        <div class="spinner" style="border-top-color: var(--primary, #0d9488); margin: 0 auto 1rem; width: 32px; height: 32px;"></div>
                        <p style="margin: 0; font-size: 0.95rem;">Loading assigned projects...</p>
                    </div>
                ` : filteredProjects.length === 0 ? `
                    <div style="padding: 3.5rem 2rem; text-align: center; color: var(--text-muted, #64748b);">
                        <p style="margin: 0; font-size: 1rem;">${query ? `No projects found matching "${searchQuery}".` : 'No projects currently assigned to you.'}</p>
                    </div>
                ` : `
                    <table class="premium-table" style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background: var(--bg-main, #f8fafc); border-bottom: 2px solid var(--border-color, #e2e8f0);">
                                <th style="padding: 1.1rem 1.5rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 35%;">Project Title</th>
                                <th style="padding: 1.1rem 1.5rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 25%;">Client Name</th>
                                <th style="padding: 1.1rem 1.5rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 15%;">Type</th>
                                <th style="padding: 1.1rem 1.5rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 12%;">Status</th>
                                <th style="padding: 1.1rem 1.5rem; font-size: 0.82rem; font-weight: 700; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; width: 13%; text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredProjects.map(p => {
                                const title = p.title || p.name || 'Untitled Project';
                                const client = p.client_name || 'Rajagiri College';
                                const type = p.project_type || 'Web App';
                                const status = (p.status || 'in_progress').toLowerCase();

                                return `
                                    <tr class="project-chat-row" data-id="${p.id}" style="border-bottom: 1px solid var(--border-color, #f1f5f9); cursor: pointer; transition: background 0.15s ease;">
                                        <td style="padding: 1.15rem 1.5rem;">
                                            <div style="font-weight: 700; color: var(--text-main, #0f172a); font-size: 0.96rem;">
                                                ${title}
                                            </div>
                                        </td>
                                        <td style="padding: 1.15rem 1.5rem; font-size: 0.92rem; color: var(--text-main, #334155);">
                                            ${client}
                                        </td>
                                        <td style="padding: 1.15rem 1.5rem; font-size: 0.9rem; color: var(--text-muted, #64748b);">
                                            ${type}
                                        </td>
                                        <td style="padding: 1.15rem 1.5rem;">
                                            <span style="display: inline-block; padding: 3px 9px; border-radius: 9999px; font-size: 0.74rem; font-weight: 700; text-transform: uppercase; background: ${status === 'completed' ? '#f0fdf4' : '#eff6ff'}; color: ${status === 'completed' ? '#166534' : '#1d4ed8'}; border: 1px solid ${status === 'completed' ? '#bbf7d0' : '#bfdbfe'};">
                                                ${status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style="padding: 1.15rem 1.5rem; text-align: right;">
                                            <button class="btn btn-sm btn-primary shadow-hover btn-open-project-hub" data-id="${p.id}" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.9rem; font-size: 0.82rem; font-weight: 600; border-radius: 6px;">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                                <span>Open Chat</span>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `}
            </div>
            <style>
                .project-chat-row:hover {
                    background: var(--bg-surface, #f8fafc) !important;
                }
            </style>
        `;

        setupProjectsViewListeners();
    }

    function setupProjectsViewListeners() {
        const searchInput = container.querySelector('#input-search-chat-projects');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                const tbody = container.querySelector('tbody');
                if (tbody) {
                    renderProjectsView();
                }
            });
        }

        container.querySelectorAll('.project-chat-row, .btn-open-project-hub').forEach(el => {
            el.addEventListener('click', (e) => {
                const target = e.target.closest('.project-chat-row') || e.target.closest('.btn-open-project-hub');
                const pId = parseInt(target.getAttribute('data-id'));
                const proj = assignedProjects.find(p => p.id === pId);
                if (proj) {
                    selectedProject = proj;
                    currentView = 'project-hub';
                    render();
                }
            });
        });
    }

    // --- VIEW 2: PROJECT CHAT HUB (Choose Group Chat vs Individual Chat) ---
    function renderProjectHubView() {
        const title = selectedProject.title || selectedProject.name || 'Project';
        const client = selectedProject.client_name || 'Rajagiri College';

        container.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <button class="btn btn-sm btn-outline" id="btn-back-to-projects" style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.84rem; padding: 0.35rem 0.75rem; border-radius: 6px; margin-bottom: 1rem; color: var(--text-muted); border-color: var(--border-color);">
                    ← Back to Projects List
                </button>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                    <div>
                        <h1 style="font-size: 1.6rem; font-weight: 800; color: var(--text-main, #0f172a); margin: 0 0 0.3rem;">${title}</h1>
                        <p style="color: var(--text-muted, #64748b); font-size: 0.92rem; margin: 0;">Client: <strong>${client}</strong> &bull; Select a communication mode below:</p>
                    </div>
                </div>
            </div>

            <!-- Two Interactive Cards: Group Chat vs Individual Chat -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
                <!-- Group Chat Card -->
                <div class="chat-hub-card" id="card-group-chat" style="background: var(--surface-card, #fff); border: 2px solid var(--border-color, #e2e8f0); border-radius: 14px; padding: 2rem; cursor: pointer; transition: all 0.2s ease; position: relative; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
                            <div style="width: 52px; height: 52px; border-radius: 12px; background: #dbeafe; color: #1d4ed8; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                👥
                            </div>
                            <span style="display: inline-flex; align-items: center; gap: 0.3rem; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;">
                                Delivered to All Students
                            </span>
                        </div>
                        <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--text-main, #0f172a); margin: 0 0 0.5rem;">Group Chat</h3>
                        <p style="color: var(--text-muted, #64748b); font-size: 0.92rem; line-height: 1.5; margin: 0 0 1.5rem;">
                            Collaborate with the entire project team. Messages sent here are instantly visible to all assigned students and supervisors in this project.
                        </p>
                    </div>
                    <button class="btn btn-outline" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.75rem 1rem; font-size: 0.92rem; font-weight: 700; border-radius: 8px; color: #2563eb; border-color: #bfdbfe; background: #f8fafc;">
                        <span>Open Group Chat</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </button>
                </div>

                <!-- Individual Chat Card -->
                <div class="chat-hub-card" id="card-individual-chat" style="background: var(--surface-card, #fff); border: 2px solid var(--border-color, #e2e8f0); border-radius: 14px; padding: 2rem; cursor: pointer; transition: all 0.2s ease; position: relative; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
                            <div style="width: 52px; height: 52px; border-radius: 12px; background: #dbeafe; color: #1d4ed8; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                👤
                            </div>
                            <span style="display: inline-flex; align-items: center; gap: 0.3rem; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;">
                                1-on-1 Direct Messaging
                            </span>
                        </div>
                        <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--text-main, #0f172a); margin: 0 0 0.5rem;">Individual Chat</h3>
                        <p style="color: var(--text-muted, #64748b); font-size: 0.92rem; line-height: 1.5; margin: 0 0 1.5rem;">
                            View the list of students assigned to this project and select a specific student for a private, confidential one-on-one discussion.
                        </p>
                    </div>
                    <button class="btn btn-outline" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.75rem 1rem; font-size: 0.92rem; font-weight: 700; border-radius: 8px; color: #2563eb; border-color: #bfdbfe; background: #f8fafc;">
                        <span>Select Student</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </button>
                </div>
            </div>

            <style>
                .chat-hub-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
                    border-color: var(--primary, #0d9488) !important;
                }
            </style>
        `;

        setupProjectHubListeners();
    }

    function setupProjectHubListeners() {
        const backBtn = container.querySelector('#btn-back-to-projects');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                currentView = 'project-list';
                render();
            });
        }

        const groupCard = container.querySelector('#card-group-chat');
        if (groupCard) {
            groupCard.addEventListener('click', () => {
                currentView = 'group-chat';
                loadGroupChat(selectedProject.id);
                startPolling(() => loadGroupChat(selectedProject.id, true));
            });
        }

        const individualCard = container.querySelector('#card-individual-chat');
        if (individualCard) {
            individualCard.addEventListener('click', () => {
                currentView = 'student-list';
                loadProjectStudents(selectedProject.id);
            });
        }
    }

    // --- VIEW 3: GROUP CHAT VIEW (Delivered to all students in project) ---
    function renderGroupChatView() {
        const title = selectedProject.title || selectedProject.name || 'Project';

        container.innerHTML = `
            <div style="background: var(--surface-card, #fff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; height: 80vh; min-height: 600px;">
                
                <!-- Chat Header -->
                <div style="padding: 1rem 1.5rem; background: var(--bg-main, #f8fafc); border-bottom: 1px solid var(--border-color, #e2e8f0); display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <button class="btn btn-sm btn-outline" id="btn-back-to-hub" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; border-radius: 6px; color: var(--text-muted);">
                            ← Back
                        </button>
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.45rem;">
                                <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main, #0f172a); margin: 0;">${title}</h2>
                                <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: #ccfbf1; color: #0f766e;">GROUP CHAT</span>
                            </div>
                            <div style="font-size: 0.8rem; color: #166534; margin-top: 2px; display: flex; align-items: center; gap: 0.35rem;">
                                <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #22c55e;"></span>
                                <span>Delivered to all students in this project</span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <button class="btn btn-sm btn-outline" id="btn-refresh-chat" title="Refresh messages" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; border-radius: 6px;">
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                <!-- Messages Feed -->
                <div id="chat-messages-feed" style="flex: 1; padding: 1.25rem 1.5rem; overflow-y: auto; background: var(--bg-canvas-light, #fafafa); display: flex; flex-direction: column; gap: 0.85rem;">
                    ${isLoadingMessages ? `
                        <div style="margin: auto; text-align: center; color: var(--text-muted);">
                            <div class="spinner" style="margin: 0 auto 0.75rem; width: 28px; height: 28px;"></div>
                            <p style="font-size: 0.9rem; margin: 0;">Loading messages...</p>
                        </div>
                    ` : renderMessagesHtml()}
                </div>

                <!-- Attachment Preview Banner -->
                ${selectedFile ? `
                    <div id="attachment-preview-bar" style="padding: 0.5rem 1.5rem; background: #eff6ff; border-top: 1px solid #bfdbfe; display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; color: #1e40af;">
                        <div style="display: flex; align-items: center; gap: 0.4rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <span>📎</span>
                            <strong>${selectedFile.name}</strong>
                            <span>(${formatFileSize(selectedFile.size)})</span>
                        </div>
                        <button id="btn-remove-file" style="background: none; border: none; color: #dc2626; font-size: 1.1rem; cursor: pointer; padding: 0 4px;">&times;</button>
                    </div>
                ` : ''}

                <!-- Message Input Bar -->
                <div style="padding: 1rem 1.5rem; background: var(--surface-card, #fff); border-top: 1px solid var(--border-color, #e2e8f0);">
                    <form id="chat-form" style="display: flex; gap: 0.75rem; align-items: center;">
                        <input type="file" id="chat-file-input" style="display: none;" />
                        <button type="button" id="btn-attach-file" class="btn btn-outline" title="Attach file" style="flex-shrink: 0; padding: 0.6rem 0.8rem; border-radius: 8px; color: var(--text-secondary); border-color: var(--border-color);">
                            📎
                        </button>
                        <input 
                            type="text" 
                            id="input-chat-message" 
                            placeholder="Type a message to all students in ${title}..." 
                            value="${draftText}" 
                            autocomplete="off"
                            style="flex: 1; min-width: 0; height: 44px; padding: 0 1rem; border-radius: 8px; border: 1px solid var(--border-color, #cbd5e1); font-size: 0.92rem; outline: none; background: var(--bg-canvas-light, #f8fafc);" 
                        />
                        <button type="submit" id="btn-send-chat-msg" class="btn btn-primary btn-sm" style="flex: 0 0 auto !important; width: auto !important; height: 44px; padding: 0 1.5rem !important; border-radius: 8px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; white-space: nowrap;">
                            <span>Send</span>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </form>
                </div>
            </div>
        `;

        setupChatViewListeners(sendGroupMessage, () => loadGroupChat(selectedProject.id));
    }

    // --- VIEW 4: STUDENT LIST FOR INDIVIDUAL CHAT ---
    function renderStudentListView() {
        const title = selectedProject.title || selectedProject.name || 'Project';
        const query = studentSearchQuery.trim().toLowerCase();
        const filteredStudents = query
            ? projectStudents.filter(s => (s.name || '').toLowerCase().includes(query) || (s.email || '').toLowerCase().includes(query) || (s.role || '').toLowerCase().includes(query))
            : projectStudents;

        container.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <button class="btn btn-sm btn-outline" id="btn-back-to-hub" style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.84rem; padding: 0.35rem 0.75rem; border-radius: 6px; margin-bottom: 1rem; color: var(--text-muted); border-color: var(--border-color);">
                    ← Back to Project Hub
                </button>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h1 style="font-size: 1.6rem; font-weight: 800; color: var(--text-main, #0f172a); margin: 0 0 0.3rem;">Individual Student Chat</h1>
                        <p style="color: var(--text-muted, #64748b); font-size: 0.92rem; margin: 0;">Project: <strong>${title}</strong> &bull; Select a student to start private 1-on-1 messaging:</p>
                    </div>
                    <div style="position: relative; width: 300px; max-width: 100%;">
                        <input 
                            type="text" 
                            id="input-search-students" 
                            class="premium-input" 
                            placeholder="Filter student by name or role..." 
                            value="${studentSearchQuery}" 
                            style="width: 100%; padding-left: 2.25rem; font-size: 0.88rem; height: 40px; border-radius: 8px; border: 1px solid var(--border-color, #cbd5e1); background: var(--surface-card, #fff);"
                        />
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position: absolute; left: 12px; top: 13px; color: var(--text-secondary);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                </div>
            </div>

            <!-- Students List / Grid -->
            <div style="background: var(--surface-card, #fff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                ${isLoadingStudents ? `
                    <div style="padding: 4rem 2rem; text-align: center; color: var(--text-muted);">
                        <div class="spinner" style="border-top-color: var(--primary); margin: 0 auto 1rem; width: 32px; height: 32px;"></div>
                        <p style="margin: 0; font-size: 0.95rem;">Loading students in project...</p>
                    </div>
                ` : filteredStudents.length === 0 ? `
                    <div style="padding: 3.5rem 2rem; text-align: center; color: var(--text-muted);">
                        <p style="margin: 0; font-size: 0.95rem;">${query ? `No students found matching "${studentSearchQuery}".` : 'No students currently assigned to this project.'}</p>
                    </div>
                ` : `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; padding: 1.5rem;">
                        ${filteredStudents.map(s => {
                            const initial = (s.name || 'S').charAt(0).toUpperCase();
                            const lastMsg = s.last_message;

                            return `
                                <div class="student-chat-select-card" data-student-id="${s.id}" style="border: 1px solid var(--border-color, #e2e8f0); border-radius: 10px; padding: 1.15rem; background: var(--bg-surface, #fff); cursor: pointer; transition: all 0.15s ease; display: flex; flex-direction: column; justify-content: space-between;">
                                    <div>
                                        <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0.75rem;">
                                            <div style="width: 44px; height: 44px; border-radius: 50%; background: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #bae6fd;">
                                                ${initial}
                                            </div>
                                            <div style="overflow: hidden;">
                                                <div style="font-weight: 700; color: var(--text-main, #0f172a); font-size: 0.96rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                    ${s.name}
                                                </div>
                                                <div style="font-size: 0.8rem; color: var(--text-muted, #64748b); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                    ${s.email}
                                                </div>
                                            </div>
                                        </div>
                                        <div style="margin-bottom: 0.85rem;">
                                            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.74rem; font-weight: 700; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; text-transform: uppercase;">
                                                ${s.role}
                                            </span>
                                        </div>
                                        ${lastMsg ? `
                                            <div style="font-size: 0.8rem; color: var(--text-secondary, #64748b); background: #f8fafc; padding: 0.45rem 0.65rem; border-radius: 6px; border: 1px solid #f1f5f9; margin-bottom: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                                <strong>${lastMsg.is_me ? 'You: ' : ''}</strong>${lastMsg.text}
                                            </div>
                                        ` : `
                                            <div style="font-size: 0.78rem; color: #94a3b8; font-style: italic; margin-bottom: 0.85rem;">
                                                No previous 1-on-1 messages yet.
                                            </div>
                                        `}
                                    </div>
                                    <button class="btn btn-sm btn-primary shadow-hover btn-start-individual-chat" data-student-id="${s.id}" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.35rem; padding: 0.45rem 0.75rem; font-size: 0.82rem; font-weight: 600; border-radius: 6px;">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                        <span>Chat with ${s.name.split(' ')[0]}</span>
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
            <style>
                .student-chat-select-card:hover {
                    border-color: #2563eb !important;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08);
                }
            </style>
        `;

        setupStudentListViewListeners();
    }

    function setupStudentListViewListeners() {
        const backBtn = container.querySelector('#btn-back-to-hub');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                currentView = 'project-hub';
                render();
            });
        }

        const searchInput = container.querySelector('#input-search-students');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                studentSearchQuery = e.target.value;
                renderStudentListView();
            });
        }

        container.querySelectorAll('.student-chat-select-card, .btn-start-individual-chat').forEach(el => {
            el.addEventListener('click', (e) => {
                const target = e.target.closest('.student-chat-select-card') || e.target.closest('.btn-start-individual-chat');
                const sId = parseInt(target.getAttribute('data-student-id'));
                const student = projectStudents.find(s => s.id === sId);
                if (student) {
                    selectedStudent = student;
                    currentView = 'individual-chat';
                    loadIndividualChat(selectedProject.id, student.id);
                    startPolling(() => loadIndividualChat(selectedProject.id, student.id, true));
                }
            });
        });
    }

    // --- VIEW 5: INDIVIDUAL CHAT VIEW (Private 1-on-1 Faculty <-> Student) ---
    function renderIndividualChatView() {
        const title = selectedProject.title || selectedProject.name || 'Project';
        const sName = selectedStudent.name || 'Student';
        const sRole = selectedStudent.role || 'Team Member';
        const initial = sName.charAt(0).toUpperCase();

        container.innerHTML = `
            <div style="background: var(--surface-card, #fff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; height: 80vh; min-height: 600px;">
                
                <!-- Chat Header -->
                <div style="padding: 1rem 1.5rem; background: var(--bg-main, #f8fafc); border-bottom: 1px solid var(--border-color, #e2e8f0); display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 0.85rem;">
                        <button class="btn btn-sm btn-outline" id="btn-back-to-students" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; border-radius: 6px; color: var(--text-muted);">
                            ← Students List
                        </button>
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: #dbeafe; color: #1e40af; font-weight: 700; font-size: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #bfdbfe;">
                            ${initial}
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.45rem;">
                                <h2 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main, #0f172a); margin: 0;">${sName}</h2>
                                <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: #e0f2fe; color: #0284c7;">${sRole}</span>
                            </div>
                            <div style="font-size: 0.78rem; color: var(--text-muted, #64748b); margin-top: 2px;">
                                Project: <strong>${title}</strong> &bull; 1-on-1 Private Direct Chat
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <button class="btn btn-sm btn-outline" id="btn-refresh-chat" title="Refresh messages" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; border-radius: 6px;">
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                <!-- Messages Feed -->
                <div id="chat-messages-feed" style="flex: 1; padding: 1.25rem 1.5rem; overflow-y: auto; background: var(--bg-canvas-light, #fafafa); display: flex; flex-direction: column; gap: 0.85rem;">
                    ${isLoadingMessages ? `
                        <div style="margin: auto; text-align: center; color: var(--text-muted);">
                            <div class="spinner" style="margin: 0 auto 0.75rem; width: 28px; height: 28px;"></div>
                            <p style="font-size: 0.9rem; margin: 0;">Loading private conversation...</p>
                        </div>
                    ` : renderMessagesHtml()}
                </div>

                <!-- Attachment Preview Banner -->
                ${selectedFile ? `
                    <div id="attachment-preview-bar" style="padding: 0.5rem 1.5rem; background: #eff6ff; border-top: 1px solid #bfdbfe; display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; color: #1e40af;">
                        <div style="display: flex; align-items: center; gap: 0.4rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <span>📎</span>
                            <strong>${selectedFile.name}</strong>
                            <span>(${formatFileSize(selectedFile.size)})</span>
                        </div>
                        <button id="btn-remove-file" style="background: none; border: none; color: #dc2626; font-size: 1.1rem; cursor: pointer; padding: 0 4px;">&times;</button>
                    </div>
                ` : ''}

                <!-- Message Input Bar -->
                <div style="padding: 1rem 1.5rem; background: var(--surface-card, #fff); border-top: 1px solid var(--border-color, #e2e8f0);">
                    <form id="chat-form" style="display: flex; gap: 0.75rem; align-items: center;">
                        <input type="file" id="chat-file-input" style="display: none;" />
                        <button type="button" id="btn-attach-file" class="btn btn-outline" title="Attach file" style="flex-shrink: 0; padding: 0.6rem 0.8rem; border-radius: 8px; color: var(--text-secondary); border-color: var(--border-color);">
                            📎
                        </button>
                        <input 
                            type="text" 
                            id="input-chat-message" 
                            placeholder="Message ${sName} privately..." 
                            value="${draftText}" 
                            autocomplete="off"
                            style="flex: 1; min-width: 0; height: 44px; padding: 0 1rem; border-radius: 8px; border: 1px solid var(--border-color, #cbd5e1); font-size: 0.92rem; outline: none; background: var(--bg-canvas-light, #f8fafc);" 
                        />
                        <button type="submit" id="btn-send-chat-msg" class="btn btn-primary btn-sm" style="flex: 0 0 auto !important; width: auto !important; height: 44px; padding: 0 1.5rem !important; border-radius: 8px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; white-space: nowrap;">
                            <span>Send</span>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </form>
                </div>
            </div>
        `;

        setupChatViewListeners(sendIndividualMessage, () => loadIndividualChat(selectedProject.id, selectedStudent.id));
    }

    // --- REUSABLE MESSAGE FEED BUILDER ---
    function renderMessagesHtml() {
        if (!chatMessages || chatMessages.length === 0) {
            return `
                <div style="margin: auto; text-align: center; color: var(--text-muted); padding: 2.5rem 1rem;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">💬</div>
                    <p style="font-size: 0.95rem; margin: 0; font-weight: 600;">No messages in this chat yet.</p>
                    <p style="font-size: 0.82rem; margin: 4px 0 0; color: #94a3b8;">Send the first message to start the conversation!</p>
                </div>
            `;
        }

        return chatMessages.map(m => {
            const isMe = Boolean(m.isMe || m.sender === 'faculty');
            const timeStr = formatTime(m.time);
            const senderLabel = isMe ? 'You (Faculty)' : (m.senderName || 'Student');
            const attach = m.attachment;

            return `
                <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'}; width: 100%;">
                    <div style="font-size: 0.74rem; font-weight: 600; color: var(--text-muted, #64748b); margin-bottom: 3px; display: flex; align-items: center; gap: 0.35rem;">
                        <span>${senderLabel}</span>
                        ${!isMe && m.senderRole ? `<span style="font-size: 0.68rem; padding: 1px 5px; border-radius: 3px; background: #e2e8f0; color: #475569;">${m.senderRole}</span>` : ''}
                    </div>

                    <div style="max-width: 72%; padding: 0.75rem 1rem; border-radius: ${isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px'}; background: ${isMe ? 'var(--primary, #0d9488)' : '#ffffff'}; color: ${isMe ? '#ffffff' : 'var(--text-main, #0f172a)'}; box-shadow: 0 1px 3px rgba(0,0,0,0.06); border: ${isMe ? 'none' : '1px solid #e2e8f0'}; word-break: break-word; font-size: 0.92rem; line-height: 1.45;">
                        ${m.text ? `<div style="white-space: pre-wrap;">${escapeHtml(m.text)}</div>` : ''}
                        
                        ${attach ? `
                            <div style="margin-top: ${m.text ? '0.5rem' : '0'}; padding: 0.5rem 0.75rem; border-radius: 6px; background: ${isMe ? 'rgba(255,255,255,0.15)' : '#f8fafc'}; border: 1px solid ${isMe ? 'rgba(255,255,255,0.3)' : '#e2e8f0'}; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                                <div style="display: flex; align-items: center; gap: 0.4rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.82rem;">
                                    <span>📎</span>
                                    <span style="font-weight: 600;">${attach.name || 'Attachment'}</span>
                                    <span style="opacity: 0.8; font-size: 0.75rem;">(${formatFileSize(attach.size)})</span>
                                </div>
                                ${attach.url ? `
                                    <a href="${attach.url.startsWith('http') ? attach.url : STORAGE_BASE + '/' + attach.url}" target="_blank" rel="noopener noreferrer" style="color: ${isMe ? '#ffffff' : '#2563eb'}; text-decoration: underline; font-size: 0.78rem; font-weight: 700; flex-shrink: 0;">
                                        Download
                                    </a>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>

                    <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">
                        ${timeStr}
                    </div>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- SETUP CHAT VIEW LISTENERS ---
    function setupChatViewListeners(onSendHandler, onRefreshHandler) {
        const backToHubBtn = container.querySelector('#btn-back-to-hub');
        if (backToHubBtn) {
            backToHubBtn.addEventListener('click', () => {
                stopPolling();
                currentView = 'project-hub';
                render();
            });
        }

        const backToStudentsBtn = container.querySelector('#btn-back-to-students');
        if (backToStudentsBtn) {
            backToStudentsBtn.addEventListener('click', () => {
                stopPolling();
                currentView = 'student-list';
                loadProjectStudents(selectedProject.id);
            });
        }

        const refreshBtn = container.querySelector('#btn-refresh-chat');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                onRefreshHandler();
            });
        }

        const chatForm = container.querySelector('#chat-form');
        const msgInput = container.querySelector('#input-chat-message');
        const fileInput = container.querySelector('#chat-file-input');
        const attachBtn = container.querySelector('#btn-attach-file');
        const removeFileBtn = container.querySelector('#btn-remove-file');

        if (msgInput) {
            msgInput.focus();
            msgInput.addEventListener('input', (e) => {
                draftText = e.target.value;
            });
        }

        if (attachBtn && fileInput) {
            attachBtn.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    selectedFile = e.target.files[0];
                    render();
                }
            });
        }

        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', () => {
                selectedFile = null;
                render();
            });
        }

        if (chatForm) {
            chatForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await onSendHandler();
            });
        }
    }

    // Clean up timers on container unmount
    const observer = new MutationObserver(() => {
        if (!document.body.contains(container)) {
            stopPolling();
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial render and data load
    render();
    loadProjects();

    return container;
}

export default FacultyChat;
