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
  container.className = 'student-portal-container animate-fade-in';

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
      // Date comparison based on timeline end
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
              <span class="student-badge student-badge-success">Issued & Verified</span>
            </div>
            <div class="cert-detail-item">
              <span class="cert-detail-lbl">Supervisor:</span>
              <span class="cert-detail-val">${p.faculty || 'Faculty Lead'}</span>
            </div>
            <div class="cert-detail-item">
              <span class="cert-detail-lbl">Role Track:</span>
              <span class="cert-detail-val">${p.designation || 'Specialist'}</span>
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
              Download PDF
            </button>
            <button class="student-action-icon-btn btn-copy-cert-info" data-id="${p.id}" title="Copy Certificate Verification ID">
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
      <div class="student-header">
        <h1>My Certificates</h1>
        <p>View, verify, and download official project completion certificates issued by the academy.</p>
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
        <!-- Filter & Search Bar -->
        <div class="student-filter-bar">
          <div class="student-search-wrapper">
            <svg class="student-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="cert-search-input" class="student-search-input" placeholder="Search certificates by project, supervisor, or track..." value="${certSearch}">
          </div>

          <select id="cert-sort-select" class="student-filter-select">
            <option value="newest" ${certSort === 'newest' ? 'selected' : ''}>Sort: Newest Issued</option>
            <option value="oldest" ${certSort === 'oldest' ? 'selected' : ''}>Sort: Oldest</option>
            <option value="alpha" ${certSort === 'alpha' ? 'selected' : ''}>Sort: Alphabetical</option>
          </select>

          ${isFiltersActive ? `
            <button type="button" id="btn-clear-cert-filters" class="student-filter-btn-clear" title="Reset filters">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              Reset
            </button>
          ` : ''}
        </div>

        ${filteredCertificates.length === 0 ? `
          <div class="student-card">
            <div class="student-empty-filter">
              <div class="student-empty-filter-icon">🔍</div>
              <div class="student-empty-filter-text">No certificates match your search query</div>
              <div class="student-empty-filter-sub">Try searching by a different project title or clear the filter.</div>
              <button type="button" id="btn-empty-clear-cert" class="student-btn student-btn-outline student-btn-sm" style="margin: 0 auto;">
                Clear Search
              </button>
            </div>
          </div>
        ` : `
          <div class="cert-grid-student">
            ${certificateCards}
          </div>
        `}
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
            <button class="student-btn student-btn-outline" id="btn-modal-copy-action">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy Verification Text
            </button>
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
    modal?.querySelector('.cert-modal-overlay')?.addEventListener('click', hideModal);

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

      // Format issued date
      let issuedDate = '30 Sep 2026';
      if (proj.timeline) {
        const parts = proj.timeline.split(' - ');
        if (parts.length > 1) {
          issuedDate = parts[1].trim();
        }
      }

      const certNumber = proj.certificate_number || `CERT-2026-${String(proj.id || '001').padStart(3, '0')}`;
      const supervisorName = proj.faculty || 'Prof. Mathew John';

      // Build certificate element matching the exact format shown in the UI modal
      const certElement = document.createElement('div');
      certElement.style.cssText = 'width: 820px; padding: 12px; background: #ffffff; box-sizing: border-box; margin: 0 auto; font-family: "Times New Roman", Times, Georgia, serif; color: #1e293b;';
      certElement.innerHTML = `
        <div style="width: 100%; background: #fdfdfa; border: 1px solid #e2e8f0; padding: 8px; box-sizing: border-box;">
          <div style="border: 6px solid #1e293b; padding: 4px; box-sizing: border-box;">
            <div style="border: 2px solid #b45309; padding: 36px 24px; text-align: center; box-sizing: border-box; background: #fffdf9;">
              
              <div style="font-size: 14px; letter-spacing: 5px; font-weight: 700; color: #b45309; margin-bottom: 12px; text-transform: uppercase;">
                RLABZ ACADEMY
              </div>

              <div style="font-size: 28px; font-weight: 800; color: #1e293b; letter-spacing: 2px; margin-bottom: 6px; text-transform: uppercase;">
                CERTIFICATE OF COMPLETION
              </div>

              <div style="font-size: 11px; letter-spacing: 3px; color: #64748b; margin-bottom: 16px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                PROUDLY PRESENTED TO
              </div>

              <div style="font-size: 30px; font-style: italic; font-weight: 700; color: #059669; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px; margin: 0 auto 16px; display: inline-block; min-width: 260px;">
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

              <div style="font-size: 11px; color: #64748b; margin-bottom: 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Certificate No: <strong style="color: #1e293b;">${certNumber}</strong> &nbsp;|&nbsp; 
                Issued Date: <strong style="color: #1e293b;">${issuedDate}</strong> &nbsp;|&nbsp; 
                Status: <strong style="color: #059669;">Issued &amp; Verified</strong>
              </div>

              <div style="display: flex; justify-content: space-between; width: 100%; max-width: 540px; margin: 20px auto 0;">
                <div style="display: flex; flex-direction: column; align-items: center; width: 200px;">
                  <div style="width: 100%; border-top: 1px solid #94a3b8; margin-bottom: 6px;"></div>
                  <span style="font-size: 13px; font-weight: 700; color: #1e293b;">${supervisorName}</span>
                  <label style="font-size: 11px; color: #64748b; margin-top: 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Project Supervisor</label>
                </div>

                <div style="display: flex; flex-direction: column; align-items: center; width: 200px;">
                  <div style="width: 100%; border-top: 1px solid #94a3b8; margin-bottom: 6px;"></div>
                  <span style="font-size: 13px; font-weight: 700; color: #1e293b;">Director, RLabZ ERP</span>
                  <label style="font-size: 11px; color: #64748b; margin-top: 2px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Issuing Authority</label>
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

        // Download via native Blob URL to prevent Chrome blocking large data-URIs
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
