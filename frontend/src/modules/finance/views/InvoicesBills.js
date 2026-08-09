import { financeService } from '../services/FinanceService.js';
import { updateFinanceSidebar } from '../layouts/FinanceLayout.js';
import html2pdf from 'html2pdf.js';

export async function InvoicesBills(route, router) {
  const container = document.createElement('div');
  container.className = 'finance-module animate-fade-in';
  setTimeout(updateFinanceSidebar, 0);

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

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
                  <td style="font-family:monospace;font-weight:600;">${inv.id}</td>
                  <td>${inv.date}</td>
                  <td style="color:var(--text-muted)">${inv.dueDate}</td>
                  <td><div style="font-weight:600">${inv.projectName}</div></td>
                  <td>${inv.client}</td>
                  <td>${fmt(inv.subtotal)}</td>
                  <td style="font-weight:700">${fmt(inv.grandTotal)}</td>
                  <td><span class="fin-badge ${inv.status === 'Paid' ? 'success' : 'warning'}">${inv.status}</span></td>
                  <td>
                    <button class="fin-btn outline sm download-btn" data-id="${inv.id}">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      PDF
                    </button>
                  </td>
                </tr>
              `).join('')}
              ${invoices.length === 0 ? '<tr><td colspan="9" style="text-align:center;color:var(--text-muted)">No invoices found</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // PDF Generation Logic
    container.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const invId = btn.dataset.id;
        const inv = invoices.find(i => i.id === invId);
        if (!inv) return;

        // Create a hidden div with the invoice HTML
        const printContainer = document.createElement('div');
        printContainer.style.padding = '40px';
        printContainer.style.fontFamily = 'Arial, sans-serif';
        printContainer.style.color = '#333';
        printContainer.style.width = '800px';

        printContainer.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 40px; border-bottom: 2px solid #059669; padding-bottom: 20px;">
            <div>
              <h1 style="color: #059669; font-size: 28px; font-weight: 800; margin:0 0 5px 0;">RLabZ</h1>
              <div style="font-size: 14px; color: #666;">
                Modular Enterprise Resource Planning<br>
                Rajagiri College of Social Sciences<br>
                Kochi, Kerala, India
              </div>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 24px; color: #333; margin:0 0 10px 0;">${inv.status === 'Paid' ? 'RECEIPT' : 'INVOICE'}</h2>
              <table style="width: 100%; font-size: 14px;">
                <tr><td style="color:#666; padding-right:15px; text-align:right;">No:</td><td style="font-weight:bold;">${inv.id}</td></tr>
                <tr><td style="color:#666; padding-right:15px; text-align:right;">Date:</td><td style="font-weight:bold;">${inv.date}</td></tr>
                <tr><td style="color:#666; padding-right:15px; text-align:right;">Due Date:</td><td style="font-weight:bold;">${inv.dueDate}</td></tr>
              </table>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; margin-bottom: 40px;">
            <div>
              <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px;">Bill To:</div>
              <div style="font-size: 16px; font-weight: bold;">${inv.client}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px;">Project:</div>
              <div style="font-size: 16px; font-weight: bold;">${inv.projectName}</div>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 12px; text-align: left; color: #64748b; font-size: 12px; text-transform: uppercase;">Description</th>
                <th style="padding: 12px; text-align: right; color: #64748b; font-size: 12px; text-transform: uppercase;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${inv.items.map(item => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 12px; font-size: 14px;">${item.desc}</td>
                  <td style="padding: 12px; text-align: right; font-size: 14px; font-weight: bold;">${fmt(item.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="display:flex; justify-content:flex-end;">
            <table style="width: 300px; font-size: 14px;">
              <tr>
                <td style="padding: 8px; color: #666;">Subtotal:</td>
                <td style="padding: 8px; text-align: right; font-weight: bold;">${fmt(inv.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; color: #666;">GST (${financeService.gstRate * 100}%):</td>
                <td style="padding: 8px; text-align: right; font-weight: bold;">${fmt(inv.gstAmount)}</td>
              </tr>
              <tr style="border-top: 2px solid #e2e8f0;">
                <td style="padding: 12px 8px; font-size: 16px; font-weight: bold;">Grand Total:</td>
                <td style="padding: 12px 8px; text-align: right; font-size: 18px; font-weight: bold; color: #059669;">${fmt(inv.grandTotal)}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 50px; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
            <div style="font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 8px;">Payment Status</div>
            <div style="font-size: 18px; font-weight: bold; color: ${inv.status === 'Paid' ? '#059669' : '#f59e0b'};">
              ${inv.status.toUpperCase()}
            </div>
            ${inv.status === 'Paid' ? `
              <div style="margin-top: 10px; font-size: 14px; color: #333;">
                Paid on: <strong>${inv.paymentDate}</strong><br>
                Reference: <strong>${inv.txRef}</strong>
              </div>
            ` : ''}
          </div>
        `;

        const opt = {
          margin:       0.5,
          filename:     `${inv.id}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Call the local package to generate PDF
        btn.innerHTML = 'Wait...';
        btn.disabled = true;
        html2pdf().set(opt).from(printContainer).save().then(() => {
          btn.innerHTML = 'PDF';
          btn.disabled = false;
        });
      });
    });

  } catch (e) {
    container.innerHTML = `<div class="alert-error">Failed to load invoices.</div>`;
  }

  return container;
}

export default InvoicesBills;
