import express from 'express';
import cors from 'cors';
import passport from 'passport';
import './config/passport.js';

import authRoutes from './routes/authRoutes.js';
import tailorRoutes from './routes/tailorRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

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

export default app;
