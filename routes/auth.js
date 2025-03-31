const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isGuest, isAuthenticated } = require('../middleware/auth');

// Register route
router.post('/register', isGuest, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if username exists
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Check if email exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Create user
    const userId = await User.create(username, email, password);
    
    res.status(201).json({ 
      message: 'User registered successfully',
      userId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login route
router.post('/login', isGuest, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Validate password
    const isValid = await User.validatePassword(user, password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Set session
    req.session.userId = user.id;
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout route
router.post('/logout', isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error during logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.session.destroy();
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 