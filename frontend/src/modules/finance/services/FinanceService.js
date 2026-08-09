/**
 * FinanceService.js
 * Centralized mock data layer for the Finance Module.
 * Provides internally consistent calculations for projects, payroll, expenses, and invoices.
 */

class FinanceService {
  constructor() {
    this.gstRate = 0.18; // 18% mock GST

    // Mock Projects
    this.projects = [
      { id: 101, name: 'RLabZ ERP Website', status: 'In Progress', client: 'Internal RLabZ', estimated_cost: 120000, margin_target: 30 },
      { id: 102, name: 'College Management System', status: 'Completed', client: 'Rajagiri College', estimated_cost: 450000, margin_target: 25 },
      { id: 103, name: 'Student Portal App', status: 'In Progress', client: 'Rajagiri College', estimated_cost: 200000, margin_target: 20 }
    ];

    // Mock Invoices (Client Billing)
    this.invoices = [
      { id: 'INV-2026-001', projectId: 101, date: '2026-07-01', dueDate: '2026-07-15', items: [{ desc: 'Initial Development Phase', amount: 50000 }], status: 'Paid', paymentDate: '2026-07-10', txRef: 'TXN-99881' },
      { id: 'INV-2026-002', projectId: 101, date: '2026-08-01', dueDate: '2026-08-15', items: [{ desc: 'Frontend Implementation', amount: 40000 }], status: 'Pending', paymentDate: null, txRef: null },
      { id: 'INV-2026-003', projectId: 102, date: '2026-06-01', dueDate: '2026-06-15', items: [{ desc: 'Full System Delivery', amount: 450000 }], status: 'Paid', paymentDate: '2026-06-14', txRef: 'TXN-99882' },
      { id: 'INV-2026-004', projectId: 103, date: '2026-08-05', dueDate: '2026-08-20', items: [{ desc: 'App Mockups & UI', amount: 60000 }], status: 'Paid', paymentDate: '2026-08-08', txRef: 'TXN-99883' }
    ];

    // Mock Student Payroll
    this.studentPayroll = [
      { id: 'PRL-1001', studentName: 'Alex Johnson', designation: 'Frontend Dev', projectId: 101, hours: 40, rate: 250, period: 'July 2026', status: 'Paid', paymentDate: '2026-08-01', txRef: 'TXN-PAY-001' },
      { id: 'PRL-1002', studentName: 'Maria Garcia', designation: 'Backend Dev', projectId: 101, hours: 30, rate: 300, period: 'July 2026', status: 'Paid', paymentDate: '2026-08-01', txRef: 'TXN-PAY-002' },
      { id: 'PRL-1003', studentName: 'Sam Smith', designation: 'UI/UX Designer', projectId: 103, hours: 25, rate: 200, period: 'August 2026', status: 'Pending', paymentDate: null, txRef: null },
      { id: 'PRL-1004', studentName: 'Alex Johnson', designation: 'Frontend Dev', projectId: 101, hours: 20, rate: 250, period: 'August 2026', status: 'Pending', paymentDate: null, txRef: null }
    ];

    // Mock Faculty / Resource Costs
    this.facultyCosts = [
      { id: 'FAC-001', name: 'Dr. Alan Turing', role: 'Project Consultant', projectId: 102, amount: 25000, date: '2026-06-10', status: 'Paid', txRef: 'TXN-FAC-001' },
      { id: 'FAC-002', name: 'Dr. Grace Hopper', role: 'System Architect', projectId: 101, amount: 15000, date: '2026-07-20', status: 'Paid', txRef: 'TXN-FAC-002' }
    ];

    // Mock Other Expenses
    this.otherExpenses = [
      { id: 'EXP-001', type: 'Hosting', desc: 'AWS Server July', projectId: 101, amount: 5000, date: '2026-07-28' },
      { id: 'EXP-002', type: 'Hosting', desc: 'AWS Server Aug', projectId: 101, amount: 5000, date: '2026-08-28' },
      { id: 'EXP-003', type: 'Software License', desc: 'Figma Pro', projectId: 103, amount: 2000, date: '2026-08-01' }
    ];

    this._calculateDerivedData();
  }

  _calculateDerivedData() {
    this.invoices.forEach(inv => {
      inv.subtotal = inv.items.reduce((sum, item) => sum + item.amount, 0);
      inv.gstAmount = inv.subtotal * this.gstRate;
      inv.grandTotal = inv.subtotal + inv.gstAmount;
    });

    this.studentPayroll.forEach(pr => {
      pr.grossAmount = pr.hours * pr.rate;
    });
  }

