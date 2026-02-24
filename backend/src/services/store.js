import { v4 as uuid } from 'uuid';
import { ROLES } from '../config/constants.js';

const now = () => new Date().toISOString();

export const db = {
  users: [
    { id: uuid(), phone: '03000000001', email: 'patient@health.pk', password: 'demo123', role: ROLES.PATIENT },
    { id: uuid(), phone: '03000000002', email: 'doctor@health.pk', password: 'demo123', role: ROLES.DOCTOR },
    { id: uuid(), phone: '03000000003', email: 'admin@health.pk', password: 'demo123', role: ROLES.HOSPITAL_ADMIN },
    { id: uuid(), phone: '03000000004', email: 'ops@health.pk', password: 'demo123', role: ROLES.EMERGENCY_OPERATOR }
  ],
  doctors: [
    { id: uuid(), fullName: 'Dr. Aisha Khan', specialty: 'Cardiology', city: 'Karachi', language: 'Urdu', available: true, hospitalId: 'hosp-1' },
    { id: uuid(), fullName: 'Dr. Bilal Ahmed', specialty: 'General Medicine', city: 'Lahore', language: 'English', available: false, hospitalId: 'hosp-2' }
  ],
  hospitals: [
    { id: 'hosp-1', name: 'Jinnah Hospital', city: 'Karachi', province: 'Sindh', isEmergencyEnabled: true },
    { id: 'hosp-2', name: 'Mayo Hospital', city: 'Lahore', province: 'Punjab', isEmergencyEnabled: true }
  ],
  appointments: [],
  emergencyCases: []
};

export const createAppointment = (payload, createdBy) => {
  const appointment = {
    id: uuid(),
    status: 'booked',
    createdAt: now(),
    ...payload,
    createdBy
  };
  db.appointments.push(appointment);
  return appointment;
};

export const updateDoctorAvailability = (doctorId, currentState) => {
  const doctor = db.doctors.find((d) => d.id === doctorId);
  if (!doctor) return null;
  doctor.available = currentState === 'available';
  doctor.currentState = currentState;
  doctor.lastHeartbeatAt = now();
  return doctor;
};

export const createEmergencyCase = (payload) => {
  const emergencyCase = {
    id: uuid(),
    status: 'raised',
    createdAt: now(),
    ...payload
  };
  db.emergencyCases.push(emergencyCase);
  return emergencyCase;
};
