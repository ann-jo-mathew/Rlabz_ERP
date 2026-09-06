import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';
import html2pdf from 'html2pdf.js';

export async function InvoicesBills(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const fmtDate = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ─── Build A4-safe invoice HTML ──────────────────────────────
  const buildInvoiceHTML = (inv) => {
    const amountBeforeGst = inv.amount_before_gst || 0;
    const gstAmt = inv.gst_amount || 0;
    const grandTotal = inv.grand_total || 0;
    const collected = inv.total_paid || 0;
    const outstanding = inv.pending_amount || 0;
    const proj = inv.project_finance?.project || {};

    const paymentsHtml = (inv.client_payments || []).length > 0 ? `
        <!-- PAYMENT HISTORY TABLE -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:24px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th colspan="4" style="padding:10px 14px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:#64748b; border-bottom:2px solid #e2e8f0; font-weight:700;">Payment History</th>
            </tr>
            <tr style="background:#f8fafc;">
              <th style="padding:8px 14px; text-align:left; font-size:10px; color:#64748b; border-bottom:1px solid #e2e8f0;">Date</th>
              <th style="padding:8px 14px; text-align:left; font-size:10px; color:#64748b; border-bottom:1px solid #e2e8f0;">Method</th>
              <th style="padding:8px 14px; text-align:left; font-size:10px; color:#64748b; border-bottom:1px solid #e2e8f0;">Ref</th>
              <th style="padding:8px 14px; text-align:right; font-size:10px; color:#64748b; border-bottom:1px solid #e2e8f0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${inv.client_payments.map(pay => `
            <tr>
              <td style="padding:8px 14px; border-bottom:1px solid #e2e8f0; font-size:12px;">${fmtDate(pay.payment_date)}</td>
              <td style="padding:8px 14px; border-bottom:1px solid #e2e8f0; font-size:12px;">${pay.payment_method || '-'}</td>
              <td style="padding:8px 14px; border-bottom:1px solid #e2e8f0; font-size:12px;">${pay.payment_reference || '-'}</td>
              <td style="padding:8px 14px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:600; font-size:12px;">${fmt(pay.amount)}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
    ` : '';

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
                  <td style="font-weight:700; font-family:monospace; padding-bottom:3px;">${inv.invoice_number}</td>
                </tr>
                <tr>
                  <td style="color:#888; padding-right:12px; text-align:right; padding-bottom:3px;">Date:</td>
                  <td style="font-weight:600; padding-bottom:3px;">${fmtDate(inv.invoice_date)}</td>
                </tr>
                <tr>
                  <td style="color:#888; padding-right:12px; text-align:right; padding-bottom:3px;">Due Date:</td>
                  <td style="font-weight:600; padding-bottom:3px;">${fmtDate(inv.due_date)}</td>
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
              <div style="font-size:15px; font-weight:700;">${proj.client_name || '-'}</div>
            </td>
            <td style="vertical-align:top; text-align:right;">
              <div style="font-size:10px; text-transform:uppercase; color:#888; letter-spacing:0.08em; margin-bottom:5px;">Project</div>
              <div style="font-size:15px; font-weight:700;">${proj.title || '-'}</div>
            </td>
          </tr>
        </table>

        <!-- TOTALS TABLE -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td></td>
            <td style="width:300px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
                <tr>
                  <td style="padding:6px 12px; color:#555;">Subtotal (Ex. GST)</td>
                  <td style="padding:6px 12px; text-align:right; font-weight:600;">${fmt(amountBeforeGst)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 12px; color:#555;">GST (${inv.gst_percentage}%)</td>
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
        
        ${paymentsHtml}

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
                <th>Project</th>
                <th>Client</th>
                <th>Amount (Ex. GST)</th>
                <th>GST</th>
                <th>Grand Total</th>
                <th style="color:var(--primary)">Total Paid</th>
                <th style="color:var(--warning-text)">Remaining Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(inv => {
                const proj = inv.project_finance?.project || {};
                return `
                <tr>
                  <td style="font-family:monospace;font-size:0.8rem;font-weight:700;">${inv.invoice_number || 'INV-NA'}</td>
                  <td style="white-space:nowrap;">${fmtDate(inv.invoice_date)}</td>
                  <td><div style="font-weight:600">${proj.title || 'Unknown'}</div></td>
                  <td style="color:var(--text-muted)">${proj.client_name || '-'}</td>
                  <td>${fmt(inv.amount_before_gst || 0)}</td>
                  <td>${fmt(inv.gst_amount || 0)}</td>
                  <td style="font-weight:700">${fmt(inv.grand_total || 0)}</td>
                  <td style="color:var(--primary);font-weight:700">${fmt(inv.total_paid || 0)}</td>
                  <td style="color:var(--warning-text);font-weight:700">${fmt(inv.pending_amount || 0)}</td>
                  <td><span class="fin-badge ${inv.status === 'Paid' ? 'success' : 'warning'}">${inv.status}</span></td>
                  <td>
                    <div style="display:flex; gap:0.5rem">
                      <button class="fin-btn outline sm download-btn" data-id="${inv.id}">PDF</button>
                      ${(inv.client_payments || []).length > 0 ? `<button class="fin-btn outline sm history-btn" data-id="${inv.id}">History</button>` : ''}
                      ${inv.status !== 'Paid' ? `<button class="fin-btn primary sm pay-btn" data-id="${inv.id}" data-pending="${inv.pending_amount}">Record Pay</button>` : ''}
                    </div>
                  </td>
                </tr>
              `}).join('')}
              ${invoices.length === 0 ? '<tr><td colspan="11" style="text-align:center;color:var(--text-muted);padding:2rem">No invoices found</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const bindEvents = () => {
      // PDF generation
      container.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const invId = parseInt(btn.dataset.id);
          const inv = invoices.find(i => i.id === invId);
          
          const originalHTML = btn.innerHTML;
          btn.innerHTML = '...';
          btn.disabled = true;

          try {
            const htmlContent = buildInvoiceHTML(inv);
            const wrapper = document.createElement('div');
            wrapper.innerHTML = htmlContent;

            const opt = {
              margin: [0.5, 0.5, 0.5, 0.5],
              filename: `${inv.invoice_number}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true, width: 794 },
              jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
              pagebreak: { mode: 'css', avoid: 'tr' }
            };

            await html2pdf().set(opt).from(wrapper).save();
          } catch (err) {
            alert('Failed to generate PDF: ' + err.message);
          } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
          }
        });
      });
      
      // Payment History Modal
      container.querySelectorAll('.history-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const invId = parseInt(btn.dataset.id);
          const inv = invoices.find(i => i.id === invId);
          const payments = inv.client_payments || [];
          
          const modal = document.createElement('div');
          modal.className = 'fin-modal-overlay';
          modal.innerHTML = `
            <div class="fin-modal" style="max-width:500px">
              <h3 style="margin:0 0 1rem">Payment History - ${inv.invoice_number}</h3>
              <table class="fin-table" style="font-size:0.85rem">
                <thead><tr><th>Date</th><th>Method</th><th>Ref</th><th>Remarks</th><th>Amount</th></tr></thead>
                <tbody>
                  ${payments.map(p => `<tr>
                    <td>${fmtDate(p.payment_date)}</td>
                    <td>${p.payment_method || '-'}</td>
                    <td>${p.payment_reference || '-'}</td>
                    <td>${p.remarks || '-'}</td>
                    <td style="font-weight:700">${fmt(p.amount)}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
              <div class="fin-form-actions" style="margin-top:1.5rem">
                <button class="fin-btn outline" id="close-history">Close</button>
              </div>
            </div>
          `;
          document.body.appendChild(modal);
          modal.querySelector('#close-history').addEventListener('click', () => modal.remove());
        });
      });

      // Record Payment
      container.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const invId = parseInt(btn.dataset.id);
          const pending = parseFloat(btn.dataset.pending) || 0;
          
          const modal = document.createElement('div');
          modal.className = 'fin-modal-overlay';
          modal.innerHTML = `
            <div class="fin-modal">
              <h3 style="margin:0 0 1rem">Record Client Payment</h3>
              <div class="fin-form-group">
                <label>Amount (Max: ${fmt(pending)})</label>
                <input type="number" class="fin-input" id="cp-amt" value="${pending}" max="${pending}">
              </div>
              <div class="fin-form-group">
                <label>Payment Date</label>
                <input type="date" class="fin-input" id="cp-date" value="${new Date().toISOString().split('T')[0]}">
              </div>
              <div class="fin-form-group">
                <label>Payment Method</label>
                <input type="text" class="fin-input" id="cp-method" placeholder="e.g. Bank Transfer, UPI">
              </div>
              <div class="fin-form-group">
                <label>Transaction Reference</label>
                <input type="text" class="fin-input" id="cp-ref" placeholder="Txn ID">
              </div>
              <div class="fin-form-group">
                <label>Remarks (Optional)</label>
                <input type="text" class="fin-input" id="cp-remarks" placeholder="Any remarks">
              </div>
              <div class="fin-form-actions" style="margin-top:1rem">
                <button class="fin-btn primary" id="confirm-cp">Save Payment</button>
                <button class="fin-btn outline" id="cancel-cp">Cancel</button>
              </div>
            </div>
          `;
          document.body.appendChild(modal);

          modal.querySelector('#cancel-cp').addEventListener('click', () => modal.remove());
          modal.querySelector('#confirm-cp').addEventListener('click', async () => {
            const amt = parseFloat(modal.querySelector('#cp-amt').value);
            if (!amt || amt <= 0 || amt > pending) { alert('Invalid amount. Must be between 1 and ' + pending); return; }
            
            try {
              const res = await financeService.recordClientPayment({
                invoice_id: invId,
                amount: amt,
                payment_date: modal.querySelector('#cp-date').value,
                payment_method: modal.querySelector('#cp-method').value,
                payment_reference: modal.querySelector('#cp-ref').value,
                remarks: modal.querySelector('#cp-remarks').value
              });
              
              if (res && res.message && !res.payment) {
                 alert('Error: ' + res.message); 
                 return;
              }
              modal.remove();
              // Reload page or re-render
              window.location.reload();
            } catch(e) {
              alert('Payment failed: ' + e.message);
            }
          });
        });
      });
    };
    
    bindEvents();

  } catch (e) {
    container.innerHTML = `<div class="alert-error">Failed to load invoices: ${e.message}</div>`;
  }

  return container;
}

export default InvoicesBills;
