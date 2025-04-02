// DOM Elements
// Auth Elements
const authContainer = document.getElementById('authContainer');
const mainContainer = document.getElementById('mainContainer');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const userDisplayName = document.getElementById('userDisplayName');
const logoutBtn = document.getElementById('logoutBtn');

// Navigation Elements
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

// Forms
const expenseForm = document.getElementById('expenseForm');
const expenseError = document.getElementById('expenseError');
const reportForm = document.getElementById('reportForm');
const reportResults = document.getElementById('reportResults');

// Modals
const editExpenseModal = document.getElementById('editExpenseModal');
const closeEditModal = document.getElementById('closeEditModal');
const editExpenseForm = document.getElementById('editExpenseForm');
const editExpenseError = document.getElementById('editExpenseError');
const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
const closeDeleteModal = document.getElementById('closeDeleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

// Toast
const toast = document.getElementById('toast');

// API URLs
const API_URL = window.location.origin + '/api';
const AUTH_URL = `${API_URL}/auth`;
const EXPENSES_URL = `${API_URL}/expenses`;

// State
let currentUser = null;
let expenses = [];
let filteredExpenses = [];
let categories = [];
let categoryColors = {
  'Food': '#FF6B6B',
  'Transportation': '#4ECDC4',
  'Entertainment': '#FFA500',
  'Shopping': '#9B5DE5',
  'Utilities': '#4361EE',
  'Housing': '#F72585',
  'Healthcare': '#4CAF50',
  'Education': '#3A86FF',
  'Personal': '#FB5607',
  'Other': '#8338EC'
};

// AI Chat Elements
const chatButton = document.getElementById('chatButton');
const chatContainer = document.getElementById('chatContainer');
const chatClose = document.getElementById('chatClose');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

// Chat Variables
let isChatOpen = false;
let isWaitingForResponse = false;

// Initialize markdown-it
const md = window.markdownit({
    html: true,
    breaks: true,
    linkify: true
});

// Helpers
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function showToast(message, type = '') {
  toast.textContent = message;
  toast.className = 'toast ' + type;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function showPage(pageId) {
  // Hide all pages
  pages.forEach(page => page.classList.add('hide'));
  
  // Show the selected page
  document.getElementById(pageId).classList.remove('hide');
  
  // Update active nav button
  navButtons.forEach(btn => {
    if (btn.dataset.page === pageId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Refresh data depending on the page
  if (pageId === 'dashboard') {
    loadDashboard();
  } else if (pageId === 'expenses') {
    loadExpenses();
  } else if (pageId === 'add-expense') {
    // Set default date to today
    document.getElementById('expenseDate').valueAsDate = new Date();
  }
}

function showModal(modal) {
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

// Auth Functions
async function checkAuth() {
  try {
    const response = await fetch(`${AUTH_URL}/me`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      userDisplayName.textContent = currentUser.username;
      authContainer.classList.add('hide');
      mainContainer.classList.remove('hide');
      showPage('dashboard');
    } else {
      currentUser = null;
      authContainer.classList.remove('hide');
      mainContainer.classList.add('hide');
    }
  } catch (error) {
    console.error('Auth check error:', error);
    showToast('Error checking authentication', 'error');
  }
}

async function login(username, password) {
  try {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = data.user;
      loginForm.reset();
      loginError.textContent = '';
      checkAuth();
      showToast('Login successful', 'success');
    } else {
      loginError.textContent = data.message || 'Login failed';
    }
  } catch (error) {
    console.error('Login error:', error);
    loginError.textContent = 'An error occurred during login';
  }
}

async function register(username, email, password) {
  try {
    const response = await fetch(`${AUTH_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      registerForm.reset();
      registerError.textContent = '';
      showToast('Registration successful! Please log in.', 'success');
      
      // Switch to login tab
      loginTab.click();
    } else {
      registerError.textContent = data.message || 'Registration failed';
    }
  } catch (error) {
    console.error('Registration error:', error);
    registerError.textContent = 'An error occurred during registration';
  }
}

async function logout() {
  try {
    const response = await fetch(`${AUTH_URL}/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      currentUser = null;
      checkAuth();
      showToast('Logged out successfully', 'success');
    } else {
      const data = await response.json();
      showToast(data.message || 'Logout failed', 'error');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showToast('An error occurred during logout', 'error');
  }
}

// Expense Functions
async function loadExpenses() {
  try {
    const response = await fetch(EXPENSES_URL, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      expenses = data.expenses;
      filteredExpenses = [...expenses];
      renderExpenses();
    } else {
      showToast('Failed to load expenses', 'error');
    }
  } catch (error) {
    console.error('Load expenses error:', error);
    showToast('Error loading expenses', 'error');
  }
}

function renderExpenses() {
  const expensesList = document.getElementById('expensesList');
  expensesList.innerHTML = '';
  
  if (filteredExpenses.length === 0) {
    expensesList.innerHTML = '<div class="expense-row"><div class="expense-cell" style="width:100%; text-align:center;">No expenses found</div></div>';
    return;
  }
  
  filteredExpenses.forEach(expense => {
    const row = document.createElement('div');
    row.className = 'expense-row';
    
    row.innerHTML = `
      <div class="expense-cell date-cell">${formatDate(expense.date)}</div>
      <div class="expense-cell category-cell">${expense.category}</div>
      <div class="expense-cell description-cell">${expense.description || '-'}</div>
      <div class="expense-cell amount-cell">${formatCurrency(expense.amount)}</div>
      <div class="expense-cell actions-cell">
        <button class="action-btn edit-btn" data-id="${expense.id}"><i class="fas fa-edit"></i></button>
        <button class="action-btn delete-btn" data-id="${expense.id}"><i class="fas fa-trash"></i></button>
      </div>
    `;
    
    expensesList.appendChild(row);
  });
  
  // Add event listeners
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editExpense(btn.dataset.id));
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
  });
}

async function addExpense(amount, category, description, date) {
  try {
    const response = await fetch(EXPENSES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, category, description, date }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      expenseForm.reset();
      document.getElementById('expenseDate').valueAsDate = new Date();
      expenseError.textContent = '';
      showToast('Expense added successfully', 'success');
      return true;
    } else {
      expenseError.textContent = data.message || 'Failed to add expense';
      return false;
    }
  } catch (error) {
    console.error('Add expense error:', error);
    expenseError.textContent = 'An error occurred while adding the expense';
    return false;
  }
}

function editExpense(id) {
  const expense = expenses.find(e => e.id == id);
  if (!expense) return;
  
  // Fill form
  document.getElementById('editExpenseId').value = expense.id;
  document.getElementById('editExpenseAmount').value = expense.amount;
  document.getElementById('editExpenseCategory').value = expense.category;
  document.getElementById('editExpenseDescription').value = expense.description || '';
  document.getElementById('editExpenseDate').value = expense.date;
  
  // Show modal
  editExpenseError.textContent = '';
  showModal(editExpenseModal);
}

async function updateExpense(id, amount, category, description, date) {
  try {
    const response = await fetch(`${EXPENSES_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, category, description, date }),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      editExpenseError.textContent = '';
      hideModal(editExpenseModal);
      showToast('Expense updated successfully', 'success');
      return true;
    } else {
      editExpenseError.textContent = data.message || 'Failed to update expense';
      return false;
    }
  } catch (error) {
    console.error('Update expense error:', error);
    editExpenseError.textContent = 'An error occurred while updating the expense';
    return false;
  }
}

function confirmDelete(id) {
  document.getElementById('deleteExpenseId').value = id;
  showModal(deleteConfirmationModal);
}

async function deleteExpense(id) {
  try {
    const response = await fetch(`${EXPENSES_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      hideModal(deleteConfirmationModal);
      showToast('Expense deleted successfully', 'success');
      return true;
    } else {
      showToast(data.message || 'Failed to delete expense', 'error');
      return false;
    }
  } catch (error) {
    console.error('Delete expense error:', error);
    showToast('An error occurred while deleting the expense', 'error');
    return false;
  }
}

async function filterExpenses() {
  const category = document.getElementById('filterCategory').value;
  const sortBy = document.getElementById('sortBy').value;
  
  // Filter by category
  if (category) {
    filteredExpenses = expenses.filter(e => e.category === category);
  } else {
    filteredExpenses = [...expenses];
  }
  
  // Sort expenses
  if (sortBy === 'date-desc') {
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortBy === 'date-asc') {
    filteredExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sortBy === 'amount-desc') {
    filteredExpenses.sort((a, b) => b.amount - a.amount);
  } else if (sortBy === 'amount-asc') {
    filteredExpenses.sort((a, b) => a.amount - b.amount);
  }
  
  renderExpenses();
}

// Dashboard Functions
async function loadDashboard() {
  try {
    // Load expenses
    const response = await fetch(EXPENSES_URL, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      expenses = data.expenses;
      
      updateDashboardSummary();
      updateCategoryList();
      updateRecentExpenses();
    } else {
      showToast('Failed to load dashboard data', 'error');
    }
  } catch (error) {
    console.error('Load dashboard error:', error);
    showToast('Error loading dashboard', 'error');
  }
}

function updateDashboardSummary() {
  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
  
  // Calculate this month's expenses
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  const thisMonthExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear;
    })
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  
  document.getElementById('thisMonthExpenses').textContent = formatCurrency(thisMonthExpenses);
  
  // Calculate daily average for this month
  const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
  const currentDay = Math.min(now.getDate(), daysInMonth);
  const dailyAverage = thisMonthExpenses / currentDay;
  
  document.getElementById('averageDailyExpense').textContent = formatCurrency(dailyAverage);
}

function updateCategoryList() {
  const categoryList = document.getElementById('categoryList');
  categoryList.innerHTML = '';
  
  // Get unique categories and their totals
  const categoryTotals = {};
  expenses.forEach(expense => {
    if (!categoryTotals[expense.category]) {
      categoryTotals[expense.category] = 0;
    }
    categoryTotals[expense.category] += parseFloat(expense.amount);
  });
  
  // Sort categories by total amount (descending)
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Get top 5
  
  const totalAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
  
  // Render category items
  sortedCategories.forEach(([category, amount]) => {
    const percentage = totalAmount ? Math.round((amount / totalAmount) * 100) : 0;
    const color = categoryColors[category] || '#8338EC';
    
    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-item';
    categoryItem.innerHTML = `
      <div class="category-color" style="background-color: ${color};"></div>
      <span>${category}</span>
      <div class="category-bar">
        <div class="category-bar-fill" style="width: ${percentage}%; background-color: ${color};"></div>
      </div>
      <span class="category-amount">${formatCurrency(amount)}</span>
    `;
    
    categoryList.appendChild(categoryItem);
  });
  
  if (sortedCategories.length === 0) {
    categoryList.innerHTML = '<div style="text-align: center; color: var(--text-light);">No expense data available</div>';
  }
}

function updateRecentExpenses() {
  const recentExpensesList = document.getElementById('recentExpensesList');
  recentExpensesList.innerHTML = '';
  
  // Sort expenses by date (newest first) and get the 5 most recent
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  
  // Render recent expenses
  recentExpenses.forEach(expense => {
    const color = categoryColors[expense.category] || '#8338EC';
    
    const expenseItem = document.createElement('div');
    expenseItem.className = 'expense-item';
    expenseItem.style.borderLeftColor = color;
    expenseItem.innerHTML = `
      <div class="expense-info">
        <h4>${expense.category}</h4>
        <div class="expense-date">${formatDate(expense.date)}</div>
        <div>${expense.description || '-'}</div>
      </div>
      <div class="expense-amount">${formatCurrency(expense.amount)}</div>
    `;
    
    recentExpensesList.appendChild(expenseItem);
  });
  
  if (recentExpenses.length === 0) {
    recentExpensesList.innerHTML = '<div style="text-align: center; color: var(--text-light);">No expenses yet</div>';
  }
}

// Report Functions
async function generateReport(startDate, endDate) {
  try {
    const response = await fetch(`${EXPENSES_URL}/report?startDate=${startDate}&endDate=${endDate}`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Show results section
      reportResults.classList.remove('hide');
      
      // Update date range
      document.getElementById('reportDateRange').textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
      
      // Update total
      document.getElementById('reportTotal').textContent = formatCurrency(data.total);
      
      // Update category chart
      renderCategoryChart(data.categorySummary);
      
      // Update expense list
      renderReportExpenses(data.expenses);
      
      return true;
    } else {
      const errorData = await response.json();
      showToast(errorData.message || 'Failed to generate report', 'error');
      return false;
    }
  } catch (error) {
    console.error('Generate report error:', error);
    showToast('An error occurred while generating the report', 'error');
    return false;
  }
}

function renderCategoryChart(categorySummary) {
  const categoryChart = document.getElementById('categoryChart');
  categoryChart.innerHTML = '';
  
  if (categorySummary.length === 0) {
    categoryChart.innerHTML = '<div style="text-align: center; color: var(--text-light);">No expense data available</div>';
    return;
  }
  
  // Sort categories by total amount (descending)
  categorySummary.sort((a, b) => b.total - a.total);
  
  // Render chart items
  categorySummary.forEach(category => {
    const color = categoryColors[category.category] || '#8338EC';
    
    const chartItem = document.createElement('div');
    chartItem.className = 'chart-item';
    chartItem.innerHTML = `
      <div class="chart-color" style="background-color: ${color};"></div>
      <span class="chart-label">${category.category}</span>
      <span class="chart-value">${formatCurrency(category.total)}</span>
    `;
    
    categoryChart.appendChild(chartItem);
  });
}

function renderReportExpenses(reportExpenses) {
  const reportExpensesList = document.getElementById('reportExpensesList');
  reportExpensesList.innerHTML = '';
  
  if (reportExpenses.length === 0) {
    reportExpensesList.innerHTML = '<div class="expense-row"><div class="expense-cell" style="width:100%; text-align:center;">No expenses found</div></div>';
    return;
  }
  
  // Sort expenses by date (newest first)
  reportExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Render expense rows
  reportExpenses.forEach(expense => {
    const row = document.createElement('div');
    row.className = 'expense-row';
    
    row.innerHTML = `
      <div class="expense-cell date-cell">${formatDate(expense.date)}</div>
      <div class="expense-cell category-cell">${expense.category}</div>
      <div class="expense-cell description-cell">${expense.description || '-'}</div>
      <div class="expense-cell amount-cell">${formatCurrency(expense.amount)}</div>
    `;
    
    reportExpensesList.appendChild(row);
  });
}

// Print report
function printReport() {
  const printWindow = window.open('', '_blank');
  const reportDateRange = document.getElementById('reportDateRange').textContent;
  const reportTotal = document.getElementById('reportTotal').textContent;
  
  // Get report content
  const categoryChart = document.getElementById('categoryChart').innerHTML;
  const reportExpensesList = document.getElementById('reportExpensesList').innerHTML;
  
  // Create print document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Expense Report: ${reportDateRange}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2, h3 { color: #333; }
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .report-content { display: flex; flex-direction: column; gap: 20px; }
        .chart-item { display: flex; align-items: center; margin-bottom: 10px; }
        .chart-color { width: 16px; height: 16px; margin-right: 10px; }
        .chart-label { flex: 1; }
        .chart-value { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .expense-row { margin-bottom: 5px; }
        .total { font-weight: bold; font-size: 1.2em; margin-top: 20px; text-align: right; }
        @media print {
          body { margin: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Expense Report</h1>
        <div>
          <p><strong>Date Range:</strong> ${reportDateRange}</p>
          <p><strong>Total:</strong> ${reportTotal}</p>
        </div>
      </div>
      
      <div class="report-content">
        <div>
          <h2>Expenses by Category</h2>
          <div>${categoryChart}</div>
        </div>
        
        <div>
          <h2>Expense Details</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${reportExpensesList.replace(/expense-cell/g, '').replace(/expense-row/g, 'expense-row')}
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="total">
        Total: ${reportTotal}
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
}

// AI Chat Functions
function toggleChat() {
  isChatOpen = !isChatOpen;
  if (isChatOpen) {
    chatContainer.classList.add('open');
    chatInput.focus();
  } else {
    chatContainer.classList.remove('open');
  }
}

function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
    
    if (isUser) {
        messageDiv.textContent = content;
    } else {
        // Parse markdown for AI messages
        messageDiv.innerHTML = md.render(content);
        
        // Add markdown-specific styles
        messageDiv.classList.add('markdown-content');
        
        // Style code blocks
        messageDiv.querySelectorAll('code').forEach(code => {
            if (code.parentElement.tagName === 'PRE') {
                code.parentElement.classList.add('code-block');
            } else {
                code.classList.add('inline-code');
            }
        });
    }
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'typing-indicator';
  typingDiv.id = 'typingIndicator';
  
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    typingDiv.appendChild(dot);
  }
  
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

async function sendChatMessage(message) {
  if (!message.trim() || isWaitingForResponse) return;
  
  console.log('Sending chat message:', message);
  console.log('API URL:', `${API_URL}/chat`);
  
  // Add user message to chat
  addMessage(message, true);
  
  // Clear input
  chatInput.value = '';
  
  // Show typing indicator
  showTypingIndicator();
  
  // Set waiting flag
  isWaitingForResponse = true;
  
  try {
    // Send message to backend
    console.log('Making fetch request...');
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message }),
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    
    // Remove typing indicator
    removeTypingIndicator();
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
      addMessage(data.response);
    } else {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      addMessage('Sorry, I had trouble processing your request. Please try again later.');
    }
  } catch (error) {
    console.error('Chat error:', error);
    removeTypingIndicator();
    addMessage('Sorry, I had trouble processing your request. Please try again later.');
  } finally {
    isWaitingForResponse = false;
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Check auth status on load
  checkAuth();
  
  // Tab switching
  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hide');
    registerForm.classList.add('hide');
  });
  
  registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hide');
    loginForm.classList.add('hide');
  });
  
  // Login form
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    login(username, password);
  });
  
  // Register form
  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
      registerError.textContent = 'All fields are required';
      return;
    }
    
    if (password !== confirmPassword) {
      registerError.textContent = 'Passwords do not match';
      return;
    }
    
    register(username, email, password);
  });
  
  // Logout
  logoutBtn.addEventListener('click', logout);
  
  // Navigation
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      showPage(btn.dataset.page);
    });
  });
  
  // Add expense form
  expenseForm.addEventListener('submit', async e => {
    e.preventDefault();
    const amount = document.getElementById('expenseAmount').value;
    const category = document.getElementById('expenseCategory').value;
    const description = document.getElementById('expenseDescription').value;
    const date = document.getElementById('expenseDate').value;
    
    if (await addExpense(amount, category, description, date)) {
      // Refresh dashboard after adding expense
      loadDashboard();
    }
  });
  
  // Edit expense form
  editExpenseForm.addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('editExpenseId').value;
    const amount = document.getElementById('editExpenseAmount').value;
    const category = document.getElementById('editExpenseCategory').value;
    const description = document.getElementById('editExpenseDescription').value;
    const date = document.getElementById('editExpenseDate').value;
    
    if (await updateExpense(id, amount, category, description, date)) {
      // Refresh expenses and dashboard after update
      loadExpenses();
      loadDashboard();
    }
  });
  
  // Delete expense
  confirmDeleteBtn.addEventListener('click', async () => {
    const id = document.getElementById('deleteExpenseId').value;
    
    if (await deleteExpense(id)) {
      // Refresh expenses and dashboard after delete
      loadExpenses();
      loadDashboard();
    }
  });
  
  // Filter expenses
  document.getElementById('filterCategory').addEventListener('change', filterExpenses);
  document.getElementById('sortBy').addEventListener('change', filterExpenses);
  
  // Report form
  reportForm.addEventListener('submit', async e => {
    e.preventDefault();
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    await generateReport(startDate, endDate);
  });
  
  // Print report
  document.getElementById('printReportBtn').addEventListener('click', printReport);
  
  // Modal close buttons
  closeEditModal.addEventListener('click', () => hideModal(editExpenseModal));
  closeDeleteModal.addEventListener('click', () => hideModal(deleteConfirmationModal));
  cancelDeleteBtn.addEventListener('click', () => hideModal(deleteConfirmationModal));
  
  // Chat functionality
  chatButton.addEventListener('click', toggleChat);
  chatClose.addEventListener('click', toggleChat);
  
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage(chatInput.value);
    }
  });
  
  chatSend.addEventListener('click', () => {
    sendChatMessage(chatInput.value);
  });
  
  // Close chat when clicking outside
  document.addEventListener('click', (e) => {
    if (isChatOpen && 
        !chatContainer.contains(e.target) && 
        !chatButton.contains(e.target)) {
      toggleChat();
    }
  });
}); 