import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

// Import Routes
import authRoutes from './routes/auth-routes.js';
import uploadRoutes from './routes/upload-routes.js';
import attemptRoutes from './routes/attempt-routes.js';
import bookmarkRoutes from './routes/bookmark-routes.js';
import adminRoutes from './routes/admin-routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'https://dfksjpdftcdbv.qzz.io',
  'https://pdf-test-converter-dqrgdth7z-bhavan75s-projects.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded PDF files statically
app.use('/uploads', express.static(uploadDir));

// Attach API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pdf', uploadRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/admin', adminRoutes);

// Base route for connectivity verification
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'PDF Test Converter API Server',
    version: '1.0.0',
    timestamp: new Date(),
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err.message || err);
  res.status(err.status || 500).json({
    error: err.message || 'An internal server error occurred',
  });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` PDF Test Converter API running on http://localhost:${PORT}`);
  console.log(`==================================================`);
});

export default app;
