function t(e,s){const i=document.createElement("div");return i.className="dashboard-home animate-fade-in",i.innerHTML=`
    <div class="page-header">
      <h1>Director Dashboard</h1>
      <p>Welcome to the RLABZ ERP Director Dashboard.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="header">
          <h3>Total Projects</h3>
          <div class="icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
        </div>
        <div class="value">42</div>
        <div class="trend">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
          <span>+12% from last month</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="header">
          <h3>Active Students</h3>
          <div class="icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        </div>
        <div class="value">156</div>
        <div class="trend">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
          <span>+8% this semester</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="header">
          <h3>Pending Invoices</h3>
          <div class="icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        </div>
        <div class="value">8</div>
        <div class="trend" style="color: var(--warning);">
          <span>2 requiring immediate review</span>
        </div>
      </div>
    </div>
  `,i}export{t as DashboardHome,t as default};
