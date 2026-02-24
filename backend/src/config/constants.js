export const PORT = process.env.PORT || 4000;
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  HOSPITAL_ADMIN: 'hospital_admin',
  EMERGENCY_OPERATOR: 'emergency_operator',
  SUPER_ADMIN: 'super_admin'
};

export const WS_EVENTS = {
  DOCTOR_AVAILABILITY_UPDATED: 'doctor.availability.updated',
  APPOINTMENT_QUEUE_UPDATED: 'appointment.queue.updated',
  EMERGENCY_CASE_UPDATED: 'emergency.case.updated',
  HOSPITAL_CAPACITY_UPDATED: 'hospital.capacity.updated'
};
