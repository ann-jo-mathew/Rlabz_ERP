import '../faculty.css';

export function FacultyNotifications() {
    const container = document.createElement('div');
    container.className = 'faculty-notifications';

    const apiBase = (typeof window !== 'undefined' && window.__API_BASE__) ? window.__API_BASE__ : 'http://localhost:8000/api';
    const token = localStorage.getItem('token');

    let notifications = [];
    let isLoading = true;

    async function loadNotifications() {
        isLoading = true;
        renderLoading();
        try {
            const res = await fetch(`${apiBase}/faculty/notifications`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    notifications = data;
                } else {
                    // Fallback default notifications
                    notifications = [
                        {
                            id: 1,
                            title: 'New Project Assigned',
                            description: 'You have been assigned as the faculty mentor for the project.',
                            time: 'Recently',
                            unread: true,
                            category: 'project'
                        }
                    ];
                }
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            isLoading = false;
            renderNotifications();
        }
    }

    function renderLoading() {
        if (listContainer) {
            listContainer.innerHTML = `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; text-align: center;">
                    <div class="spinner" style="border-top-color: var(--primary, var(--primary)); margin: 0 auto 0.75rem; width: 24px; height: 24px;"></div>
                    <p style="margin: 0; color: #64748b; font-size: 13px;">Loading notifications...</p>
                </div>
            `;
        }
    }

    container.innerHTML = `
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
                <h1>Notifications</h1>
                <p>View alerts and updates on project submissions and student assignments.</p>
            </div>
            <button id="mark-all-read-btn" class="btn-edit" style="font-size: 13px; font-weight: 600;">
                Mark All as Read
            </button>
        </div>

        <div id="notifications-list" style="margin-top: 20px;"></div>
    `;

    const listContainer = container.querySelector('#notifications-list');
    const markAllBtn = container.querySelector('#mark-all-read-btn');

    function renderNotifications() {
        if (notifications.length === 0) {
            listContainer.innerHTML = `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 30px; text-align: center;">
                    <h3 style="margin: 0; color: #64748b; font-size: 15px;">No notifications</h3>
                    <p style="margin: 5px 0 0; color: #94a3b8; font-size: 13px;">You are completely caught up!</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = notifications.map(n => {
            return `
                <div class="notification-card ${n.unread ? 'unread' : ''}" data-id="${n.id}">
                    <div class="notification-card-content">
                        <h4>${n.title}</h4>
                        <p>${n.description}</p>
                        <span class="notification-card-time">${n.time}</span>
                    </div>
                    <div>
                        ${n.unread ? `
                            <button class="btn-edit mark-read-btn" data-id="${n.id}" style="padding: 6px 12px; font-size: 12px;">
                                Mark as Read
                            </button>
                        ` : `
                            <span style="font-size: 12px; color: #94a3b8; font-weight: 600; padding: 6px 12px; display: inline-block;">Read</span>
                        `}
                    </div>
                </div>
            `;
        }).join('');

        // Bind mark single as read button click
        container.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                const matched = notifications.find(n => n.id === id);
                if (matched) {
                    matched.unread = false;
                    renderNotifications();
                    // Update badge count in global layout
                    updateLayoutBadge();
                }
            });
        });
    }

    // Mark all as read click
    markAllBtn.addEventListener('click', () => {
        notifications.forEach(n => n.unread = false);
        renderNotifications();
        updateLayoutBadge();
    });

    // Helper to clear bell icon badge in dashboard if they read all here
    function updateLayoutBadge() {
        const badge = document.querySelector('.noti-badge');
        if (badge) {
            const unreadCount = notifications.filter(n => n.unread).length;
            if (unreadCount === 0) {
                badge.style.display = 'none';
            } else {
                badge.textContent = unreadCount;
                badge.style.display = 'block';
            }
        }
    }

    // Initial render and load
    loadNotifications();

    return container;
}

export default FacultyNotifications;
