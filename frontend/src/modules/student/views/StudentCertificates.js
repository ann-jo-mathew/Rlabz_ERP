import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, ensureDataLoaded } from './studentStore.js';
import { useAuthStore } from '@/core/stores/auth.js';
import { StudentSwal } from '../studentAlerts.js';
import html2pdf from 'html2pdf.js';
import '../student.css';

export async function StudentCertificates(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in student-certificates-view';

  const authStore = useAuthStore();
  const studentName = authStore.user?.name || 'Student Nova';

  // Modal & Filter State
  let activeCertificate = null;
  let certSearch = '';
  let certSort = 'newest'; // 'newest' | 'oldest' | 'alpha'

  function render() {
    const projects = getProjects() || [];
    
    // Only completed projects that student is part of
    const completedProjects = projects.filter(p => {
      const isCompleted = p.status === 'Completed';
      const isMember = p.members && p.members.toLowerCase().includes(studentName.toLowerCase());
      return isCompleted && isMember;
    });

    // KPI Metrics
    const totalCerts = completedProjects.length;
    const verifiedCerts = completedProjects.length; // 100% Verified
    const distinctTracks = new Set(completedProjects.map(p => p.designation || 'Academic Specialist')).size;

    // Apply Search Filter
    let filteredCertificates = completedProjects.filter(p => {
      if (certSearch.trim()) {
        const q = certSearch.toLowerCase().trim();
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchFaculty = (p.faculty || '').toLowerCase().includes(q);
        const matchRole = (p.designation || '').toLowerCase().includes(q);
        if (!matchTitle && !matchFaculty && !matchRole) return false;
      }
      return true;
    });

    // Apply Sorting
    filteredCertificates.sort((a, b) => {
      if (certSort === 'alpha') {
        return (a.title || '').localeCompare(b.title || '');
      }
      const getDateVal = (p) => {
        if (p.timeline && p.timeline.includes(' - ')) {
          return new Date(p.timeline.split(' - ')[1]).getTime() || 0;
        }
        return 0;
      };
      if (certSort === 'oldest') {
        return getDateVal(a) - getDateVal(b);
      }
      return getDateVal(b) - getDateVal(a);
    });

    const isFiltersActive = certSearch.trim() !== '' || certSort !== 'newest';

    const certificateCards = filteredCertificates.map(p => {
      let issuedDate = '30 Sep 2026';
      if (p.timeline) {
        const parts = p.timeline.split(' - ');
        if (parts.length > 1) {
          issuedDate = parts[1].trim();
        }
      }
      const certCode = p.certificate_number || `CERT-2026-${String(p.id || '001').padStart(3, '0')}`;

      return `
        <div class="student-cert-card" data-id="${p.id}">
          <div>
            <div class="student-cert-card-header">
              <span class="student-cert-seal-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                Verified Credential
              </span>
              <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; font-family: monospace;">${certCode}</span>
            </div>
            
            <h3 class="student-cert-card-title">${p.title}</h3>
          </div>
          
          <div class="student-cert-details-grid">
            <div class="student-cert-detail-box">
              <span class="student-cert-detail-lbl">Issued Date</span>
              <span class="student-cert-detail-val">${issuedDate}</span>
            </div>
            <div class="student-cert-detail-box">
              <span class="student-cert-detail-lbl">Status</span>
              <span class="student-badge student-badge-success" style="font-size: 0.7rem; padding: 2px 6px;">
                Verified
              </span>
            </div>
            <div class="student-cert-detail-box">
              <span class="student-cert-detail-lbl">Supervisor</span>
              <span class="student-cert-detail-val">${p.faculty || 'Faculty Lead'}</span>
            </div>
            <div class="student-cert-detail-box">
              <span class="student-cert-detail-lbl">Role Track</span>
              <span class="student-cert-detail-val">${p.designation || 'Academic Specialist'}</span>
            </div>
          </div>

          <div class="student-cert-actions-row">
            <button type="button" class="student-cert-btn-view btn-view-cert" data-id="${p.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>View</span>
            </button>
            <button type="button" class="student-cert-btn-download btn-download-cert" data-id="${p.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download PDF</span>
            </button>
            <button type="button" class="student-cert-btn-icon btn-copy-cert-info" data-id="${p.id}" title="Copy Certificate Verification ID">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <!-- Header Banner -->
      <div class="student-cert-header-wrapper">
        <div class="student-cert-header-left">
          <div class="student-cert-brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="7"></circle>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
          </div>
          <div>
            <h1 class="student-cert-title">My Certificates</h1>
            <p class="student-cert-subtitle">View, verify, and download official project completion certificates issued by the academy.</p>
          </div>
        </div>
      </div>

      <!-- KPI Summary Overview -->
      <div class="student-cert-kpi-grid">
        <div class="student-cert-kpi-card kpi-amber">
          <div class="student-cert-kpi-icon amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
          </div>
          <div class="student-cert-kpi-info">
            <div class="student-cert-kpi-val">${totalCerts}</div>
            <div class="student-cert-kpi-lbl">Earned Certificates</div>
          </div>
        </div>

        <div class="student-cert-kpi-card kpi-emerald">
          <div class="student-cert-kpi-icon emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div class="student-cert-kpi-info">
            <div class="student-cert-kpi-val">${verifiedCerts}</div>
            <div class="student-cert-kpi-lbl">Verified Credentials</div>
          </div>
        </div>

        <div class="student-cert-kpi-card kpi-indigo">
          <div class="student-cert-kpi-icon indigo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          </div>
          <div class="student-cert-kpi-info">
            <div class="student-cert-kpi-val">${distinctTracks}</div>
            <div class="student-cert-kpi-lbl">Specializations</div>
          </div>
        </div>

        <div class="student-cert-kpi-card kpi-blue">
          <div class="student-cert-kpi-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div class="student-cert-kpi-info">
            <div class="student-cert-kpi-val" style="font-size: 1.15rem;">${totalCerts > 0 ? 'Active' : 'Pending'}</div>
            <div class="student-cert-kpi-lbl">Issuance Status</div>
          </div>
        </div>
      </div>

      ${completedProjects.length === 0 ? `
        <div style="text-align: center; padding: 56px 24px; background: var(--surface-card); border: 1px dashed var(--border-subtle); border-radius: 18px;">
          <div style="font-size: 3rem; margin-bottom: 14px;">🎓</div>
          <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">No Certificates Available Yet</h3>
          <p style="color: var(--text-muted); max-width: 420px; margin: 0 auto; font-size: 0.88rem; line-height: 1.5;">
            Certificates are automatically issued once your assigned projects are completed and approved by your faculty supervisor.
          </p>
        </div>
      ` : `
        <!-- Filter & Search Bar -->
        <div class="student-cert-filter-bar">
          <div class="student-cert-search-box">
            <svg class="student-cert-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="cert-search-input" class="student-cert-search-input" placeholder="Search certificates by project, supervisor, or track..." value="${certSearch}">
          </div>

          <select id="cert-sort-select" class="student-cert-select">
            <option value="newest" ${certSort === 'newest' ? 'selected' : ''}>Sort: Newest Issued</option>
            <option value="oldest" ${certSort === 'oldest' ? 'selected' : ''}>Sort: Oldest</option>
            <option value="alpha" ${certSort === 'alpha' ? 'selected' : ''}>Sort: Alphabetical (A-Z)</option>
          </select>

          ${isFiltersActive ? `
            <button type="button" id="btn-clear-cert-filters" class="student-cert-btn-reset" title="Reset filters">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              Reset Filters
            </button>
          ` : ''}
        </div>

        ${filteredCertificates.length === 0 ? `
          <div style="text-align: center; padding: 48px 20px; background: var(--surface-card); border: 1px dashed var(--border-subtle); border-radius: 16px;">
            <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
            <div style="font-weight: 700; color: var(--text-primary); font-size: 1rem; margin-bottom: 4px;">No certificates match your search query</div>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 14px;">Try searching by a different project title or clear your filters.</div>
            <button type="button" id="btn-empty-clear-cert" class="student-btn student-btn-outline student-btn-sm" style="margin: 0 auto;">
              Clear Search
            </button>
          </div>
        ` : `
          <div class="student-cert-grid">
            ${certificateCards}
          </div>
        `}
      `}

      <!-- Certificate Preview Modal -->
      <div class="student-cert-modal" id="cert-preview-modal" style="display: none;">
        <div class="student-cert-modal-overlay"></div>
        <div class="student-cert-modal-content">
          <button type="button" class="student-cert-modal-close" id="btn-close-modal">&times;</button>
          <div>
            <div class="student-cert-framed-doc">
              <div class="student-cert-border-outer">
                <div class="student-cert-border-inner">
                  <div class="student-cert-doc-logo">RLABZ ACADEMY</div>
                  <div class="student-cert-doc-title">CERTIFICATE OF COMPLETION</div>
                  <div class="student-cert-doc-sub">PROUDLY PRESENTED TO</div>
                  <div class="student-cert-doc-recipient">${studentName}</div>
                  <div class="student-cert-doc-body">
                    for successfully completing all requirements and active project contributions in the project
                  </div>
                  <div class="student-cert-doc-project" id="modal-project-name">CMS Academic Module</div>
                  <div class="student-cert-doc-body">
                    under the supervision of CS Faculty and Co-ordinators.
                  </div>
                  
                  <div class="student-cert-doc-signatures">
                    <div class="student-cert-doc-sig-box">
                      <div class="student-cert-doc-sig-line"></div>
                      <span style="font-size: 13px; font-weight: 700; color: #1e293b;" id="modal-faculty-name">Prof. Mathew John</span>
                      <label style="font-size: 11px; color: var(--text-muted); margin-top: 2px; font-family: sans-serif;">Project Supervisor</label>
                    </div>
                    <div class="student-cert-doc-sig-box">
                      <div class="student-cert-doc-sig-line"></div>
                      <span style="font-size: 13px; font-weight: 700; color: #1e293b;">Director, RLabZ ERP</span>
                      <label style="font-size: 11px; color: var(--text-muted); margin-top: 2px; font-family: sans-serif;">Issuing Authority</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; width: 100%;">
            <button type="button" class="student-btn student-btn-outline" id="btn-modal-close-action">Close</button>
            <button type="button" class="student-btn student-btn-outline" id="btn-modal-copy-action">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy Verification Text</span>
            </button>
            <button type="button" class="student-btn student-btn-primary" id="btn-modal-download-action">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind Event Listeners
    const searchInput = container.querySelector('#cert-search-input');
    searchInput?.addEventListener('input', (e) => {
      certSearch = e.target.value;
      render();
      const newInput = container.querySelector('#cert-search-input');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(newInput.value.length, newInput.value.length);
      }
    });

    container.querySelector('#cert-sort-select')?.addEventListener('change', (e) => {
      certSort = e.target.value;
      render();
    });

    const clearCertFilters = () => {
      certSearch = '';
      certSort = 'newest';
      render();
    };
    container.querySelector('#btn-clear-cert-filters')?.addEventListener('click', clearCertFilters);
    container.querySelector('#btn-empty-clear-cert')?.addEventListener('click', clearCertFilters);

    container.querySelectorAll('.btn-view-cert').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const proj = projects.find(p => p.id === id);
        if (proj) {
          activeCertificate = proj;
          showModal(proj);
        }
      });
    });

    container.querySelectorAll('.btn-download-cert').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.dataset.id);
        const proj = projects.find(p => p.id === id);
        if (proj) {
          downloadCertificatePdf(proj, e.currentTarget);
        }
      });
    });

    // Copy certificate verification details
    container.querySelectorAll('.btn-copy-cert-info').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const proj = projects.find(p => p.id === id);
        if (proj) {
          copyCertSummary(proj);
        }
      });
    });

    const modal = container.querySelector('#cert-preview-modal');
    const closeBtn = container.querySelector('#btn-close-modal');
    const closeActionBtn = container.querySelector('#btn-modal-close-action');
    const downloadActionBtn = container.querySelector('#btn-modal-download-action');
    const copyActionBtn = container.querySelector('#btn-modal-copy-action');

    const hideModal = () => {
      modal.style.display = 'none';
      activeCertificate = null;
    };

    closeBtn?.addEventListener('click', hideModal);
    closeActionBtn?.addEventListener('click', hideModal);
    modal?.querySelector('.student-cert-modal-overlay')?.addEventListener('click', hideModal);

    downloadActionBtn?.addEventListener('click', (e) => {
      if (activeCertificate) {
        downloadCertificatePdf(activeCertificate, e.currentTarget);
      }
    });

    copyActionBtn?.addEventListener('click', () => {
      if (activeCertificate) {
        copyCertSummary(activeCertificate);
      }
    });

    function showModal(proj) {
      container.querySelector('#modal-project-name').textContent = proj.title;
      container.querySelector('#modal-faculty-name').textContent = proj.faculty || 'Project Supervisor';
      modal.style.display = 'flex';
    }

    function copyCertSummary(proj) {
      const text = `RLabZ Academy Certificate of Completion\nRecipient: ${studentName}\nProject: ${proj.title}\nSupervisor: ${proj.faculty || 'Faculty Lead'}\nStatus: Issued & Verified`;
      navigator.clipboard?.writeText(text).then(() => {
        StudentSwal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Verification Info Copied!',
          text: `Certificate details for "${proj.title}" copied.`,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
      });
    }

    async function downloadCertificatePdf(proj, triggerBtn = null) {
      const originalHTML = triggerBtn ? triggerBtn.innerHTML : '';
      if (triggerBtn) {
        triggerBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cert-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
          <span>Generating PDF...</span>
        `;
        triggerBtn.disabled = true;
      }

      let issuedDate = '30 Sep 2026';
      if (proj.timeline) {
        const parts = proj.timeline.split(' - ');
        if (parts.length > 1) {
          issuedDate = parts[1].trim();
        }
      }

      const certNumber = proj.certificate_number || `CERT-2026-${String(proj.id || '001').padStart(3, '0')}`;
      const supervisorName = proj.faculty || 'Prof. Mathew John';

      const certElement = document.createElement('div');
      certElement.style.cssText = 'width: 820px; padding: 12px; background: var(--surface-card); box-sizing: border-box; margin: 0 auto; font-family: "Times New Roman", Times, Georgia, serif; color: #1e293b;';
      certElement.innerHTML = `
        <div style="width: 100%; background: #fdfdfa; border: 1px solid var(--border-subtle); padding: 8px; box-sizing: border-box;">
          <div style="border: 6px solid #1e293b; padding: 4px; box-sizing: border-box;">
            <div style="border: 2px solid #b45309; padding: 36px 24px; text-align: center; box-sizing: border-box; background: #fffdf9;">
              
              <div style="font-size: 14px; letter-spacing: 5px; font-weight: 700; color: #b45309; margin-bottom: 12px; text-transform: uppercase;">
                RLABZ ACADEMY
              </div>

              <div style="font-size: 28px; font-weight: 800; color: #1e293b; letter-spacing: 2px; margin-bottom: 6px; text-transform: uppercase;">
                CERTIFICATE OF COMPLETION
              </div>

              <div style="font-size: 11px; letter-spacing: 3px; color: var(--text-muted); margin-bottom: 16px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                PROUDLY PRESENTED TO
              </div>

              <div style="font-size: 30px; font-style: italic; font-weight: 700; color: var(--primary); border-bottom: 2px solid #cbd5e1; padding-bottom: 4px; margin: 0 auto 16px; display: inline-block; min-width: 260px;">
                ${studentName}
              </div>

              <div style="font-size: 14px; line-height: 1.6; color: #475569; max-width: 580px; margin: 0 auto 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                for successfully completing all requirements and active project contributions in the project
              </div>

              <div style="font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">
                ${proj.title}
              </div>

              <div style="font-size: 13.5px; line-height: 1.5; color: #475569; margin-bottom: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                under the supervision of CS Faculty and Co-ordinators.
              </div>

              <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Certificate No: <strong style="color: #1e293b;">${certNumber}</strong> &nbsp;|&nbsp; 
                Issued Date: <strong style="color: #1e293b;">${issuedDate}</strong> &nbsp;|&nbsp; 
                Status: <strong style="color: var(--primary);">Issued &amp; Verified</strong>
              </div>

              <div style="display: flex; justify-content: space-between; width: 100%; max-width: 540px; margin: 20px auto 0;">
                <div style="display: flex; flex-direction: column; align-items: center; width: 200px;">
                  <div style="width: 100%; border-top: 1px solid var(--text-secondary); margin-bottom: 6px;"></div>
                  <span style="font-size: 13px; font-weight: 700; color: #1e293b;">${supervisorName}</span>
                  <label style="font-size: 11px; color: var(--text-muted); margin-top: 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Project Supervisor</label>
                </div>

                <div style="display: flex; flex-direction: column; align-items: center; width: 200px;">
                  <div style="width: 100%; border-top: 1px solid var(--text-secondary); margin-bottom: 6px;"></div>
                  <span style="font-size: 13px; font-weight: 700; color: #1e293b;">Director, RLabZ ERP</span>
                  <label style="font-size: 11px; color: var(--text-muted); margin-top: 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Issuing Authority</label>
                </div>
              </div>

            </div>
          </div>
        </div>
      `;

      const sanitizedTitle = (proj.title || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Certificate_${sanitizedTitle}.pdf`;

      try {
        const blob = await html2pdf().set({
          margin: [0.4, 0.4, 0.4, 0.4],
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
          pagebreak: { mode: 'avoid-all' }
        }).from(certElement).output('blob');

        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

        StudentSwal.fire({
          icon: 'success',
          title: 'Certificate Downloaded!',
          text: `Official project completion certificate for "${proj.title}" downloaded successfully as PDF.`,
          timer: 3000,
          showConfirmButton: false,
          timerProgressBar: true
        });
      } catch (err) {
        console.error('Certificate PDF generation error:', err);
        StudentSwal.fire({
          icon: 'error',
          title: 'Download Failed',
          text: 'Failed to generate PDF certificate: ' + (err.message || 'Unknown error'),
        });
      } finally {
        if (triggerBtn) {
          triggerBtn.innerHTML = originalHTML;
          triggerBtn.disabled = false;
        }
      }
    }
  }

  render();
  return container;
}

export default StudentCertificates;
