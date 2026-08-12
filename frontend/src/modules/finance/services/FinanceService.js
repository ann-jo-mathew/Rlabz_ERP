/**
 * FinanceService.js
 * Centralized mock data layer for the Finance Module.
 * Provides internally consistent calculations for projects, payroll, expenses, and invoices.
 */

class FinanceService {
  constructor() {
    this.gstRate = 0.18; // 18% mock GST (configurable, not a hardcoded rule)
    
    // Configurable Mock Rates (Not finalized business rules)
    this.rates = {
      'Nova': 250,
      'Orbit': 200,
      'Spark': 150
    };

    // Mock Projects (Project Finance status: Draft / Approved / Active / Closed)
    this.projects = [
      { 
        id: 101, 
        name: 'RLabZ ERP Website', 
        status: 'Active', 
        client: 'Internal RLabZ', 
        estimated_cost: 150000,
        dev_student: 60000,
        dev_faculty: 40000,
        dev_rlabz: 35000,
        host_ssl: 2000,
        host_domain: 3000,
        host_api: 10000,
        maintenance_support: 0 // Optional
      },
      { 
        id: 102, 
        name: 'College Management System', 
        status: 'Closed', 
        client: 'Rajagiri College', 
        estimated_cost: 450000,
        dev_student: 150000,
        dev_faculty: 100000,
        dev_rlabz: 150000,
        host_ssl: 5000,
        host_domain: 5000,
        host_api: 20000,
        maintenance_support: 20000
      },
      { 
        id: 103, 
        name: 'Student Portal App', 
        status: 'Approved', 
        client: 'Rajagiri College', 
        estimated_cost: 200000,
        dev_student: 80000,
        dev_faculty: 50000,
        dev_rlabz: 60000,
        host_ssl: 2000,
        host_domain: 3000,
        host_api: 0, // Not applicable
        maintenance_support: 5000
      }
    ];

    // Mock Client Payments (Status: Pending / Confirmed / Failed / Rejected)
    this.clientPayments = [
      { id: 'PAY-2026-001', projectId: 101, date: '2026-07-10', amount: 59000, type: 'Advance', method: 'Bank Transfer', status: 'Confirmed', ref: 'TXN-99881', remarks: 'Initial setup' },
      { id: 'PAY-2026-002', projectId: 102, date: '2026-06-14', amount: 531000, type: 'Final', method: 'Bank Transfer', status: 'Confirmed', ref: 'TXN-99882', remarks: 'Full delivery' },
      { id: 'PAY-2026-003', projectId: 103, date: '2026-08-08', amount: 70800, type: 'Advance', method: 'Bank Transfer', status: 'Confirmed', ref: 'TXN-99883', remarks: 'Milestone 1' }
    ];

    // Mock Invoices (Client Billing - generated from payments/projects for display)
    this.invoices = [
      { id: 'INV-2026-001', projectId: 101, date: '2026-07-01', dueDate: '2026-07-15', subtotal: 50000, gstAmount: 9000, grandTotal: 59000, status: 'Paid', paymentDate: '2026-07-10', txRef: 'TXN-99881' },
      { id: 'INV-2026-002', projectId: 101, date: '2026-08-01', dueDate: '2026-08-15', subtotal: 40000, gstAmount: 7200, grandTotal: 47200, status: 'Pending', paymentDate: null, txRef: null },
      { id: 'INV-2026-003', projectId: 102, date: '2026-06-01', dueDate: '2026-06-15', subtotal: 450000, gstAmount: 81000, grandTotal: 531000, status: 'Paid', paymentDate: '2026-06-14', txRef: 'TXN-99882' },
      { id: 'INV-2026-004', projectId: 103, date: '2026-08-05', dueDate: '2026-08-20', subtotal: 60000, gstAmount: 10800, grandTotal: 70800, status: 'Paid', paymentDate: '2026-08-08', txRef: 'TXN-99883' }
    ];

    // Mock Student Payroll (Status: Calculated / Approved / Processing / Paid / Failed)
    this.studentPayroll = [
      { id: 'PRL-1001', studentName: 'Alex Johnson', designation: 'Nova', projectId: 101, loggedHours: 42, approvedHours: 40, period: 'July 2026', status: 'Paid', paymentDate: '2026-08-01', txRef: 'TXN-PAY-001' },
      { id: 'PRL-1002', studentName: 'Maria Garcia', designation: 'Orbit', projectId: 101, loggedHours: 30, approvedHours: 30, period: 'July 2026', status: 'Paid', paymentDate: '2026-08-01', txRef: 'TXN-PAY-002' },
      { id: 'PRL-1003', studentName: 'Sam Smith', designation: 'Spark', projectId: 103, loggedHours: 25, approvedHours: 25, period: 'August 2026', status: 'Approved', paymentDate: null, txRef: null },
      { id: 'PRL-1004', studentName: 'Alex Johnson', designation: 'Nova', projectId: 101, loggedHours: 22, approvedHours: 20, period: 'August 2026', status: 'Calculated', paymentDate: null, txRef: null }
    ];

    // Mock Faculty / Resource Costs
    this.facultyCosts = [
      { id: 'FAC-001', name: 'Dr. Alan Turing', role: 'Project Consultant', projectId: 102, amount: 25000, date: '2026-06-10', status: 'Paid', txRef: 'TXN-FAC-001' },
      { id: 'FAC-002', name: 'Dr. Grace Hopper', role: 'System Architect', projectId: 101, amount: 15000, date: '2026-07-20', status: 'Paid', txRef: 'TXN-FAC-002' }
    ];

    // Mock Other Expenses (Hosting / Maintenance)
    this.otherExpenses = [
      { id: 'EXP-001', type: 'Hosting - AWS Server', projectId: 101, amount: 5000, date: '2026-07-28', status: 'Paid' },
      { id: 'EXP-002', type: 'Hosting - Domain', projectId: 101, amount: 3000, date: '2026-08-28', status: 'Paid' },
      { id: 'EXP-003', type: 'Maintenance', projectId: 102, amount: 20000, date: '2026-08-01', status: 'Paid' }
    ];

    this._calculateDerivedData();
  }

