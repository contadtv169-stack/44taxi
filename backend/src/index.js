require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const ridesRoutes = require('./routes/rides');
const foodRoutes = require('./routes/food');
const paymentsRoutes = require('./routes/payments');
const driversRoutes = require('./routes/drivers');
const restaurantsRoutes = require('./routes/restaurants');
const adminRoutes = require('./routes/admin');
const earningsRoutes = require('./routes/earnings');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/earnings', earningsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', app: '44Taxi' });
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  socket.on('join-ride', (rideId) => socket.join(`ride-${rideId}`));
  socket.on('join-order', (orderId) => socket.join(`order-${orderId}`));
  socket.on('driver-location', (data) => {
    io.to(`ride-${data.rideId}`).emit('location-update', data);
  });
  socket.on('disconnect', () => console.log('Cliente desconectado:', socket.id));
});

app.set('io', io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`44Taxi API rodando na porta ${PORT}`);
});
