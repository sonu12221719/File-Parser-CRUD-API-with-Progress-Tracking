import express from 'express';
import morgan from 'morgan';
import 'dotenv/config';
import { connectDB } from './config/db.js';
import fileRoutes from './routes/fileRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

await connectDB();

const app = express();
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

// Auth endpoints
app.use('/auth', authRoutes);

// File endpoints
app.use('/files', fileRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
});