  _calculateDerivedData() {
    this.studentPayroll.forEach(pr => {
      const rate = this.rates[pr.designation] || 0;
      pr.rate = rate;
      pr.grossAmount = pr.approvedHours * rate;
    });
  }

  // Generate a mock transaction ID
  _generateTxId(prefix = 'TXN') {
    return `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
  }

  async getDashboardSummary() {
    let totalBilling = 0;
    let totalCollected = 0;
    
    this.projects.forEach(p => {
      const pBilling = p.dev_student + p.dev_faculty + p.dev_rlabz + p.host_ssl + p.host_domain + p.host_api + p.maintenance_support;
      totalBilling += pBilling;
    });

    this.clientPayments.forEach(pay => {
      if (pay.status === 'Confirmed') totalCollected += pay.amount;
    });

    // Approximate pre-tax outstanding for KPI
    const outstanding = Math.max(0, (totalBilling * (1 + this.gstRate)) - totalCollected);

    let totalPayroll = 0;
    this.studentPayroll.forEach(pr => {
      if (pr.status === 'Paid') totalPayroll += pr.grossAmount;
    });

    let totalFaculty = 0;
    this.facultyCosts.forEach(fc => {
      if (fc.status === 'Paid') totalFaculty += fc.amount;
    });

    let totalOtherExpenses = 0;
    this.otherExpenses.forEach(ex => {
        if(ex.status === 'Paid') totalOtherExpenses += ex.amount;
    });

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
      const subtotal = p.dev_student + p.dev_faculty + p.dev_rlabz + p.host_ssl + p.host_domain + p.host_api + p.maintenance_support;
      const gst = subtotal * this.gstRate;
      const totalBilling = subtotal + gst;
      
      const projPayments = this.clientPayments.filter(pay => pay.projectId === p.id && pay.status === 'Confirmed');
      const collected = projPayments.reduce((sum, pay) => sum + pay.amount, 0);
      const outstanding = Math.max(0, totalBilling - collected);

      // Expenses
      const projPayroll = this.studentPayroll.filter(pr => pr.projectId === p.id && pr.status === 'Paid');
      const payrollCost = projPayroll.reduce((sum, pr) => sum + pr.grossAmount, 0);
      
      const projFaculty = this.facultyCosts.filter(fc => fc.projectId === p.id && fc.status === 'Paid');
      const facultyCost = projFaculty.reduce((sum, fc) => sum + fc.amount, 0);

      const projOther = this.otherExpenses.filter(ex => ex.projectId === p.id && ex.status === 'Paid');
      const otherCost = projOther.reduce((sum, ex) => sum + ex.amount, 0);

      const totalExpenses = payrollCost + facultyCost + otherCost;
      const margin = subtotal - totalExpenses; // Margin on pre-tax revenue

      return {
        ...p,
        subtotal,
        gst,
        totalBilling,
        collected,
        outstanding,
        payrollCost,
        facultyCost,
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

    const payments = this.clientPayments.filter(i => i.projectId === pId);
    const payroll = this.studentPayroll.filter(pr => pr.projectId === pId);
    const faculty = this.facultyCosts.filter(fc => fc.projectId === pId);
    const expenses = this.otherExpenses.filter(ex => ex.projectId === pId);

    return { project, payments, payroll, faculty, expenses };
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
      pr.status = 'Processing';
      
      setTimeout(() => {
        pr.status = 'Paid';
        pr.paymentDate = new Date().toISOString().split('T')[0];
        pr.txRef = this._generateTxId('TXN-PAY');
        resolve({ success: true, record: pr });
      }, 1500);
    });
  }

  async getFacultyCosts() {
    return this.facultyCosts.map(fc => ({
      ...fc,
      projectName: this.projects.find(p => p.id === fc.projectId)?.name || 'Unknown'
    }));
  }

  async getInvoices() {
    // Return mock invoices for now, augmented with project data
    return this.invoices.map(inv => {
      const p = this.projects.find(proj => proj.id === inv.projectId);
      return {
        ...inv,
        projectName: p?.name || 'Unknown',
        client: p?.client || 'Unknown',
        projectData: p // Pass down the full project for invoice rendering
      };
    });
  }

  async getTransactions() {
    const transactions = [];

    this.clientPayments.filter(i => i.status === 'Confirmed').forEach(i => {
      transactions.push({
        id: i.ref,
        date: i.date,
        projectId: i.projectId,
        projectName: this.projects.find(p => p.id === i.projectId)?.name,
        type: 'Client Payment',
        desc: `${i.type} Payment`,
        amount: i.amount,
        incomeExpense: 'Income',
        status: i.status
      });
    });

    this.studentPayroll.filter(p => p.status === 'Paid').forEach(p => {
      transactions.push({
        id: p.txRef,
        date: p.paymentDate,
        projectId: p.projectId,
        projectName: this.projects.find(proj => proj.id === p.projectId)?.name,
        type: 'Student Payroll',
        desc: `Payroll: ${p.studentName}`,
        amount: p.grossAmount,
        incomeExpense: 'Expense',
        status: 'Completed'
      });
    });

    this.facultyCosts.filter(f => f.status === 'Paid').forEach(f => {
      transactions.push({
        id: f.txRef,
        date: f.date,
        projectId: f.projectId,
        projectName: this.projects.find(proj => proj.id === f.projectId)?.name,
        type: 'Faculty/Resource',
        desc: `Consultation: ${f.name}`,
        amount: f.amount,
        incomeExpense: 'Expense',
        status: 'Completed'
      });
    });

    this.otherExpenses.filter(e => e.status === 'Paid').forEach(e => {
        transactions.push({
          id: this._generateTxId('TXN-EXP'),
          date: e.date,
          projectId: e.projectId,
          projectName: this.projects.find(proj => proj.id === e.projectId)?.name,
          type: 'Other Expense',
          desc: e.type,
          amount: e.amount,
          incomeExpense: 'Expense',
          status: 'Completed'
        });
    });

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    return transactions;
  }
  
  // CRUD Mocks
  async addProjectFinance(data) {
    const newProject = {
        id: Date.now(),
        status: 'Draft',
        ...data
    };
    this.projects.push(newProject);
    return newProject;
  }
  
  async recordClientPayment(data) {
    const newPayment = {
        id: `PAY-${Date.now()}`,
        status: 'Confirmed',
        ref: this._generateTxId('TXN-PAY'),
        ...data
    };
    this.clientPayments.push(newPayment);
    return newPayment;
  }
  
  async addFacultyCost(data) {
    const newCost = {
        id: `FAC-${Date.now()}`,
        status: 'Paid',
        txRef: this._generateTxId('TXN-FAC'),
        ...data
    };
    this.facultyCosts.push(newCost);
    return newCost;
  }
  
  async getProjectsList() {
      return this.projects.map(p => ({id: p.id, name: p.name}));
  }
}

// Export singleton instance
export const financeService = new FinanceService();
