import{m as b,u as f}from"./index-259ac0f3.js";async function y(s,i,n){var c;const t=f(),d=window.location.pathname,u=b.filter(e=>!(!e.sidebar||!t.modules.includes(e.name))),a=document.createElement("div");a.className="dashboard-layout animate-fade-in";const p=u.map(e=>{const m=d.startsWith(e.path);return`
      <li>
        <a href="${e.path}" class="${m?"active":""}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
          </svg>
          <span>${e.title}</span>
        </a>
      </li>
    `}).join(""),l=((c=t.user)==null?void 0:c.username)||"User",h=t.role||"Guest",v=l.charAt(0).toUpperCase();a.innerHTML=`
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span>RLABZ ERP</span>
          <span class="badge">PRO</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <ul>
          ${p}
        </ul>
      </nav>
      <div class="sidebar-footer">
        <button id="logout-btn" class="logout-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <div class="main-wrapper">
      <header class="topbar">
        <div class="topbar-title">${i.name?i.name.toUpperCase().replace("-"," "):"ERP SYSTEM"}</div>
        <div class="user-profile">
          <div class="avatar">${v}</div>
          <div class="user-details">
            <span class="user-name">Welcome, ${l}</span>
            <span class="user-role">${h}</span>
          </div>
        </div>
      </header>
      
      <main class="content-outlet" id="layout-outlet"></main>
    </div>
  `;const o=a.querySelector("#layout-outlet");if(s)if(typeof s=="function"){const e=await s(i,n);o.appendChild(e)}else o.appendChild(s);const r=a.querySelector("#logout-btn");return r==null||r.addEventListener("click",()=>{t.logout(),n.push("/login")}),a}export{y as D};
