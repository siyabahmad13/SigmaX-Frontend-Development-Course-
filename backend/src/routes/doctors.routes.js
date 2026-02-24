import { Router } from 'express';
import { authRequired, requireRoles } from '../middleware/auth.js';
import { db, updateDoctorAvailability } from '../services/store.js';
import { ROLES, WS_EVENTS } from '../config/constants.js';

const router = Router();

router.get('/', (req, res) => {
  const { city, specialty, language, available_now } = req.query;
  let doctors = [...db.doctors];
  if (city) doctors = doctors.filter((d) => d.city.toLowerCase() === city.toLowerCase());
  if (specialty) doctors = doctors.filter((d) => d.specialty.toLowerCase().includes(specialty.toLowerCase()));
  if (language) doctors = doctors.filter((d) => d.language.toLowerCase() === language.toLowerCase());
  if (available_now !== undefined) doctors = doctors.filter((d) => d.available === (available_now === 'true'));

  res.json(doctors);
});

router.put('/me/availability', authRequired, requireRoles(ROLES.DOCTOR), (req, res) => {
  const { doctorId, state } = req.body;
  const doctor = updateDoctorAvailability(doctorId, state);
  if (!doctor) return res.status(404).json({ message: 'doctor not found' });

  req.app.locals.broadcast(WS_EVENTS.DOCTOR_AVAILABILITY_UPDATED, doctor);
  return res.json(doctor);
});

export default router;
