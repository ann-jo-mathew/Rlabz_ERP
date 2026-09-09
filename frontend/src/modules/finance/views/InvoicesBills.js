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

  // Helper: Convert number to Indian Rupee Words
  const numberToWordsINR = (num) => {
    if (num === null || num === undefined || isNaN(num)) return 'Zero Rupees Only';
    let n = Math.floor(Math.abs(num));
    if (n === 0) return 'Zero Rupees Only';

    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertChunk = (val) => {
      let str = '';
      if (val >= 100) {
        str += units[Math.floor(val / 100)] + ' Hundred ';
        val %= 100;
      }
      if (val >= 20) {
        str += tens[Math.floor(val / 10)] + ' ';
        val %= 10;
      }
      if (val > 0) {
        str += units[val] + ' ';
      }
      return str;
    };

    let result = '';
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const hundred = n;

    if (crore > 0) result += convertChunk(crore) + 'Crore ';
    if (lakh > 0) result += convertChunk(lakh) + 'Lakh ';
    if (thousand > 0) result += convertChunk(thousand) + 'Thousand ';
    if (hundred > 0) result += convertChunk(hundred);

    return result.trim() + ' Rupees Only';
  };

  // ─── Build A4-safe invoice HTML ──────────────────────────────
  const buildInvoiceHTML = (inv) => {
    const amountBeforeGst = inv.amount_before_gst || 0;
    const gstAmt = inv.gst_amount || 0;
    const grandTotal = inv.grand_total || 0;
    const collected = inv.total_paid || 0;
    const outstanding = inv.pending_amount || 0;
    const proj = inv.project_finance?.project || {};

    const items = (inv.items && inv.items.length > 0)
      ? inv.items
      : [{ description: inv.description || 'Project Development Services', rate: amountBeforeGst, quantity: 1, amount: amountBeforeGst }];

    const itemsHtml = items.map((item, idx) => `
      <tr>
        <td style="padding:8px 10px; border-bottom:1px solid #e2e8f0; font-size:11px; text-align:center; color:#555;">${idx + 1}</td>
        <td style="padding:8px 10px; border-bottom:1px solid #e2e8f0; font-size:12px; font-weight:600; color:#1e293b;">${item.description || '-'}</td>
        <td style="padding:8px 10px; border-bottom:1px solid #e2e8f0; font-size:12px; text-align:right;">${fmt(item.rate)}</td>
        <td style="padding:8px 10px; border-bottom:1px solid #e2e8f0; font-size:12px; text-align:center;">${item.quantity}</td>
        <td style="padding:8px 10px; border-bottom:1px solid #e2e8f0; font-size:12px; text-align:right; font-weight:700;">${fmt(item.amount)}</td>
      </tr>
    `).join('');

    const paymentsHtml = (inv.client_payments || []).length > 0 ? `
        <!-- PAYMENT HISTORY TABLE -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:20px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th colspan="4" style="padding:8px 12px; text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:#64748b; border-bottom:2px solid #e2e8f0; font-weight:700;">Payment History</th>
            </tr>
            <tr style="background:#f8fafc;">
              <th style="padding:6px 12px; text-align:left; font-size:10px; color:#64748b; border-bottom:1px solid #e2e8f0;">Date</th>
              <th style="padding:6px 12px; text-align:left; font-size:10px; color:#64748b; border-bottom:1px solid #e2e8f0;">Method</th>
              <th style="padding:6px 12px; text-align:left; font-size:10px; color:#64748b; border-bottom:1px solid #e2e8f0;">Ref</th>
              <th style="padding:6px 12px; text-align:right; font-size:10px; color:#64748b; border-bottom:1px solid #e2e8f0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${inv.client_payments.map(pay => `
            <tr>
              <td style="padding:6px 12px; border-bottom:1px solid #e2e8f0; font-size:11px;">${fmtDate(pay.payment_date)}</td>
              <td style="padding:6px 12px; border-bottom:1px solid #e2e8f0; font-size:11px;">${pay.payment_method || '-'}</td>
              <td style="padding:6px 12px; border-bottom:1px solid #e2e8f0; font-size:11px;">${pay.payment_reference || '-'}</td>
              <td style="padding:6px 12px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:600; font-size:11px;">${fmt(pay.amount)}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
    ` : '';

    const wordsTotal = numberToWordsINR(grandTotal);

    return `
      <div style="
        position: relative;
        font-family: Arial, sans-serif;
        color: #1a1a1a;
        font-size: 12px;
        width: 680px;
        margin: 0 auto;
        padding: 0;
        overflow: hidden;
      ">

        <!-- BACKGROUND WATERMARK LAYER (z-index: 0) -->
        <!-- Asset path: frontend/public/assets/RlabZ_Watermark.png (8001x4501 px) -->
        <!-- Fine-tune: width (currently 504px) and opacity (currently 0.096) below -->
        <img
          src="/assets/RlabZ_Watermark.png"
          alt="RLabZ Watermark"
          style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 504px;
            height: auto;
            opacity: 0.096;
            pointer-events: none;
            z-index: 0;
            mix-blend-mode: multiply;
          "
          onerror="this.style.display='none'"
        />

        <!-- ALL EXISTING PDF INVOICE CONTENT (z-index: 1) -->
        <div style="position: relative; z-index: 1;">

        <!-- HEADER -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 3px solid #059669; padding-bottom: 14px; margin-bottom: 20px;">
          <tr>
            <td style="vertical-align:top;">
              <!-- Header Logo replacing the old green 'R' square icon -->
              <!-- Asset path: frontend/public/assets/RlabZ_Logo.png (4168x1668 px) -->
              <!-- Fine-tune: logo height (currently 56px) in the img style below -->
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <img
                  src="/assets/RlabZ_Logo.png"
                  alt="RLabZ Logo"
                  style="height: 56px; width: auto; object-fit: contain;"
                  onerror="this.style.display='none'"
                />
               
              </div>
              <div style="font-size:11px; color:#64748b; line-height:1.5;">
                Modular Enterprise Resource Planning<br>
                Rajagiri College of Social Sciences, Kalamassery<br>
                Kochi, Kerala – India | GSTIN: 32AAAAA0000A1Z5
              </div>
            </td>
            <td style="vertical-align:top; text-align:right;">
              <div style="font-size:22px; font-weight:800; color:#059669; margin-bottom:6px; letter-spacing:0.05em;">
                TAX INVOICE
              </div>
              <table cellpadding="0" cellspacing="0" style="margin-left:auto; font-size:11px;">
                <tr>
                  <td style="color:#64748b; padding-right:10px; text-align:right; padding-bottom:2px;">Invoice No:</td>
                  <td style="font-weight:700; font-family:monospace; padding-bottom:2px;">${inv.invoice_number}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; padding-right:10px; text-align:right; padding-bottom:2px;">Invoice Date:</td>
                  <td style="font-weight:600; padding-bottom:2px;">${fmtDate(inv.invoice_date)}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; padding-right:10px; text-align:right; padding-bottom:2px;">Due Date:</td>
                  <td style="font-weight:600; padding-bottom:2px;">${fmtDate(inv.due_date)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- ADDRESSES: FROM & BILL TO -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:12px;">
          <tr>
            <td style="vertical-align:top; width:50%; border-right:1px solid #e2e8f0; padding-right:12px;">
              <div style="font-size:9px; text-transform:uppercase; color:#64748b; letter-spacing:0.08em; font-weight:700; margin-bottom:4px;">FROM ADDRESS</div>
              <div style="font-size:13px; font-weight:700; color:#0f172a;">RLabZ Division</div>
              <div style="font-size:11px; color:#475569; line-height:1.4; margin-top:2px;">
                Rajagiri College of Social Sciences<br>
                Kalamassery, Kochi - 683104<br>
                GSTIN: 32AAAAA0000A1Z5 | Email: finance@rlabz.in
              </div>
            </td>
            <td style="vertical-align:top; width:50%; padding-left:12px;">
              <div style="font-size:9px; text-transform:uppercase; color:#64748b; letter-spacing:0.08em; font-weight:700; margin-bottom:4px;">BILL TO</div>
              <div style="font-size:13px; font-weight:700; color:#0f172a;">${proj.client_name || 'Client Name N/A'}</div>
              <div style="font-size:11px; color:#475569; line-height:1.4; margin-top:2px;">
                <strong>Project:</strong> ${proj.title || '-'}<br>
                ${proj.client_email ? `Email: ${proj.client_email}<br>` : ''}
                ${proj.client_phone ? `Phone: ${proj.client_phone}` : ''}
              </div>
            </td>
          </tr>
        </table>

        <!-- ITEMIZED TABLE -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:20px;">
          <thead>
            <tr style="background:#059669; color:#ffffff;">
              <th style="padding:8px 10px; font-size:10px; font-weight:700; text-align:center; width:35px;">SL</th>
              <th style="padding:8px 10px; font-size:10px; font-weight:700; text-align:left;">PARTICULARS</th>
              <th style="padding:8px 10px; font-size:10px; font-weight:700; text-align:right; width:100px;">RATE (₹)</th>
              <th style="padding:8px 10px; font-size:10px; font-weight:700; text-align:center; width:70px;">QTY / YRS</th>
              <th style="padding:8px 10px; font-size:10px; font-weight:700; text-align:right; width:110px;">AMOUNT (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- SUMMARY & FINANCIAL BREAKDOWN -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr>
            <td style="vertical-align:top; padding-right:15px;">
              <!-- TOTAL IN WORDS BOX -->
              <div style="padding:10px 14px;">
                <div style="font-size:9px; text-transform:uppercase; color:#64748b; letter-spacing:0.06em; font-weight:800; margin-bottom:4px;">Total Amount In Words</div>
                <div style="font-size:13px; font-weight:900; color:#059669;">${wordsTotal}</div>
              </div>
            </td>
            <td style="width:280px; vertical-align:top;">
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;">
                <tr>
                  <td style="padding:5px 8px; color:#64748b;">Subtotal (Ex. GST):</td>
                  <td style="padding:5px 8px; text-align:right; font-weight:600;">${fmt(amountBeforeGst)}</td>
                </tr>
                <tr>
                  <td style="padding:5px 8px; color:#64748b;">GST (${inv.gst_percentage || 18}%):</td>
                  <td style="padding:5px 8px; text-align:right; font-weight:600;">${fmt(gstAmt)}</td>
                </tr>
                <tr style="border-top:2px solid #059669;">
                  <td style="padding:8px 8px; font-size:14px; font-weight:800; color:#0f172a;">Grand Total:</td>
                  <td style="padding:8px 8px; text-align:right; font-size:15px; font-weight:800; color:#059669;">${fmt(grandTotal)}</td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0;">
                  <td style="padding:5px 8px; color:#64748b;">Amount Received:</td>
                  <td style="padding:5px 8px; text-align:right; font-weight:600; color:#059669;">${fmt(collected)}</td>
                </tr>
                ${outstanding > 0 ? `
                <tr>
                  <td style="padding:5px 8px; color:#dc2626; font-weight:700;">Outstanding Balance:</td>
                  <td style="padding:5px 8px; text-align:right; font-weight:800; color:#dc2626;">${fmt(outstanding)}</td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
        </table>

        ${paymentsHtml}

        <!-- REMITTANCE BOX FOOTER -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4; border:1px solid #a7f3d0; border-radius:6px; padding:12px; margin-bottom:16px;">
          <tr>
            <td style="vertical-align:top; width:50%;">
              <div style="font-size:9px; text-transform:uppercase; color:#047857; letter-spacing:0.08em; font-weight:700; margin-bottom:4px;">REMITTANCE DETAILS (BANK TRANSFER)</div>
              <div style="font-size:11px; color:#064e3b; line-height:1.5;">
                <strong>Account Name:</strong> RLabZ ERP Division<br>
                <strong>Bank Name:</strong> Federal Bank<br>
                <strong>Account Number:</strong> 12340100567890<br>
                <strong>IFSC Code:</strong> FDRL0001234
              </div>
            </td>
            <td style="vertical-align:top; width:50%; text-align:right;">
              <div style="font-size:9px; text-transform:uppercase; color:#64748b; letter-spacing:0.08em; font-weight:700; margin-bottom:4px;">STATUS</div>
              <div style="display:inline-block; padding:4px 12px; border-radius:999px; font-weight:800; font-size:12px; background:${inv.status === 'Paid' ? '#d1fae5' : '#fef3c7'}; color:${inv.status === 'Paid' ? '#065f46' : '#92400e'};">
                ${(inv.status || 'Pending').toUpperCase()}
              </div>
            </td>
          </tr>
        </table>

        <!-- FOOTER -->
        <div style="text-align:center; font-size:9px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:10px;">
          This is a computer-generated tax invoice from RLabZ ERP. For billing questions contact finance@rlabz.in
        </div>

        </div><!-- end z-index:1 content wrapper -->
      </div><!-- end relative outer container -->
    `;
  };

  try {
    let invoices = [];
    let projects = [];

    const renderTable = () => {
      container.innerHTML = `
        <div class="fin-page-header">
          <div style="display:flex; justify-content:space-between; align-items:center; width: 100%;">
            <div>
              <h1>Client Invoices & Bills</h1>
              <p>Manage project billing and generate professional PDFs</p>
            </div>
            <button class="fin-btn primary" id="create-invoice-btn" style="height: fit-content;">+ Create Invoice</button>
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
      bindEvents();
    };

    const loadInvoices = async () => {
      const tbody = container.querySelector('tbody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:3rem;color:var(--text-muted)"><span class="fin-spinner" style="margin-right:10px"></span> Loading invoices...</td></tr>`;
      } else {
        container.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:300px; color:var(--text-muted)"><span class="fin-spinner" style="margin-right:10px"></span> Loading invoices...</div>`;
      }

      try {
        invoices = await financeService.getInvoices();
        renderTable();
      } catch (e) {
        if (tbody) {
          tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:2rem;color:#ef4444">Failed to load invoices: ${e.message} <button class="fin-btn outline sm" onclick="window.location.reload()" style="margin-left:10px">Retry</button></td></tr>`;
        } else {
          container.innerHTML = `<div class="alert-error">Failed to load invoices: ${e.message}</div>`;
        }
      }
    };

    const bindEvents = () => {
      // Create Invoice Modal
      const createBtn = container.querySelector('#create-invoice-btn');
      if (createBtn) {
        createBtn.addEventListener('click', async () => {
          if (projects.length === 0) {
            projects = await financeService.getProjectFinances();
          }

          const validProjects = projects.filter(p => p.project_finance && p.project_finance.id);

          const modal = document.createElement('div');
          modal.className = 'fin-modal-overlay';
          modal.innerHTML = `
            <div class="fin-modal finance-invoice-modal">
              <h3 style="margin:0 0 1rem">Create Tax Invoice</h3>
              
              <div class="fin-form-group">
                <label>Project</label>
                <select class="fin-input" id="ci-project">
                  <option value="">Select Project</option>
                  ${validProjects.map(p => `<option value="${p.project_finance.id}" data-budget="${p.budget || 0}">${p.title} (Budget: ${fmt(p.budget || 0)})</option>`).join('')}
                </select>
              </div>

              <div id="ci-billing-caps" class="billing-caps-strip" style="display:none;">
                <div class="billing-cap-item"><span>Dev Cap:</span><strong id="cap-dev-total">₹0</strong></div>
                <div class="billing-cap-item"><span>Remaining Dev:</span><strong id="cap-dev-rem">₹0</strong></div>
                <div class="billing-cap-item"><span>Project Budget:</span><strong id="cap-proj-budget">₹0</strong></div>
              </div>

              <div style="display:flex; gap:1rem;">
                <div class="fin-form-group" style="flex:1">
                  <label>Invoice Number</label>
                  <input type="text" class="fin-input" id="ci-number" value="INV-${Date.now().toString().slice(-6)}" required>
                </div>
                <div class="fin-form-group" style="flex:1">
                  <label>GST %</label>
                  <input type="number" class="fin-input" id="ci-gst" value="18" step="0.01" required>
                </div>
              </div>

              <div style="display:flex; gap:1rem;">
                <div class="fin-form-group" style="flex:1">
                  <label>Invoice Date</label>
                  <input type="date" class="fin-input" id="ci-date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="fin-form-group" style="flex:1">
                  <label>Due Date</label>
                  <input type="date" class="fin-input" id="ci-due-date">
                </div>
              </div>

              <!-- DYNAMIC LINE ITEMS TABLE -->
              <div style="margin-top:1rem;">
                <label style="font-size:0.78rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Line Items</label>
                <table class="item-row-table">
                  <thead>
                    <tr>
                      <th style="width:45%">Particulars</th>
                      <th style="width:20%">Rate (₹)</th>
                      <th style="width:15%">Qty / Yrs</th>
                      <th style="width:20%">Amount (₹)</th>
                      <th style="width:20px"></th>
                    </tr>
                  </thead>
                  <tbody id="ci-items-body">
                  </tbody>
                </table>
                <button type="button" class="fin-btn outline sm" id="ci-add-row-btn" style="margin-bottom:1rem;">+ Add Row</button>
              </div>

              <!-- FINANCIAL BREAKDOWN -->
              <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:1rem; margin-bottom:1rem">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem; font-size:0.88rem">
                  <span style="color:var(--text-muted)">Subtotal (Ex. GST)</span>
                  <span id="ci-calc-subtotal" style="font-weight:600">₹0</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem; font-size:0.88rem">
                  <span style="color:var(--text-muted)">GST Amount</span>
                  <span id="ci-calc-gst" style="font-weight:600">₹0</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:1.05rem; border-top:1px solid #e2e8f0; padding-top:0.5rem">
                  <span style="font-weight:700">Grand Total</span>
                  <span id="ci-calc-total" style="font-weight:700; color:var(--primary)">₹0</span>
                </div>
              </div>

              <div class="fin-form-group">
                <label>Remarks / Description</label>
                <textarea class="fin-input" id="ci-desc" rows="2" placeholder="Optional notes for invoice"></textarea>
              </div>

              <div class="fin-form-actions" style="margin-top:1rem">
                <button class="fin-btn primary" id="confirm-ci">Create Invoice</button>
                <button class="fin-btn outline" id="cancel-ci">Cancel</button>
              </div>
            </div>
          `;
          document.body.appendChild(modal);

          let currentLimits = null;

          const updateCalculations = () => {
            let subtotal = 0;
            const rows = modal.querySelectorAll('.ci-item-row');
            rows.forEach(r => {
              const rate = parseFloat(r.querySelector('.ci-item-rate').value) || 0;
              const qty = parseInt(r.querySelector('.ci-item-qty').value, 10) || 1;
              const amt = rate * qty;
              r.querySelector('.ci-item-amt').value = amt.toFixed(2);
              subtotal += amt;
            });

            const gstPct = parseFloat(modal.querySelector('#ci-gst').value) || 0;
            const gstAmt = subtotal * (gstPct / 100);
            const grandTotal = subtotal + gstAmt;

            modal.querySelector('#ci-calc-subtotal').textContent = fmt(subtotal);
            modal.querySelector('#ci-calc-gst').textContent = fmt(gstAmt);
            modal.querySelector('#ci-calc-total').textContent = fmt(grandTotal);
          };

          const renderRow = (desc = '', rate = 0, qty = 1) => {
            const tr = document.createElement('tr');
            tr.className = 'ci-item-row';
            tr.innerHTML = `
              <td><input type="text" class="fin-input ci-item-desc" placeholder="e.g. Development Charges, SSL, Custom Fee" value="${desc}"></td>
              <td><input type="number" class="fin-input ci-item-rate" step="0.01" min="0" value="${rate}"></td>
              <td><input type="number" class="fin-input ci-item-qty" min="1" value="${qty}"></td>
              <td><input type="text" class="fin-input ci-item-amt" readonly value="${(rate * qty).toFixed(2)}" style="background:#f1f5f9; font-weight:600;"></td>
              <td style="text-align:center;">
                <button type="button" class="fin-btn ghost sm ci-item-remove" style="color:#ef4444; padding:2px 6px;">✕</button>
              </td>
            `;

            tr.querySelector('.ci-item-rate').addEventListener('input', updateCalculations);
            tr.querySelector('.ci-item-qty').addEventListener('input', updateCalculations);
            tr.querySelector('.ci-item-desc').addEventListener('input', updateCalculations);
            tr.querySelector('.ci-item-remove').addEventListener('click', () => {
              const rows = modal.querySelectorAll('.ci-item-row');
              if (rows.length > 1) {
                tr.remove();
                updateCalculations();
              } else {
                alert('Invoice must have at least one line item.');
              }
            });

            return tr;
          };

          const tbody = modal.querySelector('#ci-items-body');
          tbody.appendChild(renderRow('Development Charges', 0, 1));
          updateCalculations();

          modal.querySelector('#ci-add-row-btn').addEventListener('click', () => {
            tbody.appendChild(renderRow('', 0, 1));
            updateCalculations();
          });

          modal.querySelector('#ci-gst').addEventListener('input', updateCalculations);

          // Project Selection Event -> Fetch Billing Limits
          modal.querySelector('#ci-project').addEventListener('change', async (e) => {
            const pfId = e.target.value;
            const capsStrip = modal.querySelector('#ci-billing-caps');
            if (!pfId) {
              capsStrip.style.display = 'none';
              currentLimits = null;
              return;
            }
            try {
              currentLimits = await financeService.getBillingLimits(pfId);
              capsStrip.style.display = 'flex';
              modal.querySelector('#cap-dev-total').textContent = fmt(currentLimits.total_development_amount || 0);
              modal.querySelector('#cap-dev-rem').textContent = fmt(currentLimits.remaining_dev_billable || 0);
              modal.querySelector('#cap-proj-budget').textContent = fmt(currentLimits.total_project_budget || 0);
            } catch (err) {
              console.error('Failed to fetch billing limits:', err);
            }
          });

          modal.querySelector('#cancel-ci').addEventListener('click', () => modal.remove());

          modal.querySelector('#confirm-ci').addEventListener('click', async () => {
            const pfId = modal.querySelector('#ci-project').value;
            const num = modal.querySelector('#ci-number').value.trim();
            const date = modal.querySelector('#ci-date').value;
            const gst = parseFloat(modal.querySelector('#ci-gst').value);

            if (!pfId || !num || !date || isNaN(gst)) {
              alert('Please fill all required project and invoice fields correctly.');
              return;
            }

            const rows = modal.querySelectorAll('.ci-item-row');
            const items = [];
            let devItemTotal = 0;
            let subtotal = 0;

            for (const r of rows) {
              const desc = r.querySelector('.ci-item-desc').value.trim();
              const rate = parseFloat(r.querySelector('.ci-item-rate').value);
              const qty = parseInt(r.querySelector('.ci-item-qty').value, 10);

              if (!desc) {
                alert('Particulars description for each line item cannot be empty.');
                return;
              }
              if (isNaN(rate) || rate <= 0) {
                alert(`Invalid rate for line item "${desc}". Rate must be greater than 0.`);
                return;
              }
              if (isNaN(qty) || qty < 1) {
                alert(`Invalid quantity for line item "${desc}". Quantity must be at least 1.`);
                return;
              }

              const itemAmt = rate * qty;
              subtotal += itemAmt;
              items.push({ description: desc, rate, quantity: qty });

              if (desc.toLowerCase().includes('development') || desc.toLowerCase().includes('dev')) {
                devItemTotal += itemAmt;
              }
            }

            if (items.length === 0) {
              alert('Please add at least one line item.');
              return;
            }

            // Guardrail 1: Known Category (Development) limit check
            if (currentLimits && currentLimits.remaining_dev_billable !== undefined) {
              if (devItemTotal > currentLimits.remaining_dev_billable) {
                alert(`Validation Guardrail Failed:\n\nDevelopment charges in this invoice (${fmt(devItemTotal)}) exceed the remaining billable development limit (${fmt(currentLimits.remaining_dev_billable)}) for this project.`);
                return;
              }
            }

            // Guardrail 2: Overall Project Budget Cap check
            if (currentLimits && currentLimits.total_project_budget !== undefined && currentLimits.total_project_budget > 0) {
              if (subtotal > currentLimits.total_project_budget) {
                alert(`Validation Guardrail Failed:\n\nInvoice subtotal (${fmt(subtotal)}) exceeds total project budget limit (${fmt(currentLimits.total_project_budget)}).`);
                return;
              }
            }

            try {
              const res = await financeService.createInvoice({
                project_finance_id: pfId,
                invoice_number: num,
                invoice_date: date,
                due_date: modal.querySelector('#ci-due-date').value || null,
                gst_percentage: gst,
                description: modal.querySelector('#ci-desc').value || null,
                items: items
              });

              if (res && res.message && !res.invoice) {
                alert('Error: ' + res.message);
                return;
              }
              modal.remove();
              await loadInvoices();
            } catch (err) {
              alert('Creation failed: ' + err.message);
            }
          });
        });
      }

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
            wrapper.style.width = '794px';
            wrapper.style.margin = '0 auto';
            wrapper.innerHTML = htmlContent;

            const opt = {
              margin: [0.4, 0.4, 0.4, 0.4],
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
            <div class="fin-modal" style="width:90%; max-width:680px; box-sizing:border-box;">
              <h3 style="margin:0 0 1rem">Payment History — ${inv.invoice_number}</h3>
              <div style="overflow-x:auto; width:100%;">
                <table class="fin-table" style="font-size:0.85rem; min-width:560px; width:100%; table-layout:auto;">
                  <thead>
                    <tr>
                      <th style="white-space:nowrap;">Date</th>
                      <th style="white-space:nowrap;">Method</th>
                      <th style="white-space:nowrap;">Ref</th>
                      <th style="white-space:nowrap;">Remarks</th>
                      <th style="white-space:nowrap; text-align:right; padding-right:12px;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${payments.map(p => `<tr>
                      <td style="white-space:nowrap;">${fmtDate(p.payment_date)}</td>
                      <td>${p.payment_method || '-'}</td>
                      <td style="word-break:break-all; max-width:140px;">${p.payment_reference || '-'}</td>
                      <td style="max-width:160px;">${p.remarks || '-'}</td>
                      <td style="font-weight:700; white-space:nowrap; text-align:right; padding-right:12px;">${fmt(p.amount)}</td>
                    </tr>`).join('')}
                  </tbody>
                </table>
              </div>
              <div class="fin-form-actions" style="margin-top:1.5rem; justify-content:flex-end;">
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
              await loadInvoices();
            } catch (e) {
              alert('Payment failed: ' + e.message);
            }
          });
        });
      });
    };

    loadInvoices();

  } catch (e) {
    container.innerHTML = `<div class="alert-error">Failed to load invoices: ${e.message}</div>`;
  }

  return container;
}

export default InvoicesBills;
