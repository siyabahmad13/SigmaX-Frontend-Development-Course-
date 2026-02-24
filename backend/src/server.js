import http from 'http';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { PORT } from './config/constants.js';
import authRoutes from './routes/auth.routes.js';
import doctorsRoutes from './routes/doctors.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import emergencyRoutes from './routes/emergency.routes.js';
import { attachWebsocket } from './ws/socketServer.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_, res) => res.json({ ok: true }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/doctors', doctorsRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/v1/emergency', emergencyRoutes);

const server = http.createServer(app);
const { broadcast } = attachWebsocket(server);
app.locals.broadcast = broadcast;

server.listen(PORT, () => {
  console.log(`Healthcare API running on :${PORT}`);
});
