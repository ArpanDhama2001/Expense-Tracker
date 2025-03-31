const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async findByUsername(username) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = ?', [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  static async create(username, email, password) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert user into database
      const [result] = await pool.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async validatePassword(user, password) {
    try {
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error('Error validating password:', error);
      throw error;
    }
  }
}

module.exports = User; 