// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized: Please log in to access this resource' });
}

// Guest middleware (only accessible if not logged in)
function isGuest(req, res, next) {
  if (!req.session || !req.session.userId) {
    return next();
  }
  return res.status(403).json({ message: 'Already logged in' });
}

module.exports = {
  isAuthenticated,
  isGuest
}; 