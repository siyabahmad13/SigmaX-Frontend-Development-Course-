import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants.js';
import { db } from '../services/store.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { phone, email, password, role = 'patient' } = req.body;
  if (!phone || !password) return res.status(400).json({ message: 'phone and password required' });
  if (db.users.find((u) => u.phone === phone)) return res.status(409).json({ message: 'already exists' });

  const user = { id: crypto.randomUUID(), phone, email, password, role };
  db.users.push(user);
  res.status(201).json({ id: user.id, phone: user.phone, role: user.role });
});

router.post('/login', (req, res) => {
  const { phone, password } = req.body;
  const user = db.users.find((u) => u.phone === phone && u.password === password);
  if (!user) return res.status(401).json({ message: 'invalid credentials' });

  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ accessToken: token, user: { id: user.id, role: user.role, email: user.email, phone: user.phone } });
});

router.get('/users/me', authRequired, (req, res) => {
  const { id, role, email, phone } = req.user;
  res.json({ id, role, email, phone });
});

export default router;
