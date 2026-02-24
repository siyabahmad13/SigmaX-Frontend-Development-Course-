import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { createEmergencyCase, db } from '../services/store.js';
import { WS_EVENTS } from '../config/constants.js';

const router = Router();

router.post('/cases', authRequired, (req, res) => {
  const emergencyCase = createEmergencyCase(req.body);
  req.app.locals.broadcast(WS_EVENTS.EMERGENCY_CASE_UPDATED, emergencyCase);
  return res.status(201).json(emergencyCase);
});

router.get('/cases/:id', authRequired, (req, res) => {
  const emergencyCase = db.emergencyCases.find((item) => item.id === req.params.id);
  if (!emergencyCase) return res.status(404).json({ message: 'not found' });
  return res.json(emergencyCase);
});

router.post('/cases/:id/:action(triage|dispatch|close)', authRequired, (req, res) => {
  const emergencyCase = db.emergencyCases.find((item) => item.id === req.params.id);
  if (!emergencyCase) return res.status(404).json({ message: 'not found' });

  const transitions = { triage: 'triaged', dispatch: 'dispatched', close: 'closed' };
  emergencyCase.status = transitions[req.params.action];
  emergencyCase.updatedAt = new Date().toISOString();
  req.app.locals.broadcast(WS_EVENTS.EMERGENCY_CASE_UPDATED, emergencyCase);
  return res.json(emergencyCase);
});

export default router;
