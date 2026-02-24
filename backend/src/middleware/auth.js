import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants.js';
import { db } from '../services/store.js';

export const authRequired = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.users.find((u) => u.id === decoded.sub);
    if (!user) return res.status(401).json({ message: 'Invalid user' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
};
