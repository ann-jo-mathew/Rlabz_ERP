import { API_BASE } from '@/core/config/api.js';
import { useAuthStore } from '@/core/stores/auth.js';
import Swal from 'sweetalert2';
import '../admin.css';

export function AdminUsers(route, router) {
  const container = document.createElement('div');
  container.className = 'admin-container animate-fade-in';

  const authStore = useAuthStore();
  const getHeaders = () => {
    const token = localStorage.getItem('token') || authStore.token;
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  // State
  let activeTab = 'users'; // 'users' or 'audit'
  let overviewStats = null;
  let usersList = [];
  let pagination = { current_page: 1, last_page: 1, total: 0, per_page: 15 };
  let departments = [];
  let catalog = null;
  let roleDefaults = null;
  let auditLogs = [];
  let auditPagination = { current_page: 1, last_page: 1, total: 0 };

  // Filters & Search
  let searchQuery = '';
  let roleFilter = '';
  let statusFilter = '';
  let departmentFilter = '';
  let sortBy = 'created_at';
  let sortDir = 'desc';

  let auditSearch = '';
  let searchTimer = null;

  // Active Modals state
  let activeModal = null; // 'create' | 'edit' | 'permissions' | 'password' | 'view'
  let selectedUser = null;
  let selectedUserPermissions = [];

  const toast = (title, icon = 'success') => {
    Swal.fire({
      title,
      icon,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  };

  // Fetch overview stats
  async function loadOverview() {
    try {
      const res = await fetch(`${API_BASE}/admin/overview`, { headers: getHeaders() });
      if (res.ok) {
        const body = await res.json();
        overviewStats = body.data;
      }
    } catch (e) {
      console.error('Failed to load admin overview:', e);
    }
  }

  // Fetch catalog of permissions
  async function loadCatalog() {
    try {
      const res = await fetch(`${API_BASE}/admin/permissions-catalog`, { headers: getHeaders() });
      if (res.ok) {
        const body = await res.json();
        catalog = body.catalog;
        roleDefaults = body.role_defaults;
      }
    } catch (e) {
      console.error('Failed to load permissions catalog:', e);
    }
  }

  // Fetch users with current query filters
  async function loadUsers(page = 1) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: pagination.per_page.toString(),
        sort_by: sortBy,
        sort_dir: sortDir,
      });
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (departmentFilter) params.append('department', departmentFilter);

      const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, { headers: getHeaders() });
      if (res.ok) {
        const body = await res.json();
        usersList = body.data || [];
        departments = body.departments || [];
        pagination = body.pagination || pagination;
      }
    } catch (e) {
      console.error('Failed to load users:', e);
      toast('Failed to load users list.', 'error');
    }
    render();
  }

  // Fetch audit logs
  async function loadAuditLogs(page = 1) {
    try {
      const params = new URLSearchParams({ page: page.toString(), per_page: '20' });
      if (auditSearch) params.append('search', auditSearch);

      const res = await fetch(`${API_BASE}/admin/audit-logs?${params.toString()}`, { headers: getHeaders() });
      if (res.ok) {
        const body = await res.json();
        auditLogs = body.data || [];
        auditPagination = body.pagination || auditPagination;
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }
    render();
  }

  // Initial load
  async function init() {
    await Promise.all([loadOverview(), loadCatalog()]);
    await loadUsers(1);
  }

  // HTML Render function
  function render() {
    const stats = overviewStats || {
      total_users: 0,
      active_users: 0,
      suspended_users: 0,
      roles_breakdown: {}
    };

    container.innerHTML = `
      <!-- Header -->
      <div class="admin-header">
        <div>
          <h1>User &amp; Permission Administration</h1>
          <p>Full lifecycle management: provision accounts, assign roles, calibrate per-user permissions, and audit changes.</p>
        </div>
        <div>
          <button class="btn-admin btn-admin-primary" id="btn-open-create-user">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Create New User</span>
          </button>
        </div>
      </div>

      <!-- Stat Cards Strip -->
      <div class="admin-stat-grid">
        <div class="admin-stat-card card-primary">
          <div class="stat-label">Total Users</div>
          <div class="stat-value">${stats.total_users}</div>
          <div class="stat-meta">Enterprise directory accounts</div>
        </div>
        <div class="admin-stat-card card-active">
          <div class="stat-label">Active Users</div>
          <div class="stat-value">${stats.active_users}</div>
          <div class="stat-meta">Operational login access</div>
        </div>
        <div class="admin-stat-card card-suspended">
          <div class="stat-label">Suspended Accounts</div>
          <div class="stat-value">${stats.suspended_users}</div>
          <div class="stat-meta">Tokens and logins blocked</div>
        </div>
        <div class="admin-stat-card card-roles">
          <div class="stat-label">System Roles</div>
          <div class="stat-value">${Object.keys(stats.roles_breakdown || {}).length}</div>
          <div class="stat-meta">From Student to Super Admin</div>
        </div>
      </div>

      <!-- Tab Strip -->
      <div class="admin-tabs">
        <button class="admin-tab-btn ${activeTab === 'users' ? 'active' : ''}" id="tab-btn-users">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span>Users Directory (${pagination.total})</span>
        </button>
        <button class="admin-tab-btn ${activeTab === 'audit' ? 'active' : ''}" id="tab-btn-audit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <span>Administrative Audit Trail</span>
        </button>
      </div>

      <!-- Tab Content: Users Directory -->
      ${activeTab === 'users' ? renderUsersTab() : renderAuditTab()}
    `;

    bindEvents();
    renderModal();
  }

  function renderUsersTab() {
    return `
      <!-- Toolbar -->
      <div class="admin-toolbar">
        <div class="admin-toolbar-left">
          <div class="admin-search-box">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="admin-user-search" placeholder="Search by name, email, department..." value="${escapeHtml(searchQuery)}" />
          </div>

          <select class="admin-select" id="filter-role">
            <option value="">All Roles</option>
            <option value="admin" ${roleFilter === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="director" ${roleFilter === 'director' ? 'selected' : ''}>Director</option>
            <option value="developer" ${roleFilter === 'developer' ? 'selected' : ''}>Developer</option>
            <option value="coordinator" ${roleFilter === 'coordinator' ? 'selected' : ''}>Coordinator</option>
            <option value="finance" ${roleFilter === 'finance' ? 'selected' : ''}>Finance</option>
            <option value="faculty" ${roleFilter === 'faculty' ? 'selected' : ''}>Faculty</option>
            <option value="student" ${roleFilter === 'student' ? 'selected' : ''}>Student</option>
            <option value="design_head" ${roleFilter === 'design_head' ? 'selected' : ''}>Design Head</option>
          </select>

          <select class="admin-select" id="filter-status">
            <option value="">All Statuses</option>
            <option value="active" ${statusFilter === 'active' ? 'selected' : ''}>Active</option>
            <option value="suspended" ${statusFilter === 'suspended' ? 'selected' : ''}>Suspended</option>
          </select>

          <select class="admin-select" id="filter-department">
            <option value="">All Departments</option>
            ${departments.map(d => `<option value="${escapeHtml(d)}" ${departmentFilter === d ? 'selected' : ''}>${escapeHtml(d)}</option>`).join('')}
          </select>

          <select class="admin-select" id="sort-select">
            <option value="created_at:desc" ${sortBy === 'created_at' && sortDir === 'desc' ? 'selected' : ''}>Newest First</option>
            <option value="created_at:asc" ${sortBy === 'created_at' && sortDir === 'asc' ? 'selected' : ''}>Oldest First</option>
            <option value="name:asc" ${sortBy === 'name' && sortDir === 'asc' ? 'selected' : ''}>Name (A-Z)</option>
            <option value="name:desc" ${sortBy === 'name' && sortDir === 'desc' ? 'selected' : ''}>Name (Z-A)</option>
            <option value="role:asc" ${sortBy === 'role' ? 'selected' : ''}>Role</option>
          </select>
        </div>

        <div>
          ${(searchQuery || roleFilter || statusFilter || departmentFilter) ? `
            <button class="btn-admin btn-admin-outline" id="btn-clear-filters" style="font-size: 0.8rem; padding: 0.45rem 0.85rem;">
              <span>Clear Filters</span>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Users Table -->
      <div class="admin-table-card">
        <div class="admin-table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Department</th>
                <th>Permissions</th>
                <th>Created</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${usersList.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 3rem; color: #94a3b8;">
                    No user accounts match your search or filter criteria.
                  </td>
                </tr>
              ` : usersList.map(u => {
                const initials = (u.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                const isCurrentAdmin = authStore.user?.id === u.id;
                return `
                  <tr class="admin-user-row-clickable" data-user-id="${u.id}" style="cursor: pointer; transition: background 0.15s ease;">
                    <td>
                      <div class="admin-user-cell">
                        <div class="admin-avatar">
                          ${u.profile_photo_path ? `<img src="${u.profile_photo_path}" alt="${escapeHtml(u.name)}" />` : initials}
                        </div>
                        <div>
                          <div class="admin-user-name">${escapeHtml(u.name)} ${isCurrentAdmin ? '<span style="font-size:0.7rem; color:#059669; font-weight:700;">(You)</span>' : ''}</div>
                          <div class="admin-user-email">${escapeHtml(u.email)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="admin-badge badge-role-${u.role}">${formatRole(u.role)}</span>
                    </td>
                    <td>
                      <span class="admin-badge badge-status-${u.status}">${u.status === 'suspended' ? '● Suspended' : '✓ Active'}</span>
                    </td>
                    <td>
                      <span style="font-size: 0.85rem; color: #475569;">${escapeHtml(u.department || 'Creative Design & Innovation')}</span>
                    </td>
                    <td>
                      <button class="btn-admin btn-admin-outline btn-manage-perms" data-id="${u.id}" style="font-size: 0.78rem; padding: 3px 10px;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        <span>${u.permissions_count} Active</span>
                      </button>
                    </td>
                    <td style="color: #64748b; font-size: 0.82rem; white-space: nowrap;">
                      ${formatDate(u.created_at)}
                    </td>
                    <td>
                      <div class="admin-action-btns" style="justify-content: flex-end;">
                        <button class="btn-icon-action btn-view-user" data-id="${u.id}" title="View Details">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button class="btn-icon-action btn-edit-user" data-id="${u.id}" title="Edit User Details">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-icon-action btn-password-user" data-id="${u.id}" title="Reset Password / Revoke Tokens">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </button>
                        <button class="btn-icon-action btn-suspend ${u.status === 'suspended' ? 'btn-perm' : ''}" data-id="${u.id}" data-status="${u.status}" title="${u.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}">
                          ${u.status === 'suspended' 
                            ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
                            : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`
                          }
                        </button>
                        ${!isCurrentAdmin ? `
                          <button class="btn-icon-action btn-delete" data-id="${u.id}" data-name="${escapeHtml(u.name)}" title="Delete User">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="admin-pagination">
          <div>
            Showing <strong>${usersList.length}</strong> of <strong>${pagination.total}</strong> accounts
          </div>
          <div class="admin-pagination-btns">
            <button class="btn-page" id="btn-page-prev" ${pagination.current_page <= 1 ? 'disabled' : ''}>Previous</button>
            <span style="padding: 4px 10px; font-weight:700;">Page ${pagination.current_page} / ${pagination.last_page}</span>
            <button class="btn-page" id="btn-page-next" ${pagination.current_page >= pagination.last_page ? 'disabled' : ''}>Next</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderAuditTab() {
    return `
      <!-- Toolbar -->
      <div class="admin-toolbar">
        <div class="admin-toolbar-left">
          <div class="admin-search-box" style="max-width: 450px;">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="admin-audit-search" placeholder="Search audit actions, descriptions, actor name..." value="${escapeHtml(auditSearch)}" />
          </div>
        </div>
        <div>
          <button class="btn-admin btn-admin-outline" id="btn-refresh-audit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            <span>Refresh Audit Feed</span>
          </button>
        </div>
      </div>

      <!-- Audit Table -->
      <div class="admin-table-card">
        <div class="admin-table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th style="width: 18%;">Actor</th>
                <th style="width: 20%;">Action Event</th>
                <th style="width: 44%;">Details / Delta</th>
                <th style="width: 18%;">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${auditLogs.length === 0 ? `
                <tr>
                  <td colspan="4" style="text-align: center; padding: 3rem; color: #94a3b8;">
                    No administrative audit records match your query.
                  </td>
                </tr>
              ` : auditLogs.map(l => `
                <tr>
                  <td>
                    <div style="font-weight: 700; color: #0f172a;">${escapeHtml(l.user_name || 'System')}</div>
                    <div style="font-size: 0.78rem; color: #64748b;">${escapeHtml(l.user_email || 'automated@rlabz.edu')}</div>
                  </td>
                  <td>
                    <span class="admin-badge" style="background:#f1f5f9; color:#1e293b; border: 1px solid #cbd5e1;">${escapeHtml(l.action)}</span>
                  </td>
                  <td style="color: #334155; font-size: 0.85rem; line-height: 1.4;">
                    ${escapeHtml(l.description || 'Action performed successfully.')}
                  </td>
                  <td style="color: #64748b; font-size: 0.82rem; white-space: nowrap;">
                    ${formatDate(l.created_at)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="admin-pagination">
          <div>Showing <strong>${auditLogs.length}</strong> of <strong>${auditPagination.total}</strong> events</div>
          <div class="admin-pagination-btns">
            <button class="btn-page" id="btn-audit-prev" ${auditPagination.current_page <= 1 ? 'disabled' : ''}>Previous</button>
            <span style="padding: 4px 10px; font-weight:700;">Page ${auditPagination.current_page} / ${auditPagination.last_page}</span>
            <button class="btn-page" id="btn-audit-next" ${auditPagination.current_page >= auditPagination.last_page ? 'disabled' : ''}>Next</button>
          </div>
        </div>
      </div>
    `;
  }

  // Bind UI Events
  function bindEvents() {
    // Tab switching
    container.querySelector('#tab-btn-users')?.addEventListener('click', () => {
      activeTab = 'users';
      loadUsers(1);
    });

    container.querySelector('#tab-btn-audit')?.addEventListener('click', () => {
      activeTab = 'audit';
      loadAuditLogs(1);
    });

    // Create user button
    container.querySelector('#btn-open-create-user')?.addEventListener('click', () => {
      selectedUser = null;
      activeModal = 'create';
      render();
    });

    // User search debounce
    const userSearchInput = container.querySelector('#admin-user-search');
    if (userSearchInput) {
      userSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchQuery = e.target.value.trim();
        searchTimer = setTimeout(() => {
          loadUsers(1);
        }, 300);
      });
    }

    // Role filter
    container.querySelector('#filter-role')?.addEventListener('change', (e) => {
      roleFilter = e.target.value;
      loadUsers(1);
    });

    // Status filter
    container.querySelector('#filter-status')?.addEventListener('change', (e) => {
      statusFilter = e.target.value;
      loadUsers(1);
    });

    // Department filter
    container.querySelector('#filter-department')?.addEventListener('change', (e) => {
      departmentFilter = e.target.value;
      loadUsers(1);
    });

    // Sort
    container.querySelector('#sort-select')?.addEventListener('change', (e) => {
      const [sb, sd] = e.target.value.split(':');
      sortBy = sb;
      sortDir = sd || 'asc';
      loadUsers(1);
    });

    // Clear filters
    container.querySelector('#btn-clear-filters')?.addEventListener('click', () => {
      searchQuery = '';
      roleFilter = '';
      statusFilter = '';
      departmentFilter = '';
      sortBy = 'created_at';
      sortDir = 'desc';
      loadUsers(1);
    });

    // Pagination
    container.querySelector('#btn-page-prev')?.addEventListener('click', () => {
      if (pagination.current_page > 1) loadUsers(pagination.current_page - 1);
    });
    container.querySelector('#btn-page-next')?.addEventListener('click', () => {
      if (pagination.current_page < pagination.last_page) loadUsers(pagination.current_page + 1);
    });

    // Audit Search & Pagination
    const auditSearchInput = container.querySelector('#admin-audit-search');
    if (auditSearchInput) {
      auditSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        auditSearch = e.target.value.trim();
        searchTimer = setTimeout(() => loadAuditLogs(1), 300);
      });
    }
    container.querySelector('#btn-refresh-audit')?.addEventListener('click', () => loadAuditLogs(1));
    container.querySelector('#btn-audit-prev')?.addEventListener('click', () => {
      if (auditPagination.current_page > 1) loadAuditLogs(auditPagination.current_page - 1);
    });
    container.querySelector('#btn-audit-next')?.addEventListener('click', () => {
      if (auditPagination.current_page < auditPagination.last_page) loadAuditLogs(auditPagination.current_page + 1);
    });

    // Action buttons inside table
    container.querySelectorAll('.btn-view-user').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openUserDetails(btn.dataset.id);
      });
    });

    // Clicking anywhere on user row opens user details modal
    container.querySelectorAll('.admin-user-row-clickable').forEach(row => {
      row.addEventListener('click', (e) => {
        // Prevent opening view modal if clicking an interactive button or control
        if (e.target.closest('button, a, input, select')) return;
        const userId = row.dataset.userId;
        if (userId) openUserDetails(userId);
      });
    });

    container.querySelectorAll('.btn-edit-user').forEach(btn => {
      btn.addEventListener('click', () => openEditUser(btn.dataset.id));
    });

    container.querySelectorAll('.btn-manage-perms').forEach(btn => {
      btn.addEventListener('click', () => openPermissionsEditor(btn.dataset.id));
    });

    container.querySelectorAll('.btn-password-user').forEach(btn => {
      btn.addEventListener('click', () => openPasswordReset(btn.dataset.id));
    });

    container.querySelectorAll('.btn-suspend').forEach(btn => {
      btn.addEventListener('click', () => toggleUserStatus(btn.dataset.id, btn.dataset.status));
    });

    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteUser(btn.dataset.id, btn.dataset.name));
    });
  }

  // Open User Details
  async function openUserDetails(id) {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, { headers: getHeaders() });
      if (res.ok) {
        const body = await res.json();
        selectedUser = body;
        activeModal = 'view';
        render();
      }
    } catch (e) {
      toast('Failed to load user profile.', 'error');
    }
  }

  // Open Edit User
  async function openEditUser(id) {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, { headers: getHeaders() });
      if (res.ok) {
        const body = await res.json();
        selectedUser = body;
        activeModal = 'edit';
        render();
      }
    } catch (e) {
      toast('Failed to load user for editing.', 'error');
    }
  }

  // Open Permissions Editor
  async function openPermissionsEditor(id) {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, { headers: getHeaders() });
      if (res.ok) {
        const body = await res.json();
        selectedUser = body;
        selectedUserPermissions = [...(body.user?.permissions || [])];
        activeModal = 'permissions';
        render();
      }
    } catch (e) {
      toast('Failed to load user permissions.', 'error');
    }
  }

  // Open Password Reset
  async function openPasswordReset(id) {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, { headers: getHeaders() });
      if (res.ok) {
        const body = await res.json();
        selectedUser = body;
        activeModal = 'password';
        render();
      }
    } catch (e) {
      toast('Failed to load user.', 'error');
    }
  }

  // Toggle user status (Active <-> Suspended)
  async function toggleUserStatus(id, currentStatus) {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const actionLabel = newStatus === 'suspended' ? 'Suspend Account' : 'Activate Account';

    const result = await Swal.fire({
      title: `${actionLabel}?`,
      text: newStatus === 'suspended' 
        ? 'Suspending this user will instantly revoke their active tokens and block any subsequent login attempts.' 
        : 'Activating this account will restore immediate portal access.',
      icon: newStatus === 'suspended' ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'suspended' ? '#ef4444' : '#059669',
      confirmButtonText: `Yes, ${actionLabel}`
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        toast(data.message || 'Status updated successfully.');
        await loadOverview();
        await loadUsers(pagination.current_page);
      } else {
        Swal.fire({ title: 'Action Failed', text: data.error || 'Failed to update status.', icon: 'error' });
      }
    } catch (e) {
      toast('Network error updating status.', 'error');
    }
  }

  // Delete User
  async function deleteUser(id, name) {
    const result = await Swal.fire({
      title: `Delete ${name}?`,
      text: 'This operation will check relational references across projects, tasks, invoices, and payments before deletion.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete Account'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        toast(data.message || 'User deleted successfully.');
        await loadOverview();
        await loadUsers(pagination.current_page);
      } else {
        Swal.fire({
          title: 'Cannot Delete Account',
          html: `<p style="font-size: 0.9rem; color: #475569;">${escapeHtml(data.error || 'User has active dependencies.')}</p>`,
          icon: 'error'
        });
      }
    } catch (e) {
      toast('Network error during deletion.', 'error');
    }
  }

  // Render Modal Windows
  function renderModal() {
    let modalRoot = document.getElementById('admin-modal-root');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'admin-modal-root';
      document.body.appendChild(modalRoot);
    }

    if (!activeModal) {
      modalRoot.innerHTML = '';
      return;
    }

    if (activeModal === 'create') {
      modalRoot.innerHTML = renderCreateUserModal();
      bindCreateModalEvents(modalRoot);
    } else if (activeModal === 'edit' && selectedUser) {
      modalRoot.innerHTML = renderEditUserModal();
      bindEditModalEvents(modalRoot);
    } else if (activeModal === 'permissions' && selectedUser) {
      modalRoot.innerHTML = renderPermissionsModal();
      bindPermissionsModalEvents(modalRoot);
    } else if (activeModal === 'password' && selectedUser) {
      modalRoot.innerHTML = renderPasswordModal();
      bindPasswordModalEvents(modalRoot);
    } else if (activeModal === 'view' && selectedUser) {
      modalRoot.innerHTML = renderViewModal();
      bindViewModalEvents(modalRoot);
    }

    // Dismiss modal when clicking backdrop
    modalRoot.querySelector('.admin-modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('admin-modal-overlay')) {
        activeModal = null;
        render();
      }
    });
  }

  // 1. Create User Modal
  function renderCreateUserModal() {
    const initialRandomPassword = generateRandomPassword();
    return `
      <div class="admin-modal-overlay">
        <div class="admin-modal modal-lg">
          <div class="admin-modal-header">
            <h3>Provision New User Account</h3>
            <button class="admin-modal-close" id="btn-modal-close">&times;</button>
          </div>
          <form id="form-create-user">
            <div class="admin-modal-body">
              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">Full Name *</label>
                  <input type="text" name="name" class="admin-form-input" placeholder="e.g. Dr. Thomas Mathew" required />
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Institutional Email * (@rajagiri.edu)</label>
                  <input type="email" name="email" class="admin-form-input" placeholder="e.g. tmathew@rajagiri.edu" required />
                  <div class="admin-form-hint">Must end with @rajagiri.edu per institutional identity policy.</div>
                </div>
              </div>

              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">System Role *</label>
                  <select name="role" id="create-role-select" class="admin-form-select" required>
                    <option value="student">Student (Nova / Orbit / Spark)</option>
                    <option value="faculty">Faculty Member</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="finance">Finance Head</option>
                    <option value="developer">Developer</option>
                    <option value="design_head">Design Head</option>
                    <option value="director">Director</option>
                    <option value="admin">Administrator (Super Admin)</option>
                  </select>
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Temporary Password *</label>
                  <div style="display:flex; gap:0.5rem;">
                    <input type="text" name="password" id="input-create-pwd" class="admin-form-input" value="${escapeHtml(initialRandomPassword)}" required minlength="6" />
                    <button type="button" class="btn-admin btn-admin-outline" id="btn-gen-pwd" style="white-space:nowrap; font-size:0.8rem;">Generate</button>
                  </div>
                </div>
              </div>

              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">Department</label>
                  <input type="text" name="department" class="admin-form-input" value="Computer Applications" />
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Phone Number</label>
                  <input type="text" name="phone" class="admin-form-input" placeholder="+91 98470 00000" />
                </div>
              </div>

              <!-- Dynamic Role-Specific Profile Section -->
              <div id="create-role-profile-section" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; margin-top:0.5rem;">
                <div style="font-weight:700; font-size:0.85rem; color:#1e293b; margin-bottom:0.75rem;">Student Track Profile Specification</div>
                <div class="admin-form-row">
                  <div class="admin-form-group">
                    <label class="admin-form-label">Designation Track</label>
                    <select name="student_designation" class="admin-form-select">
                      <option value="spark">Spark (Learner Intern)</option>
                      <option value="orbit">Orbit (Developer)</option>
                      <option value="nova">Nova (Lead Engineer)</option>
                    </select>
                  </div>
                  <div class="admin-form-group">
                    <label class="admin-form-label">Course</label>
                    <input type="text" name="course" class="admin-form-input" value="MCA" />
                  </div>
                </div>
                <div class="admin-form-row">
                  <div class="admin-form-group">
                    <label class="admin-form-label">Batch</label>
                    <input type="text" name="batch" class="admin-form-input" value="2025-2027" />
                  </div>
                  <div class="admin-form-group">
                    <label class="admin-form-label">Semester</label>
                    <input type="number" name="semester" class="admin-form-input" value="3" min="1" max="12" />
                  </div>
                </div>
              </div>
            </div>
            <div class="admin-modal-footer">
              <button type="button" class="btn-admin btn-admin-secondary" id="btn-cancel-create">Cancel</button>
              <button type="submit" class="btn-admin btn-admin-primary">Provision User Account</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function bindCreateModalEvents(modalHost) {
    const root = modalHost || document.getElementById('admin-modal-root') || container;
    root.querySelector('#btn-modal-close')?.addEventListener('click', () => { activeModal = null; render(); });
    root.querySelector('#btn-cancel-create')?.addEventListener('click', () => { activeModal = null; render(); });

    root.querySelector('#btn-gen-pwd')?.addEventListener('click', () => {
      const pwd = generateRandomPassword();
      const input = root.querySelector('#input-create-pwd');
      if (input) input.value = pwd;
    });

    const roleSelect = root.querySelector('#create-role-select');
    const profileSection = root.querySelector('#create-role-profile-section');
    if (roleSelect && profileSection) {
      roleSelect.addEventListener('change', () => {
        const val = roleSelect.value;
        if (val === 'student') {
          profileSection.innerHTML = `
            <div style="font-weight:700; font-size:0.85rem; color:#1e293b; margin-bottom:0.75rem;">Student Track Profile Specification</div>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Designation Track</label>
                <select name="student_designation" class="admin-form-select">
                  <option value="spark">Spark (Learner Intern)</option>
                  <option value="orbit">Orbit (Developer)</option>
                  <option value="nova">Nova (Lead Engineer)</option>
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Course</label>
                <input type="text" name="course" class="admin-form-input" value="MCA" />
              </div>
            </div>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Batch</label>
                <input type="text" name="batch" class="admin-form-input" value="2025-2027" />
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Semester</label>
                <input type="number" name="semester" class="admin-form-input" value="3" min="1" max="12" />
              </div>
            </div>
          `;
          profileSection.style.display = 'block';
        } else if (val === 'faculty') {
          profileSection.innerHTML = `
            <div style="font-weight:700; font-size:0.85rem; color:#1e293b; margin-bottom:0.75rem;">Faculty Profile Specification</div>
            <div class="admin-form-group">
              <label class="admin-form-label">Designation</label>
              <input type="text" name="faculty_designation" class="admin-form-input" value="Assistant Professor" />
            </div>
          `;
          profileSection.style.display = 'block';
        } else if (val === 'design_head') {
          profileSection.innerHTML = `
            <div style="font-weight:700; font-size:0.85rem; color:#1e293b; margin-bottom:0.75rem;">Design Studio Profile Specification</div>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Division</label>
                <input type="text" name="division" class="admin-form-input" value="Design &amp; UI/UX" />
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Weekly Capacity Hours</label>
                <input type="number" name="weekly_capacity_hours" class="admin-form-input" value="30" min="0" max="80" />
              </div>
            </div>
          `;
          profileSection.style.display = 'block';
        } else {
          profileSection.style.display = 'none';
        }
      });
    }

    const form = root.querySelector('#form-create-user');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());

        const submitBtn = form.querySelector('button[type="submit"]');
        const origBtnText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Provisioning...';
        }

        try {
          const res = await fetch(`${API_BASE}/admin/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok) {
            Swal.fire({
              title: 'Account Provisioned!',
              html: `<p><strong>${escapeHtml(payload.name || '')}</strong> has been registered in the database.</p>
                     <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:0.75rem; margin-top:0.75rem; text-align:left; font-size:0.85rem;">
                       <div><strong>Email:</strong> ${escapeHtml(payload.email || '')}</div>
                       <div><strong>Role:</strong> ${escapeHtml(payload.role || '')}</div>
                       <div><strong>Temporary Password:</strong> <code style="color:#059669; font-weight:700;">${escapeHtml(payload.password || '')}</code></div>
                     </div>`,
              icon: 'success'
            });
            activeModal = null;
            await loadOverview();
            await loadUsers(1);
          } else {
            let errorMsg = data.error || data.message || '';
            if (data.errors) {
              const details = Object.entries(data.errors)
                .map(([field, msgs]) => `• <strong>${escapeHtml(field)}:</strong> ${escapeHtml(Array.isArray(msgs) ? msgs.join(', ') : msgs)}`)
                .join('<br>');
              errorMsg = (errorMsg ? `<p>${escapeHtml(errorMsg)}</p>` : '') + `<div style="text-align:left; font-size:0.85rem;">${details}</div>`;
            }
            if (!errorMsg) errorMsg = 'Please check the required fields and ensure email has @rajagiri.edu.';
            Swal.fire({ title: 'Cannot Provision User', html: errorMsg, icon: 'error' });
          }
        } catch (err) {
          console.error('Error creating user:', err);
          Swal.fire({ title: 'Request Failed', text: 'Network or server error encountered.', icon: 'error' });
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origBtnText;
          }
        }
      });
    }
  }

  // 2. Edit User Modal
  function renderEditUserModal() {
    const u = selectedUser.user || {};
    const rp = selectedUser.role_profile || {};

    return `
      <div class="admin-modal-overlay">
        <div class="admin-modal modal-lg">
          <div class="admin-modal-header">
            <h3>Edit Account Details: ${escapeHtml(u.name)}</h3>
            <button class="admin-modal-close" id="btn-modal-close">&times;</button>
          </div>
          <form id="form-edit-user">
            <div class="admin-modal-body">
              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">Full Name *</label>
                  <input type="text" name="name" class="admin-form-input" value="${escapeHtml(u.name || '')}" required />
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Institutional Email *</label>
                  <input type="email" name="email" class="admin-form-input" value="${escapeHtml(u.email || '')}" required />
                </div>
              </div>

              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">System Role *</label>
                  <select name="role" class="admin-form-select" required>
                    <option value="student" ${u.role === 'student' ? 'selected' : ''}>Student (Nova / Orbit / Spark)</option>
                    <option value="faculty" ${u.role === 'faculty' ? 'selected' : ''}>Faculty Member</option>
                    <option value="coordinator" ${u.role === 'coordinator' ? 'selected' : ''}>Coordinator</option>
                    <option value="finance" ${u.role === 'finance' ? 'selected' : ''}>Finance Head</option>
                    <option value="developer" ${u.role === 'developer' ? 'selected' : ''}>Developer</option>
                    <option value="design_head" ${u.role === 'design_head' ? 'selected' : ''}>Design Head</option>
                    <option value="director" ${u.role === 'director' ? 'selected' : ''}>Director</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrator (Super Admin)</option>
                  </select>
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Account Status</label>
                  <select name="status" class="admin-form-select">
                    <option value="active" ${u.status === 'active' ? 'selected' : ''}>Active (Operational)</option>
                    <option value="suspended" ${u.status === 'suspended' ? 'selected' : ''}>Suspended (Blocked)</option>
                  </select>
                </div>
              </div>

              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">Department</label>
                  <input type="text" name="department" class="admin-form-input" value="${escapeHtml(u.department || '')}" />
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Phone Number</label>
                  <input type="text" name="phone" class="admin-form-input" value="${escapeHtml(u.phone || '')}" />
                </div>
              </div>

              <div class="admin-form-row">
                <div class="admin-form-group">
                  <label class="admin-form-label">Location</label>
                  <input type="text" name="location" class="admin-form-input" value="${escapeHtml(u.location || 'Kochi, India')}" />
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Bio / Notes</label>
                  <input type="text" name="bio" class="admin-form-input" value="${escapeHtml(u.bio || '')}" />
                </div>
              </div>

              <!-- Profile specifics if student/faculty -->
              ${u.role === 'student' ? `
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; margin-top:0.5rem;">
                  <div style="font-weight:700; font-size:0.85rem; color:#1e293b; margin-bottom:0.75rem;">Student Track Profile</div>
                  <div class="admin-form-row">
                    <div class="admin-form-group">
                      <label class="admin-form-label">Designation Track</label>
                      <select name="student_designation" class="admin-form-select">
                        <option value="spark" ${rp.designation === 'spark' ? 'selected' : ''}>Spark (Learner Intern)</option>
                        <option value="orbit" ${rp.designation === 'orbit' ? 'selected' : ''}>Orbit (Developer)</option>
                        <option value="nova" ${rp.designation === 'nova' ? 'selected' : ''}>Nova (Lead Engineer)</option>
                      </select>
                    </div>
                    <div class="admin-form-group">
                      <label class="admin-form-label">Course</label>
                      <input type="text" name="course" class="admin-form-input" value="${escapeHtml(rp.course || 'MCA')}" />
                    </div>
                  </div>
                  <div class="admin-form-row">
                    <div class="admin-form-group">
                      <label class="admin-form-label">Batch</label>
                      <input type="text" name="batch" class="admin-form-input" value="${escapeHtml(rp.batch || '2025-2027')}" />
                    </div>
                    <div class="admin-form-group">
                      <label class="admin-form-label">Semester</label>
                      <input type="number" name="semester" class="admin-form-input" value="${rp.semester || 3}" min="1" max="12" />
                    </div>
                  </div>
                </div>
              ` : ''}

              ${u.role === 'faculty' ? `
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; margin-top:0.5rem;">
                  <div style="font-weight:700; font-size:0.85rem; color:#1e293b; margin-bottom:0.75rem;">Faculty Profile</div>
                  <div class="admin-form-group">
                    <label class="admin-form-label">Academic Designation</label>
                    <input type="text" name="faculty_designation" class="admin-form-input" value="${escapeHtml(rp.designation || 'Faculty Member')}" />
                  </div>
                </div>
              ` : ''}
            </div>
            <div class="admin-modal-footer">
              <button type="button" class="btn-admin btn-admin-secondary" id="btn-cancel-edit">Cancel</button>
              <button type="submit" class="btn-admin btn-admin-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function bindEditModalEvents(modalHost) {
    const root = modalHost || document.getElementById('admin-modal-root') || container;
    root.querySelector('#btn-modal-close')?.addEventListener('click', () => { activeModal = null; render(); });
    root.querySelector('#btn-cancel-edit')?.addEventListener('click', () => { activeModal = null; render(); });

    const form = root.querySelector('#form-edit-user');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());

        try {
          const res = await fetch(`${API_BASE}/admin/users/${selectedUser.user.id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok) {
            toast(data.message || 'User updated successfully.');
            activeModal = null;
            await loadOverview();
            await loadUsers(pagination.current_page);
          } else {
            Swal.fire({ title: 'Update Failed', text: data.error || 'Please correct errors.', icon: 'error' });
          }
        } catch (err) {
          toast('Network error updating user.', 'error');
        }
      });
    }
  }

  // 3. Permissions Editor Modal
  function renderPermissionsModal() {
    const u = selectedUser.user || {};
    const defaults = selectedUser.role_defaults || [];
    const cat = catalog || {};

    return `
      <div class="admin-modal-overlay">
        <div class="admin-modal modal-lg" style="max-height: 92vh;">
          <div class="admin-modal-header">
            <div>
              <h3>Fine-Grained Permissions: ${escapeHtml(u.name)}</h3>
              <div style="font-size:0.8rem; color:#64748b; margin-top:2px;">
                Role: <strong>${formatRole(u.role)}</strong> &bull; Total Assigned: <span id="val-perm-count" style="font-weight:700; color:#059669;">${selectedUserPermissions.length}</span>
              </div>
            </div>
            <button class="admin-modal-close" id="btn-modal-close">&times;</button>
          </div>
          <div class="admin-modal-body">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
              <span style="font-size:0.82rem; color:#475569;">
                Check or uncheck individual capabilities. Changes take effect on the user's very next API request.
              </span>
              <button class="btn-admin btn-admin-outline" id="btn-reset-role-defaults" style="font-size:0.78rem; padding:4px 10px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 2v6h6M21.5 22v-6h-6"></path><path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"></path></svg>
                <span>Reset to Role Defaults</span>
              </button>
            </div>

            <!-- Permission Modules List -->
            <div class="admin-perm-container">
              ${Object.entries(cat).map(([domain, perms]) => `
                <div class="admin-perm-group">
                  <div class="admin-perm-header">
                    <span>${escapeHtml(domain)} (${perms.length})</span>
                    <div style="display:flex; gap:0.5rem;">
                      <button type="button" class="btn-perm-group-select" data-domain="${escapeHtml(domain)}" data-action="all" style="background:none; border:none; color:#059669; font-size:0.72rem; font-weight:700; cursor:pointer;">Select All</button>
                      <button type="button" class="btn-perm-group-select" data-domain="${escapeHtml(domain)}" data-action="none" style="background:none; border:none; color:#64748b; font-size:0.72rem; font-weight:700; cursor:pointer;">Clear</button>
                    </div>
                  </div>
                  <div class="admin-perm-grid">
                    ${perms.map(p => {
                      const isChecked = selectedUserPermissions.includes(p.key);
                      const isDefault = defaults.includes(p.key);
                      return `
                        <label class="admin-perm-item">
                          <input type="checkbox" class="chk-perm" value="${p.key}" ${isChecked ? 'checked' : ''} />
                          <div class="admin-perm-item-content">
                            <div class="admin-perm-title">
                              ${escapeHtml(p.label)}
                              ${isDefault ? `<span class="perm-pill-inherited" title="Standard default for ${u.role}">Default</span>` : ''}
                              ${isChecked && !isDefault ? `<span class="perm-pill-granted" title="Explicit custom override grant">+Grant</span>` : ''}
                            </div>
                            <div class="admin-perm-desc">${escapeHtml(p.description)}</div>
                          </div>
                        </label>
                      `;
                    }).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="admin-modal-footer">
            <button type="button" class="btn-admin btn-admin-secondary" id="btn-cancel-perms">Cancel</button>
            <button type="button" class="btn-admin btn-admin-primary" id="btn-save-perms">Save Permissions Array</button>
          </div>
        </div>
      </div>
    `;
  }

  function bindPermissionsModalEvents(modalHost) {
    const root = modalHost || document.getElementById('admin-modal-root') || container;
    root.querySelector('#btn-modal-close')?.addEventListener('click', () => { activeModal = null; render(); });
    root.querySelector('#btn-cancel-perms')?.addEventListener('click', () => { activeModal = null; render(); });

    // Track checkbox toggles
    root.querySelectorAll('.chk-perm').forEach(chk => {
      chk.addEventListener('change', () => {
        const val = chk.value;
        if (chk.checked) {
          if (!selectedUserPermissions.includes(val)) selectedUserPermissions.push(val);
        } else {
          selectedUserPermissions = selectedUserPermissions.filter(p => p !== val);
        }
        const counter = root.querySelector('#val-perm-count');
        if (counter) counter.textContent = selectedUserPermissions.length;
      });
    });

    // Reset to role defaults
    root.querySelector('#btn-reset-role-defaults')?.addEventListener('click', () => {
      const defaults = selectedUser.role_defaults || [];
      selectedUserPermissions = [...defaults];
      root.querySelectorAll('.chk-perm').forEach(chk => {
        chk.checked = defaults.includes(chk.value);
      });
      const counter = root.querySelector('#val-perm-count');
      if (counter) counter.textContent = selectedUserPermissions.length;
      toast(`Permissions reset to standard defaults for ${selectedUser.user.role}.`);
    });

    // Select all / clear per group
    root.querySelectorAll('.btn-perm-group-select').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.closest('.admin-perm-group');
        const checkboxes = group.querySelectorAll('.chk-perm');
        const action = btn.dataset.action;
        checkboxes.forEach(chk => {
          chk.checked = action === 'all';
          const val = chk.value;
          if (action === 'all' && !selectedUserPermissions.includes(val)) selectedUserPermissions.push(val);
          if (action === 'none') selectedUserPermissions = selectedUserPermissions.filter(p => p !== val);
        });
        const counter = root.querySelector('#val-perm-count');
        if (counter) counter.textContent = selectedUserPermissions.length;
      });
    });

    // Save permissions
    root.querySelector('#btn-save-perms')?.addEventListener('click', async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/users/${selectedUser.user.id}/permissions`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({ permissions: selectedUserPermissions })
        });
        const data = await res.json();
        if (res.ok) {
          toast(data.message || 'Permissions updated successfully.');

          // If the updated user is the active user, sync their session immediately
          const currentLoggedUser = authStore.user;
          if (currentLoggedUser && (String(currentLoggedUser.id) === String(selectedUser.user.id))) {
            currentLoggedUser.permissions = data.permissions || selectedUserPermissions;
            if (data.modules) currentLoggedUser.modules = data.modules;
            if (data.has_design_access !== undefined) currentLoggedUser.has_design_access = data.has_design_access;
            localStorage.setItem('user', JSON.stringify(currentLoggedUser));
            
            // Invalidate sidebar cache
            const sidebarNav = document.querySelector('.sidebar-nav');
            if (sidebarNav) {
              delete sidebarNav.dataset.portal;
              delete sidebarNav.dataset.permsHash;
            }
          }

          activeModal = null;
          await loadUsers(pagination.current_page);
        } else {
          Swal.fire({ title: 'Update Failed', text: data.error || 'Failed to update permissions.', icon: 'error' });
        }
      } catch (err) {
        toast('Network error saving permissions.', 'error');
      }
    });
  }

  // 4. Password Reset Modal
  function renderPasswordModal() {
    const u = selectedUser.user || {};
    return `
      <div class="admin-modal-overlay">
        <div class="admin-modal" style="max-width: 520px;">
          <div class="admin-modal-header">
            <h3>Reset Credentials: ${escapeHtml(u.name)}</h3>
            <button class="admin-modal-close" id="btn-modal-close">&times;</button>
          </div>
          <form id="form-reset-password">
            <div class="admin-modal-body">
              <p style="font-size:0.86rem; color:#475569; margin-top:0;">
                Assign a temporary password for <strong>${escapeHtml(u.email)}</strong>. Setting a temporary password immediately revokes all active login tokens and personal access tokens across all devices.
              </p>

              <div class="admin-form-group">
                <label class="admin-form-label">New Temporary Password *</label>
                <div style="display:flex; gap:0.5rem;">
                  <input type="text" name="password" id="input-reset-pwd" class="admin-form-input" value="${escapeHtml(generateRandomPassword())}" required minlength="6" />
                  <button type="button" class="btn-admin btn-admin-outline" id="btn-gen-reset-pwd" style="white-space:nowrap; font-size:0.8rem;">Generate</button>
                </div>
              </div>

              <div style="background:#fffbeb; border:1px solid #fef3c7; border-radius:6px; padding:0.75rem; margin-top:1rem; font-size:0.78rem; color:#92400e;">
                🔒 <strong>Security Enforcement:</strong> All Sanctum personal_access_tokens for this user will be purged upon save.
              </div>
            </div>
            <div class="admin-modal-footer">
              <button type="button" class="btn-admin btn-admin-secondary" id="btn-cancel-pwd">Cancel</button>
              <button type="submit" class="btn-admin btn-admin-primary">Set Temporary Password</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function bindPasswordModalEvents(modalHost) {
    const root = modalHost || document.getElementById('admin-modal-root') || container;
    root.querySelector('#btn-modal-close')?.addEventListener('click', () => { activeModal = null; render(); });
    root.querySelector('#btn-cancel-pwd')?.addEventListener('click', () => { activeModal = null; render(); });

    root.querySelector('#btn-gen-reset-pwd')?.addEventListener('click', () => {
      const pwd = generateRandomPassword();
      const input = root.querySelector('#input-reset-pwd');
      if (input) input.value = pwd;
    });

    const form = root.querySelector('#form-reset-password');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const password = fd.get('password');

        try {
          const res = await fetch(`${API_BASE}/admin/users/${selectedUser.user.id}/reset-password`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ password })
          });
          const data = await res.json();
          if (res.ok) {
            Swal.fire({
              title: 'Password Updated',
              html: `<p style="font-size:0.9rem;">Temporary password for <strong>${escapeHtml(selectedUser.user.email)}</strong>:</p><code style="font-size:1.1rem; background:#f1f5f9; padding:6px 12px; border-radius:4px; display:inline-block; font-weight:700; color:#059669;">${escapeHtml(password)}</code><p style="font-size:0.8rem; color:#64748b; margin-top:0.75rem;">Active login sessions have been invalidated.</p>`,
              icon: 'success'
            });
            activeModal = null;
            render();
          } else {
            Swal.fire({ title: 'Reset Failed', text: data.error || 'Failed to reset password.', icon: 'error' });
          }
        } catch (err) {
          toast('Network error resetting password.', 'error');
        }
      });
    }
  }

  // 5. View User Details Modal
  function renderViewModal() {
    const u = selectedUser.user || {};
    const rp = selectedUser.role_profile || {};
    const audits = selectedUser.audit_history || [];

    return `
      <div class="admin-modal-overlay">
        <div class="admin-modal modal-lg">
          <div class="admin-modal-header">
            <h3>Account Overview: ${escapeHtml(u.name)}</h3>
            <button class="admin-modal-close" id="btn-modal-close">&times;</button>
          </div>
          <div class="admin-modal-body">
            <div style="display:flex; align-items:center; gap:1.25rem; margin-bottom:1.5rem; padding-bottom:1.25rem; border-bottom:1px solid #e2e8f0;">
              <div class="admin-avatar" style="width:64px; height:64px; font-size:1.4rem;">
                ${u.profile_photo_path ? `<img src="${u.profile_photo_path}" alt="${escapeHtml(u.name)}" />` : u.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style="font-size:1.3rem; font-weight:800; color:#0f172a;">${escapeHtml(u.name)}</div>
                <div style="color:#64748b; font-size:0.9rem;">${escapeHtml(u.email)} &bull; ${escapeHtml(u.phone || 'No phone recorded')}</div>
                <div style="margin-top:0.4rem; display:flex; gap:0.5rem;">
                  <span class="admin-badge badge-role-${u.role}">${formatRole(u.role)}</span>
                  <span class="admin-badge badge-status-${u.status}">${u.status === 'suspended' ? 'Suspended' : 'Active'}</span>
                </div>
              </div>
            </div>

            <!-- Details Grid -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
              <div style="background:#f8fafc; padding:0.75rem 1rem; border-radius:8px; border:1px solid #e2e8f0;">
                <div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">Department</div>
                <div style="font-weight:700; color:#0f172a; margin-top:2px;">${escapeHtml(u.department || 'Not specified')}</div>
              </div>
              <div style="background:#f8fafc; padding:0.75rem 1rem; border-radius:8px; border:1px solid #e2e8f0;">
                <div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">Location</div>
                <div style="font-weight:700; color:#0f172a; margin-top:2px;">${escapeHtml(u.location || 'Kochi, India')}</div>
              </div>
              <div style="background:#f8fafc; padding:0.75rem 1rem; border-radius:8px; border:1px solid #e2e8f0;">
                <div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">Registered Date</div>
                <div style="font-weight:700; color:#0f172a; margin-top:2px;">${formatDate(u.created_at)}</div>
              </div>
              <div style="background:#f8fafc; padding:0.75rem 1rem; border-radius:8px; border:1px solid #e2e8f0;">
                <div style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase;">Permissions Count</div>
                <div style="font-weight:700; color:#059669; margin-top:2px;">${(u.permissions || []).length} Granted</div>
              </div>
            </div>

            <!-- Linked Profile Card if exists -->
            ${Object.keys(rp).length > 0 ? `
              <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:8px; padding:1rem; margin-bottom:1.5rem;">
                <div style="font-weight:800; font-size:0.85rem; color:#1e293b; margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.04em;">Linked Role Profile Specifications</div>
                <div style="font-size:0.85rem; color:#334155; line-height:1.6;">
                  ${Object.entries(rp).filter(([k]) => !['id', 'created_at', 'updated_at', 'user_id', 'student_id', 'faculty_id'].includes(k)).map(([k, v]) => `
                    <div><strong>${formatCamel(k)}:</strong> ${escapeHtml(String(v))}</div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Recent Activity Audits -->
            <div>
              <div style="font-weight:800; font-size:0.85rem; color:#1e293b; margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.04em;">Recent Event Log</div>
              ${audits.length === 0 ? `
                <div style="color:#94a3b8; font-size:0.85rem;">No recent audit activity on record for this account.</div>
              ` : `
                <div style="display:flex; flex-direction:column; gap:0.5rem;">
                  ${audits.slice(0, 5).map(a => `
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:0.6rem 0.85rem; font-size:0.82rem;">
                      <div style="display:flex; justify-content:space-between; font-weight:700; color:#0f172a;">
                        <span>${escapeHtml(a.action)}</span>
                        <span style="font-size:0.75rem; color:#94a3b8;">${formatDate(a.created_at)}</span>
                      </div>
                      <div style="color:#64748b; margin-top:2px;">${escapeHtml(a.description)}</div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
          <div class="admin-modal-footer">
            <button type="button" class="btn-admin btn-admin-primary" id="btn-close-view">Done</button>
          </div>
        </div>
      </div>
    `;
  }

  function bindViewModalEvents(modalHost) {
    const root = modalHost || document.getElementById('admin-modal-root') || container;
    root.querySelector('#btn-modal-close')?.addEventListener('click', () => { activeModal = null; render(); });
    root.querySelector('#btn-close-view')?.addEventListener('click', () => { activeModal = null; render(); });
  }

  // Helpers
  function generateRandomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 12; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }

  function formatRole(role) {
    if (!role) return 'Student';
    if (role === 'design_head') return 'Design Head';
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  function formatDate(val) {
    if (!val) return '—';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return val;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatCamel(str) {
    return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  init();
  return container;
}

export default AdminUsers;
