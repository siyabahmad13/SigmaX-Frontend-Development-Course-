import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { createAppointment, db } from '../services/store.js';
import { WS_EVENTS } from '../config/constants.js';

const router = Router();

router.post('/', authRequired, (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'];
  if (!idempotencyKey) return res.status(400).json({ message: 'Idempotency-Key header required' });

  const existing = db.appointments.find((a) => a.idempotencyKey === idempotencyKey);
  if (existing) return res.json(existing);

  const appointment = createAppointment({ ...req.body, idempotencyKey }, req.user.id);
  req.app.locals.broadcast(WS_EVENTS.APPOINTMENT_QUEUE_UPDATED, appointment);
  return res.status(201).json(appointment);
});

router.get('/:id', authRequired, (req, res) => {
  const appointment = db.appointments.find((a) => a.id === req.params.id);
  if (!appointment) return res.status(404).json({ message: 'not found' });
  return res.json(appointment);
});

router.post('/:id/cancel', authRequired, (req, res) => {
  const appointment = db.appointments.find((a) => a.id === req.params.id);
  if (!appointment) return res.status(404).json({ message: 'not found' });
  appointment.status = 'cancelled';
  req.app.locals.broadcast(WS_EVENTS.APPOINTMENT_QUEUE_UPDATED, appointment);
  return res.json(appointment);
});

export default router;
