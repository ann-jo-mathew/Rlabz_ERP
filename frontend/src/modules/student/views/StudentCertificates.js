import { renderStudentSidebar } from './StudentSidebar.js';
import { getProjects, ensureDataLoaded } from './studentStore.js';
import { useAuthStore } from '@/core/stores/auth.js';
import '../student.css';

export async function StudentCertificates(route, router) {
  await ensureDataLoaded();
  renderStudentSidebar();

  const container = document.createElement('div');
  container.className = 'student-portal-container animate-fade-in';

  const authStore = useAuthStore();
  const studentName = authStore.user?.name || 'Student Nova';

  // Modal State
  let activeCertificate = null;

  function render() {
    const projects = getProjects() || [];
    
    // Only completed projects that student is part of
    const completedProjects = projects.filter(p => {
      const isCompleted = p.status === 'Completed';
      const isMember = p.members && p.members.toLowerCase().includes(studentName.toLowerCase());
      return isCompleted && isMember;
    });

    const certificateCards = completedProjects.map(p => {
      // Parse dates or use default
      let issuedDate = '30 Sep 2026';
      if (p.timeline) {
        const parts = p.timeline.split(' - ');
        if (parts.length > 1) {
          issuedDate = parts[1]; // End of timeline
        }
      }

      return `
        <div class="cert-card-premium" data-id="${p.id}">
          <div class="cert-card-decoration"></div>
          <div class="cert-card-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" style="margin-bottom: 8px;">
              <circle cx="12" cy="8" r="7"></circle>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
            <span class="cert-badge-type">Project Completion Certificate</span>
          </div>
          <h3 class="cert-project-title">${p.title}</h3>
          
          <div class="cert-details-grid">
            <div class="cert-detail-item">
              <span class="cert-detail-lbl">Issued Date:</span>
              <span class="cert-detail-val">${issuedDate}</span>
            </div>
            <div class="cert-detail-item">
              <span class="cert-detail-lbl">Status:</span>
              <span class="student-badge student-badge-success">Issued</span>
            </div>
          </div>

          <div class="cert-actions-row">
            <button class="student-btn student-btn-outline student-btn-sm btn-view-cert" data-id="${p.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              View
            </button>
            <button class="student-btn student-btn-primary student-btn-sm btn-download-cert" data-id="${p.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="student-header">
        <h1>My Certificates</h1>
        <p>View and download official project completion certificates issued by the academy.</p>
      </div>

      ${completedProjects.length === 0 ? `
        <div class="student-card" style="text-align: center; padding: 48px 24px;">
          <div style="font-size: 3rem; margin-bottom: 16px;">🎓</div>
          <h3>No Certificates Available</h3>
          <p style="color: var(--text-muted); max-width: 400px; margin: 8px auto 0;">
            Certificates are automatically generated and issued once your assigned projects are marked as "Completed".
          </p>
        </div>
      ` : `
        <div class="cert-grid-student">
          ${certificateCards}
        </div>
      `}

      <!-- Certificate Preview Modal -->
      <div class="cert-modal" id="cert-preview-modal" style="display: none;">
        <div class="cert-modal-overlay"></div>
        <div class="cert-modal-content">
          <button class="cert-modal-close" id="btn-close-modal">&times;</button>
          <div class="cert-modal-body">
            <div class="cert-framed-document">
              <div class="cert-border-outer">
                <div class="cert-border-inner">
                  <div class="cert-logo">RLABZ ACADEMY</div>
                  <div class="cert-title">CERTIFICATE OF COMPLETION</div>
                  <div class="cert-subtitle">PROUDLY PRESENTED TO</div>
                  <div class="cert-recipient">${studentName}</div>
                  <div class="cert-text">
                    for successfully completing all requirements and active project contributions in the project
                  </div>
                  <div class="cert-project-name" id="modal-project-name">CMS Academic Module</div>
                  <div class="cert-text">
                    under the supervision of CS Faculty and Co-ordinators.
                  </div>
                  
                  <div class="cert-footer-signatures">
                    <div class="cert-signature-box">
                      <div class="cert-sig-line"></div>
                      <span id="modal-faculty-name">Prof. Mathew John</span>
                      <label>Project Supervisor</label>
                    </div>
                    <div class="cert-signature-box">
                      <div class="cert-sig-line"></div>
                      <span>Director, RLabZ ERP</span>
                      <label>Issuing Authority</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; width: 100%;">
            <button class="student-btn student-btn-outline" id="btn-modal-close-action">Close</button>
            <button class="student-btn student-btn-primary" id="btn-modal-download-action">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind Event Listeners
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
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const proj = projects.find(p => p.id === id);
        if (proj) {
          downloadMockCertificate(proj);
        }
      });
    });

    const modal = container.querySelector('#cert-preview-modal');
    const closeBtn = container.querySelector('#btn-close-modal');
    const closeActionBtn = container.querySelector('#btn-modal-close-action');
    const downloadActionBtn = container.querySelector('#btn-modal-download-action');

    const hideModal = () => {
      modal.style.display = 'none';
      activeCertificate = null;
    };

    closeBtn?.addEventListener('click', hideModal);
    closeActionBtn?.addEventListener('click', hideModal);
    modal?.querySelector('.cert-modal-overlay')?.addEventListener('click', hideModal);

    downloadActionBtn?.addEventListener('click', () => {
      if (activeCertificate) {
        downloadMockCertificate(activeCertificate);
      }
    });

    function showModal(proj) {
      container.querySelector('#modal-project-name').textContent = proj.title;
      container.querySelector('#modal-faculty-name').textContent = proj.faculty || 'Project Supervisor';
      modal.style.display = 'flex';
    }

    function downloadMockCertificate(proj) {
      // Mock File Download
      const content = `========================================================\n` +
                      `               RLABZ ACADEMY - CERTIFICATE              \n` +
                      `========================================================\n\n` +
                      `Certificate of Project Completion\n\n` +
                      `Recipient:     ${studentName}\n` +
                      `Project:       ${proj.title}\n` +
                      `Status:        Issued & Verified\n` +
                      `Supervisor:    ${proj.faculty}\n` +
                      `Role:          ${proj.designation}\n` +
                      `Issued:        ${proj.timeline ? proj.timeline.split(' - ')[1] : '30 Sep 2026'}\n\n` +
                      `--------------------------------------------------------\n` +
                      `Generated by RLabZ Enterprise Resource Planning Platform\n` +
                      `========================================================\n`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${proj.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Create a premium overlay toast/alert to wow the user
      showToast(`Successfully downloaded certificate for ${proj.title}!`);
    }
  }

  function showToast(message) {
    let toast = document.querySelector('.cert-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'cert-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  render();
  return container;
}

export default StudentCertificates;
