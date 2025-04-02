const express = require('express');
const router = express.Router();
const { handleChatMessage } = require('../controllers/aiChat');
const { isAuthenticated } = require('../middleware/auth');

// Apply auth middleware
router.use(isAuthenticated);

// Process chat message
router.post('/', handleChatMessage);

module.exports = router; 