  // Generate a mock transaction ID
  _generateTxId(prefix = 'TXN') {
    return `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
  }

  async getDashboardSummary() {
    let totalBilling = 0;
    let totalCollected = 0;
    
    this.invoices.forEach(inv => {
      totalBilling += inv.subtotal; // Use pre-tax for KPI billing
      if (inv.status === 'Paid') totalCollected += inv.subtotal;
    });

    const outstanding = totalBilling - totalCollected;

    let totalPayroll = 0;
    this.studentPayroll.forEach(pr => {
      if (pr.status === 'Paid') totalPayroll += pr.grossAmount;
    });

    let totalFaculty = 0;
    this.facultyCosts.forEach(fc => {
      if (fc.status === 'Paid') totalFaculty += fc.amount;
    });

    let totalOtherExpenses = 0;
    this.otherExpenses.forEach(ex => totalOtherExpenses += ex.amount);

    const totalExpenses = totalPayroll + totalFaculty + totalOtherExpenses;
    const netPosition = totalCollected - totalExpenses;

    return {
      totalBilling,
      totalCollected,
      outstanding,
      totalPayroll,
      totalFaculty,
      totalOtherExpenses,
      totalExpenses,
      netPosition
    };
  }

  async getProjectFinances() {
    return this.projects.map(p => {
      // Billing
      const projInvoices = this.invoices.filter(i => i.projectId === p.id);
      const totalBilling = projInvoices.reduce((sum, i) => sum + i.subtotal, 0); // Exclude GST from revenue calculation
      const collected = projInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.subtotal, 0);
      const outstanding = totalBilling - collected;

      // Expenses
      const projPayroll = this.studentPayroll.filter(pr => pr.projectId === p.id && pr.status === 'Paid');
      const payrollCost = projPayroll.reduce((sum, pr) => sum + pr.grossAmount, 0);
      
      const projFaculty = this.facultyCosts.filter(fc => fc.projectId === p.id && fc.status === 'Paid');
      const facultyCost = projFaculty.reduce((sum, fc) => sum + fc.amount, 0);

      const projOther = this.otherExpenses.filter(ex => ex.projectId === p.id);
      const hostingCost = projOther.filter(ex => ex.type === 'Hosting').reduce((sum, ex) => sum + ex.amount, 0);
      const otherCost = projOther.filter(ex => ex.type !== 'Hosting').reduce((sum, ex) => sum + ex.amount, 0);

      const totalExpenses = payrollCost + facultyCost + hostingCost + otherCost;
      const margin = totalBilling - totalExpenses; 

      return {
        ...p,
        totalBilling,
        collected,
        outstanding,
        payrollCost,
        facultyCost,
        hostingCost,
        otherCost,
        totalExpenses,
        margin
      };
    });
  }

  async getProjectDetails(projectId) {
    const pId = parseInt(projectId);
    const finances = await this.getProjectFinances();
    const project = finances.find(p => p.id === pId);
    
    if (!project) throw new Error('Project not found');

    const invoices = this.invoices.filter(i => i.projectId === pId);
    const payroll = this.studentPayroll.filter(pr => pr.projectId === pId);
    const faculty = this.facultyCosts.filter(fc => fc.projectId === pId);
    const expenses = this.otherExpenses.filter(ex => ex.projectId === pId);

    return { project, invoices, payroll, faculty, expenses };
  }

  async getStudentPayroll() {
    return this.studentPayroll.map(pr => ({
      ...pr,
      projectName: this.projects.find(p => p.id === pr.projectId)?.name || 'Unknown'
    }));
  }

  async processPayroll(payrollId) {
    const pr = this.studentPayroll.find(p => p.id === payrollId);
    if (!pr) throw new Error('Payroll record not found');
    
    return new Promise(resolve => {
      // Simulate Processing state
      pr.status = 'Processing';
      
      setTimeout(() => {
        pr.status = 'Paid';
        pr.paymentDate = new Date().toISOString().split('T')[0];
        pr.txRef = this._generateTxId('TXN-PAY');
        resolve({ success: true, record: pr });
      }, 1500); // 1.5s delay to show processing animation
    });
  }

  async getFacultyCosts() {
    return this.facultyCosts.map(fc => ({
      ...fc,
      projectName: this.projects.find(p => p.id === fc.projectId)?.name || 'Unknown'
    }));
  }

  async getInvoices() {
    return this.invoices.map(inv => ({
      ...inv,
      projectName: this.projects.find(p => p.id === inv.projectId)?.name || 'Unknown',
      client: this.projects.find(p => p.id === inv.projectId)?.client || 'Unknown'
    }));
  }

  async getTransactions() {
    const transactions = [];

    // Client Payments
    this.invoices.filter(i => i.status === 'Paid').forEach(i => {
      transactions.push({
        id: i.txRef,
        date: i.paymentDate,
        projectId: i.projectId,
        projectName: this.projects.find(p => p.id === i.projectId)?.name,
        type: 'Client Payment',
        desc: `Invoice Payment: ${i.id}`,
        amount: i.grandTotal,
        method: 'Bank Transfer',
        status: 'Completed'
      });
    });

    // Student Payroll Payments
    this.studentPayroll.filter(p => p.status === 'Paid').forEach(p => {
      transactions.push({
        id: p.txRef,
        date: p.paymentDate,
        projectId: p.projectId,
        projectName: this.projects.find(proj => proj.id === p.projectId)?.name,
        type: 'Student Payroll',
        desc: `Payroll: ${p.studentName} (${p.period})`,
        amount: p.grossAmount,
        method: 'Bank Transfer',
        status: 'Completed'
      });
    });

    // Faculty Payments
    this.facultyCosts.filter(f => f.status === 'Paid').forEach(f => {
      transactions.push({
        id: f.txRef,
        date: f.date,
        projectId: f.projectId,
        projectName: this.projects.find(proj => proj.id === f.projectId)?.name,
        type: 'Faculty/Resource',
        desc: `Consultation: ${f.name}`,
        amount: f.amount,
        method: 'Bank Transfer',
        status: 'Completed'
      });
    });

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    return transactions;
  }
}

// Export singleton instance
export const financeService = new FinanceService();
