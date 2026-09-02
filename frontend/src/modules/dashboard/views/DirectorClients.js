import { DirectorService } from '../services/DirectorService.js';

export function DirectorClients(route, router) {
  const container = document.createElement('div');
  container.className = 'director-dashboard';

  let activeRequirements = DirectorService.getClientRequirements() || [];

  function render() {
    container.innerHTML = `
      <div class="director-header">
        <div>
          <h1>Client Requirements & Project Intake Specs</h1>
          <p>Full visibility into client expectations, expected deliverables, timelines, and uploaded requirement documents across all projects.</p>
        </div>
        <div class="director-badge-role">
          ${activeRequirements.length} Projects Documented
        </div>
      </div>

      <div class="director-panel">
        <div class="director-panel-header">
          <h2>Client Requirements Summary</h2>
          <span style="font-size:0.85rem; color:#6b7280;">Live specifications from MySQL database</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:1.25rem;">
          ${activeRequirements.length === 0 ? `
            <p style="color:#9ca3af; text-align:center; padding:2rem;">No client requirements documented.</p>
          ` : activeRequirements.map(req => `
            <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:1.25rem;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
                <div>
                  <h3 style="margin:0; font-size:1.1rem; color:#111827;">${req.title} (${req.id})</h3>
                  <div style="color:#6b7280; font-size:0.85rem; margin-top:0.2rem;">
                    <strong>Client:</strong> ${req.clientName} (${req.clientContact}) • <strong>Source:</strong> ${req.source} (${req.sourceName})
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:700; color:#059669; font-size:1rem;">Budget: ₹${Number(req.budget || 0).toLocaleString('en-IN')}</div>
                  <div style="font-size:0.775rem; color:#6b7280;">Timeline: ${req.timeline}</div>
                </div>
              </div>

              ${req.requirements ? `
                <div style="margin-top:0.5rem; margin-bottom:0.75rem; font-size:0.875rem; color:#374151; background:#ffffff; padding:0.65rem 0.85rem; border-radius:6px; border:1px solid #f3f4f6;">
                  <strong>Requirements:</strong> ${req.requirements}
                </div>
              ` : ''}

              <div style="margin-top:0.75rem;">
                <strong style="font-size:0.85rem; color:#374151;">Expected Deliverables:</strong>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.35rem;">
                  ${(req.deliverables || []).map(d => `<span style="background:#e0f2fe; color:#0369a1; padding:0.25rem 0.6rem; border-radius:6px; font-size:0.775rem; font-weight:600;">✓ ${d}</span>`).join('')}
                </div>
              </div>

              <div style="margin-top:0.75rem; display:flex; align-items:center; justify-content:space-between; pt-0.5rem; border-top:1px solid #f3f4f6;">
                <div style="font-size:0.8rem; color:#6b7280;">
                  📁 Attached Client Documents: <strong>${(req.docs || ['requirements.pdf']).join(', ')}</strong>
                </div>
                <button class="btn-director btn-director-outline btn-preview-doc" style="font-size:0.75rem;" data-doc="${(req.docs || ['requirements.pdf'])[0]}">
                  Preview Requirement Document
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.btn-preview-doc').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const doc = e.target.getAttribute('data-doc');
        alert('Viewing document preview for ' + doc);
      });
    });
  }

  // Instant 0ms render
  render();

  // Async background fetch from MySQL
  DirectorService.getClientRequirementsAsync().then(liveReqs => {
    if (liveReqs && liveReqs.length > 0) {
      activeRequirements = liveReqs;
      render();
    }
  });

  return container;
}

export default DirectorClients;
