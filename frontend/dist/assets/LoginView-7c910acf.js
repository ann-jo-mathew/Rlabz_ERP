import{u as p}from"./index-259ac0f3.js";function y(m,o){const n=p(),e=document.createElement("div");e.className="login-container",e.innerHTML=`
    <div class="login-box animate-fade-in">
      <div class="login-brand">
        <div class="logo-badge">R</div>
        <h2>RLABZ ERP</h2>
        <p class="hint">Use <code>admin</code> / <code>password</code> to test the mock auth.</p>
      </div>

      <div id="error-box" class="alert-error" style="display: none;"></div>

      <form id="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input id="username" type="text" value="admin" required placeholder="Enter username" />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" type="password" value="password" required placeholder="Enter password" />
        </div>
        <button id="submit-btn" type="submit" class="btn-primary">
          <span id="btn-text">Login</span>
        </button>
      </form>
    </div>
  `;const a=e.querySelector("#login-form"),i=e.querySelector("#username"),d=e.querySelector("#password"),t=e.querySelector("#submit-btn"),r=e.querySelector("#btn-text"),s=e.querySelector("#error-box");return a.addEventListener("submit",async l=>{l.preventDefault(),t.disabled=!0,r.innerHTML='<div class="spinner"></div> Logging in...',s.style.display="none";const u=i.value.trim(),c=d.value.trim();await n.login(u,c)?o.push("/dashboard"):(s.textContent="Invalid credentials. Please use admin / password.",s.style.display="block",t.disabled=!1,r.textContent="Login")}),e}export{y as LoginView,y as default};
