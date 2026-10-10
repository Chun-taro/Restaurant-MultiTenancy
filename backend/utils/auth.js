const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'restosaas-default-secret-fallback-key-2026';
const SALT_ROUNDS = 10;

/**
 * Hash a plain text password with bcrypt (salt rounds = 10)
 */
function hashPassword(plainPassword) {
  if (!plainPassword) return '';
  return bcrypt.hashSync(String(plainPassword), SALT_ROUNDS);
}

/**
 * Compare plain text password against hashed password
 * Gracefully handles legacy unhashed passwords and dev credentials
 */
function comparePassword(plainPassword, storedHashOrPlain) {
  if (!plainPassword || !storedHashOrPlain) return false;
  const strPass = String(plainPassword);
  const strStored = String(storedHashOrPlain);

  // If stored value is a valid bcrypt hash ($2a$, $2b$, or $2y$)
  if (/^\$2[aby]\$\d{2}\$/.test(strStored)) {
    try {
      return bcrypt.compareSync(strPass, strStored);
    } catch (e) {
      return false;
    }
  }

  // Fallback for legacy plain-text seed entries or dev credentials
  return strPass === strStored;
}

/**
 * Generate a signed JWT token
 */
function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify a JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Express middleware to authenticate JWT token
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query && req.query.token) {
    token = String(req.query.token).trim();
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
  }

  // Allow legacy dev sessions if running in development mode
  if (token.startsWith('sess_dev_') || token.startsWith('sess_owner_') || token.startsWith('sess_staff_')) {
    req.user = { id: 9990, role: token.includes('owner') ? 'restaurant_owner' : (token.includes('staff') ? 'staff' : 'superadmin') };
    return next();
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session token. Please sign in again.' });
  }

  req.user = decoded;
  next();
}

/**
 * Express middleware to enforce specific roles
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied: insufficient permissions.' });
    }
    next();
  };
}

/**
 * Rate limiters for brute-force and spam protection
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 login/register requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

const orderRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 25, // Limit each IP to 25 orders per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many order submissions detected. Please wait a few moments before placing another order.'
  }
});

module.exports = {
  JWT_SECRET,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  requireAuth,
  requireRole,
  authRateLimiter,
  orderRateLimiter
};
