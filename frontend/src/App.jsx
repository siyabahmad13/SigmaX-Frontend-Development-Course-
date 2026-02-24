import { Link, Route, Routes } from 'react-router-dom';
import RoleGuard from './components/RoleGuard.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { useAuth } from './context/AuthContext.jsx';

const modules = {
  patient: ['Find doctors by city/specialty', 'Book appointments with idempotency', 'Track emergency case state'],
  doctor: ['Toggle live availability', 'See daily schedule & queue', 'Review patient history snapshot'],
  hospital_admin: ['Manage departments and doctor affiliation', 'Monitor bed capacity + triage', 'Emergency dispatch acknowledgement'],
  emergency_operator: ['Raise SOS tickets', 'Dispatch nearest capable hospital', 'Track raised → closed lifecycle']
};

export default function App() {
  const { user, loginAsRole, logout } = useAuth();

  return (
    <main className="container">
      <h1>Scalable Healthcare System (Pakistan)</h1>
      <p>Modular monolith starter supporting patient, doctor, hospital admin, and emergency console.</p>

      <nav className="roles">
        {Object.keys(modules).map((role) => (
          <button key={role} onClick={() => loginAsRole(role)}>{role}</button>
        ))}
        <button onClick={logout}>logout</button>
      </nav>

      <p>Current role: <strong>{user?.role || 'guest'}</strong></p>

      <div className="links">
        <Link to="/patient">Patient</Link>
        <Link to="/doctor">Doctor</Link>
        <Link to="/admin">Hospital Admin</Link>
        <Link to="/emergency">Emergency Console</Link>
      </div>

      <Routes>
        <Route path="/" element={<p>Select a role then open a portal.</p>} />
        <Route
          path="/patient"
          element={
            <RoleGuard allowedRoles={['patient']}>
              <Dashboard title="Patient App" features={modules.patient} />
            </RoleGuard>
          }
        />
        <Route
          path="/doctor"
          element={
            <RoleGuard allowedRoles={['doctor']}>
              <Dashboard title="Doctor Portal" features={modules.doctor} />
            </RoleGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleGuard allowedRoles={['hospital_admin']}>
              <Dashboard title="Hospital Admin Panel" features={modules.hospital_admin} />
            </RoleGuard>
          }
        />
        <Route
          path="/emergency"
          element={
            <RoleGuard allowedRoles={['emergency_operator']}>
              <Dashboard title="Emergency Command Console" features={modules.emergency_operator} />
            </RoleGuard>
          }
        />
      </Routes>
    </main>
  );
}
