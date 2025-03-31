const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { isAuthenticated } = require('../middleware/auth');

// Apply auth middleware to all expense routes
router.use(isAuthenticated);

// Get all expenses for current user
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.findByUserId(req.session.userId);
    res.json({ expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error while fetching expenses' });
  }
});

// Get expenses by date range
router.get('/report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const expenses = await Expense.findByDateRange(req.session.userId, startDate, endDate);
    
    // Calculate total
    const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    // Get category summary
    const categorySummary = await Expense.getSummaryByCategory(req.session.userId);
    
    res.json({ 
      expenses,
      total,
      categorySummary,
      startDate,
      endDate
    });
  } catch (error) {
    console.error('Get expense report error:', error);
    res.status(500).json({ message: 'Server error while generating report' });
  }
});

// Create new expense
router.post('/', async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;
    
    // Validate input
    if (!amount || !category || !date) {
      return res.status(400).json({ message: 'Amount, category, and date are required' });
    }
    
    const expenseId = await Expense.create(
      req.session.userId,
      amount,
      category,
      description || '',
      date
    );
    
    res.status(201).json({ 
      message: 'Expense created successfully',
      expenseId
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error while creating expense' });
  }
});

// Get single expense
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Check if expense belongs to current user
    if (expense.user_id !== req.session.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json({ expense });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error while fetching expense' });
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;
    const expenseId = req.params.id;
    
    // Validate input
    if (!amount || !category || !date) {
      return res.status(400).json({ message: 'Amount, category, and date are required' });
    }
    
    // Get expense to check ownership
    const expense = await Expense.findById(expenseId);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Check if expense belongs to current user
    if (expense.user_id !== req.session.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const success = await Expense.update(
      expenseId,
      amount,
      category,
      description || '',
      date
    );
    
    if (success) {
      res.json({ message: 'Expense updated successfully' });
    } else {
      res.status(500).json({ message: 'Failed to update expense' });
    }
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error while updating expense' });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const expenseId = req.params.id;
    
    // Get expense to check ownership
    const expense = await Expense.findById(expenseId);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Check if expense belongs to current user
    if (expense.user_id !== req.session.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const success = await Expense.delete(expenseId);
    
    if (success) {
      res.json({ message: 'Expense deleted successfully' });
    } else {
      res.status(500).json({ message: 'Failed to delete expense' });
    }
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error while deleting expense' });
  }
});

module.exports = router; 