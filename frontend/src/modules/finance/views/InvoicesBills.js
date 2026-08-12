import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';
import html2pdf from 'html2pdf.js';

export async function InvoicesBills(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  // ─── Build A4-safe invoice HTML ──────────────────────────────
  const buildInvoiceHTML = (inv, p) => {
    const devTotal = p.dev_student + p.dev_faculty + p.dev_rlabz;
    const hostTotal = p.host_ssl + p.host_domain + p.host_api;
    const maintenanceTotal = p.maintenance_support;

    const subtotal = devTotal + hostTotal + maintenanceTotal;
    const gstAmt = subtotal * financeService.gstRate;
    const grandTotal = subtotal + gstAmt;

    const projPayments = financeService.clientPayments.filter(
      pay => pay.projectId === p.id && pay.status === 'Confirmed'
    );
    const collected = projPayments.reduce((sum, pay) => sum + pay.amount, 0);
    const outstanding = Math.max(0, grandTotal - collected);

    // Use table-based layout for A4 compatibility (avoid flex/grid in pdf)
    return `
      <div style="
        font-family: Arial, sans-serif;
        color: #1a1a1a;
        font-size: 13px;
        width: 680px;
        margin: 0 auto;
        padding: 0;
      ">
        <!-- HEADER: two-column table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 3px solid #059669; padding-bottom: 18px; margin-bottom: 24px;">
          <tr>
            <td style="vertical-align:top;">
              <div style="font-size:26px; font-weight:900; color:#059669; letter-spacing:-0.5px; margin-bottom:4px;">RLabZ</div>
              <div style="font-size:12px; color:#666; line-height:1.7;">
                Modular Enterprise Resource Planning<br>
                Rajagiri College of Social Sciences<br>
                Kochi, Kerala – India
              </div>
            </td>
            <td style="vertical-align:top; text-align:right;">
              <div style="font-size:20px; font-weight:800; color:#1a1a1a; margin-bottom:8px;">
                ${inv.status === 'Paid' ? 'RECEIPT' : 'INVOICE'}
              </div>
              <table cellpadding="0" cellspacing="0" style="margin-left:auto; font-size:12px;">
                <tr>
                  <td style="color:#888; padding-right:12px; text-align:right; padding-bottom:3px;">Invoice No:</td>
                  <td style="font-weight:700; font-family:monospace; padding-bottom:3px;">${inv.id}</td>
                </tr>
                <tr>
                  <td style="color:#888; padding-right:12px; text-align:right; padding-bottom:3px;">Date:</td>
                  <td style="font-weight:600; padding-bottom:3px;">${inv.date}</td>
                </tr>
                <tr>
                  <td style="color:#888; padding-right:12px; text-align:right; padding-bottom:3px;">Due Date:</td>
                  <td style="font-weight:600; padding-bottom:3px;">${inv.dueDate}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- BILL TO + PROJECT: two-column table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="vertical-align:top; width:50%;">
              <div style="font-size:10px; text-transform:uppercase; color:#888; letter-spacing:0.08em; margin-bottom:5px;">Bill To</div>
              <div style="font-size:15px; font-weight:700;">${inv.client}</div>
            </td>
            <td style="vertical-align:top; text-align:right;">
              <div style="font-size:10px; text-transform:uppercase; color:#888; letter-spacing:0.08em; margin-bottom:5px;">Project</div>
              <div style="font-size:15px; font-weight:700;">${inv.projectName}</div>
            </td>
          </tr>
        </table>

        <!-- LINE ITEMS TABLE -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:24px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:10px 14px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:#64748b; border-bottom:2px solid #e2e8f0; font-weight:700;">Description</th>
              <th style="padding:10px 14px; text-align:right; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:#64748b; border-bottom:2px solid #e2e8f0; font-weight:700; width:160px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:12px 14px; border-bottom:1px solid #e2e8f0; font-size:13px;">Development Charges</td>
              <td style="padding:12px 14px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:600; font-size:13px;">${fmt(devTotal)}</td>
            </tr>
            <tr>
              <td style="padding:12px 14px; border-bottom:1px solid #e2e8f0; font-size:13px;">
                Hosting Charges
                <span style="font-size:11px; color:#888; margin-left:6px;">(Domain, SSL${p.host_api > 0 ? ', API' : ''})</span>
              </td>
              <td style="padding:12px 14px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:600; font-size:13px;">${fmt(hostTotal)}</td>
            </tr>
            ${maintenanceTotal > 0 ? `
            <tr>
              <td style="padding:12px 14px; border-bottom:1px solid #e2e8f0; font-size:13px;">Maintenance & Annual Support</td>
              <td style="padding:12px 14px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:600; font-size:13px;">${fmt(maintenanceTotal)}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>

        <!-- TOTALS TABLE -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td></td>
            <td style="width:300px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
                <tr>
                  <td style="padding:6px 12px; color:#555;">Subtotal (Ex. GST)</td>
                  <td style="padding:6px 12px; text-align:right; font-weight:600;">${fmt(subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 12px; color:#555;">GST (${financeService.gstRate * 100}% — mock)</td>
                  <td style="padding:6px 12px; text-align:right; font-weight:600;">${fmt(gstAmt)}</td>
                </tr>
                <tr style="border-top:2px solid #059669;">
                  <td style="padding:10px 12px; font-size:15px; font-weight:800;">Grand Total</td>
                  <td style="padding:10px 12px; text-align:right; font-size:16px; font-weight:800; color:#059669;">${fmt(grandTotal)}</td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0;">
                  <td style="padding:6px 12px; color:#555;">Amount Received</td>
                  <td style="padding:6px 12px; text-align:right; font-weight:600; color:#059669;">${fmt(collected)}</td>
                </tr>
                ${outstanding > 0 ? `
                <tr>
                  <td style="padding:6px 12px; color:#e53e3e; font-weight:700;">Outstanding Balance</td>
                  <td style="padding:6px 12px; text-align:right; font-weight:800; color:#e53e3e;">${fmt(outstanding)}</td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
        </table>

        <!-- PAYMENT STATUS BLOCK -->
        <div style="
          background: ${inv.status === 'Paid' ? '#ecfdf5' : '#fffbeb'};
          border: 1px solid ${inv.status === 'Paid' ? '#a7f3d0' : '#fde68a'};
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 24px;
        ">
          <div style="font-size:10px; text-transform:uppercase; color:#888; letter-spacing:0.08em; margin-bottom:6px;">Payment Status</div>
          <div style="font-size:16px; font-weight:800; color:${inv.status === 'Paid' ? '#059669' : '#d97706'};">
            ${inv.status.toUpperCase()}
          </div>
          ${inv.status === 'Paid' ? `
          <div style="font-size:12px; color:#065f46; margin-top:6px; line-height:1.8;">
            Paid on: <strong>${inv.paymentDate}</strong>&nbsp;&nbsp;|&nbsp;&nbsp;
            Ref: <strong style="font-family:monospace;">${inv.txRef}</strong>
          </div>
          ` : ''}
        </div>

        <!-- FOOTER -->
        <div style="text-align:center; font-size:10px; color:#bbb; border-top:1px solid #e2e8f0; padding-top:12px;">
          This is a system-generated invoice from RLabZ ERP. For queries contact finance@rlabz.in
        </div>
      </div>
    `;
  };

  try {
    const invoices = await financeService.getInvoices();

    container.innerHTML = `
      <div class="fin-page-header">
        <div>
          <h1>Client Invoices & Bills</h1>
          <p>Manage project billing and generate professional PDFs</p>
        </div>
      </div>

      <div class="fin-panel">
        <div class="fin-panel-header">
          <div class="fin-panel-title">Invoices Ledger</div>
        </div>
        <div class="fin-table-wrap">
          <table class="fin-table">
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Project</th>
                <th>Client</th>
                <th>Amount (Ex. GST)</th>
                <th>Grand Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(inv => `
                <tr>
                  <td style="font-family:monospace;font-size:0.8rem;font-weight:700;">${inv.id}</td>
                  <td style="white-space:nowrap;">${inv.date}</td>
                  <td style="white-space:nowrap;color:var(--text-muted)">${inv.dueDate}</td>
                  <td><div style="font-weight:600">${inv.projectName}</div></td>
                  <td style="color:var(--text-muted)">${inv.client}</td>
                  <td>${fmt(inv.subtotal)}</td>
                  <td style="font-weight:700">${fmt(inv.grandTotal)}</td>
                  <td><span class="fin-badge ${inv.status === 'Paid' ? 'success' : 'warning'}">${inv.status}</span></td>
                  <td>
                    <button class="fin-btn outline sm download-btn" data-id="${inv.id}">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      PDF
                    </button>
                  </td>
                </tr>
              `).join('')}
              ${invoices.length === 0 ? '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:2rem">No invoices found</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // PDF generation
    container.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const invId = btn.dataset.id;
        const inv = invoices.find(i => i.id === invId);
        if (!inv || !inv.projectData) return;

        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span class="fin-spinner" style="border-color:rgba(0,0,0,0.15);border-top-color:#333;"></span>';
        btn.disabled = true;

        try {
          const htmlContent = buildInvoiceHTML(inv, inv.projectData);
          const wrapper = document.createElement('div');
          wrapper.innerHTML = htmlContent;

          const opt = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `${inv.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              logging: false,
              letterRendering: true,
              width: 794 // A4 width at 96dpi
            },
            jsPDF: {
              unit: 'in',
              format: 'a4',
              orientation: 'portrait'
            },
            pagebreak: { mode: 'css', avoid: 'tr' }
          };

          await html2pdf().set(opt).from(wrapper).save();
        } catch (err) {
          console.error('PDF generation error:', err);
          alert('Failed to generate PDF: ' + err.message);
        } finally {
          btn.innerHTML = originalHTML;
          btn.disabled = false;
        }
      });
    });

  } catch (e) {
    container.innerHTML = `<div class="alert-error">Failed to load invoices: ${e.message}</div>`;
  }

  return container;
}

export default InvoicesBills;
