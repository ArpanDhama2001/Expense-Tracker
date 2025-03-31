const { pool } = require('../config/database');

class Expense {
  static async create(userId, amount, category, description, date) {
    try {
      const [result] = await pool.query(
        'INSERT INTO expenses (user_id, amount, category, description, date) VALUES (?, ?, ?, ?, ?)',
        [userId, amount, category, description, date]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC',
        [userId]
      );
      return rows;
    } catch (error) {
      console.error('Error finding expenses by user id:', error);
      throw error;
    }
  }

  static async findByDateRange(userId, startDate, endDate) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM expenses WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC',
        [userId, startDate, endDate]
      );
      return rows;
    } catch (error) {
      console.error('Error finding expenses by date range:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ?', [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding expense by id:', error);
      throw error;
    }
  }

  static async update(id, amount, category, description, date) {
    try {
      const [result] = await pool.query(
        'UPDATE expenses SET amount = ?, category = ?, description = ?, date = ? WHERE id = ?',
        [amount, category, description, date, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM expenses WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  static async getSummaryByCategory(userId) {
    try {
      const [rows] = await pool.query(
        'SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category',
        [userId]
      );
      return rows;
    } catch (error) {
      console.error('Error getting expense summary by category:', error);
      throw error;
    }
  }
}

module.exports = Expense; 