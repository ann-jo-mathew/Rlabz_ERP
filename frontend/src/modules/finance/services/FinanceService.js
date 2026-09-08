class FinanceService {
  async _fetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const response = await fetch(`http://127.0.0.1:8000/api${endpoint}`, { ...options, headers });
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
      return null;
    }
    const data = await response.json();
    return data;
  }

  async getDashboardSummary() {
    return await this._fetch('/finance/dashboard') || { 
      totalBilling: 0, 
      totalCollected: 0, 
      pendingFromClient: 0,
      totalPayroll: 0, 
      totalFaculty: 0, 
      totalOtherExpenses: 0, 
      totalExpenses: 0,
      projectProfit: 0
    };
  }

  async getProjectFinances() {
    return await this._fetch('/finance/projects') || [];
  }

  async getProjectDetails(projectId) {
    return this._fetch(`/finance/projects/${projectId}`);
  }

  async getStudentPayroll(projectId = null) {
    const url = projectId ? `/finance/student-payments?project_id=${projectId}` : '/finance/student-payments';
    return await this._fetch(url) || [];
  }

  async getStudentPayrollByProject(projectId) {
    return this.getStudentPayroll(projectId);
  }

  async processPayroll(data) {
    return await this._fetch('/finance/student-payments', { method: 'POST', body: JSON.stringify(data) });
  }

  async getFacultyCosts() {
    return await this._fetch('/finance/faculty-payments') || [];
  }

  async getInvoices() {
    return await this._fetch('/finance/invoices') || [];
  }

  async getTransactions() {
    return await this._fetch('/finance/transactions') || [];
  }
  
  async addProjectFinance(data) {
    return this._fetch('/finance/projects', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateAllocations(projectId, data) {
    return this._fetch(`/finance/projects/${projectId}/allocations`, { method: 'POST', body: JSON.stringify(data) });
  }
  
  async recordClientPayment(data) {
    return this._fetch('/finance/client-payments', { method: 'POST', body: JSON.stringify(data) });
  }
  
  async addFacultyCost(data) {
    return this._fetch('/finance/faculty-payments', { method: 'POST', body: JSON.stringify(data) });
  }

  async addResourceCost(data) {
    return this._fetch('/finance/hosting-charges', { method: 'POST', body: JSON.stringify(data) });
  }

  async addMaintenanceCost(data) {
    return this._fetch('/finance/maintenance-charges', { method: 'POST', body: JSON.stringify(data) });
  }

  async createInvoice(data) {
    return this._fetch('/finance/invoices', { method: 'POST', body: JSON.stringify(data) });
  }

  async getProjectStudents(projectId) {
    return await this._fetch(`/finance/projects/${projectId}`).then(data => {
      return (data?.assigned_resources || []).filter(r => r.type === 'Student');
    });
  }

  async getProjectFaculties(projectId) {
    return await this._fetch(`/finance/projects/${projectId}`).then(data => {
      return (data?.assigned_resources || []).filter(r => r.type === 'Faculty');
    });
  }
  
  async getProjectsList() {
    const res = await this._fetch('/finance/projects');
    return (res || []).map(p => ({id: p.id, name: p.title || p.name}));
  }

  async getStudentHourlyRate() {
    const res = await this._fetch('/finance/student-hourly-rate');
    return res ? (res.student_hourly_rate || 0) : 0;
  }

  async getStudentHourlyRateHistory() {
    return await this._fetch('/finance/student-hourly-rate/history') || [];
  }

  async updateStudentHourlyRate(data) {
    return this._fetch('/finance/student-hourly-rate', { method: 'POST', body: JSON.stringify(data) });
  }

  async renewSsl(hostingChargeId, data) {
    return this._fetch(`/finance/hosting-charges/${hostingChargeId}/renew`, { method: 'POST', body: JSON.stringify(data) });
  }
}

export const financeService = new FinanceService();
