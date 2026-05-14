import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import connectDB from './src/config/db.js';
import './src/config/passport.js';

import authRoutes from './src/routes/authRoutes.js';
import tailorRoutes from './src/routes/tailorRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.get('/api/health', (_, res) => res.json({ status: 'Stiched API is running' }));

app.use('/api/auth', authRoutes);
app.use('/api/tailors', tailorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log(`Stiched server running on port ${PORT}`));
