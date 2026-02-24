CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone varchar(20) UNIQUE NOT NULL,
  email varchar(255) UNIQUE,
  password_hash text NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'pending_verification',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id serial PRIMARY KEY,
  name varchar(64) UNIQUE NOT NULL
);

CREATE TABLE user_roles (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role_id int REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE REFERENCES users(id),
  full_name varchar(255) NOT NULL,
  dob date,
  gender varchar(20),
  blood_group varchar(8),
  cnic_encrypted bytea,
  address text,
  city varchar(100),
  province varchar(100)
);

CREATE TABLE hospitals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(255) NOT NULL,
  license_no varchar(100),
  ntn varchar(100),
  address text,
  city varchar(100),
  province varchar(100),
  lat numeric,
  lng numeric,
  is_emergency_enabled boolean DEFAULT false
);

CREATE TABLE doctors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE REFERENCES users(id),
  pmc_license_no varchar(100) UNIQUE,
  specialty varchar(100),
  years_experience int,
  consultation_fee numeric,
  is_verified boolean DEFAULT false
);

CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id),
  doctor_id uuid REFERENCES doctors(id),
  hospital_id uuid REFERENCES hospitals(id),
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  mode varchar(32) NOT NULL,
  status varchar(32) NOT NULL,
  reason text,
  created_by uuid REFERENCES users(id)
);

CREATE TABLE emergency_cases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id),
  reporter_phone varchar(20),
  severity varchar(20),
  symptoms_json jsonb,
  lat numeric,
  lng numeric,
  nearest_hospital_id uuid REFERENCES hospitals(id),
  status varchar(32) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE INDEX idx_appointments_doctor_start ON appointments (doctor_id, scheduled_start);
CREATE INDEX idx_appointments_patient_start ON appointments (patient_id, scheduled_start DESC);
CREATE INDEX idx_doctors_specialty ON doctors (specialty);
CREATE INDEX idx_hospitals_city_province ON hospitals (city, province);
CREATE INDEX idx_emergency_geo ON emergency_cases (lat, lng);
