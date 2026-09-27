import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/server/routes/authRoutes.js';
import accessRequestRoutes from './src/server/routes/accessRequestRoutes.js';
import activeAccessRoutes from './src/server/routes/activeAccessRoutes.js';
import emergencyRoutes from './src/server/routes/emergencyRoutes.js';
import auditRoutes from './src/server/routes/auditRoutes.js';
import notificationRoutes from './src/server/routes/notificationRoutes.js';
import adminRoutes from './src/server/routes/adminRoutes.js';
import { initDatabaseConnection, checkDatabaseHealth } from './src/server/config/database.js';
import { azurePimService } from './src/server/services/azurePimService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Requirement 4: PORT resolution for Azure App Service
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Requirement 16: Environment-based and Azure-safe CORS configuration
const configuredFrontendUrl = (process.env.FRONTEND_URL || '').trim().replace(/\/+$/, '');
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = new Set(
  [
    configuredFrontendUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].filter(Boolean)
);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. same-origin requests, mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.trim().replace(/\/+$/, '');

    // Allow configured origin and recognized local development ports
    if (allowedOrigins.has(cleanOrigin)) {
      return callback(null, true);
    }

    // Allow Azure App Service default domain pattern
    if (cleanOrigin.endsWith('.azurewebsites.net')) {
      return callback(null, true);
    }

    // In production, also allow same-host origins (or if behind reverse proxy / container)
    try {
      if (configuredFrontendUrl) {
        const originHost = new URL(cleanOrigin).host;
        const configuredHost = new URL(configuredFrontendUrl).host;
        if (originHost === configuredHost) {
          return callback(null, true);
        }
      }
    } catch {}

    // Allow in development mode for seamless local tooling
    if (!isProduction) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json());

/**
 * Health check endpoint - Requirement 11
 * Returns healthy only when application and database are available
 */
app.get('/api/health', async (req, res) => {
  const isConnected = await checkDatabaseHealth();
  const pimInfo = azurePimService.getProviderInfo();
  if (isConnected) {
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      product: 'SecureJIT',
      pimProvider: pimInfo.label,
      isPimSimulated: !pimInfo.isLive,
    });
  } else {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      product: 'SecureJIT',
      pimProvider: pimInfo.label,
      isPimSimulated: !pimInfo.isLive,
    });
  }
});

// Guard: If database is disconnected, return 503 on API requests instead of crashing or serving fake data
app.use('/api', async (req, res, next) => {
  if (req.path === '/health') return next();
  const healthy = await checkDatabaseHealth();
  if (!healthy) {
    return res.status(503).json({
      status: 'error',
      database: 'disconnected',
      product: 'SecureJIT',
      message: 'SecureJIT server is unavailable. Please make sure the backend and database are running.'
    });
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/access-requests', accessRequestRoutes);
app.use('/api/active-access', activeAccessRoutes);
app.use('/api/emergency-access', emergencyRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Centralized API 404 handler for unknown /api/* endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: 'ENDPOINT_NOT_FOUND',
    message: `API route ${req.method} ${req.originalUrl} does not exist.`
  });
});

// Global API error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SecureJIT Server Error]', err);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An internal server error occurred. Please contact the security team if this persists.'
  });
});

// Frontend Vite Integration (Development vs Production SPA)
async function startServer() {
  // Requirement 6 & 7: Connect to PostgreSQL and verify schema
  // Halts startup with exit code 1 if connection fails or DATABASE_URL is missing
  const dbOk = await initDatabaseConnection();

  if (!dbOk) {
    console.error('================================================================================');
    console.error('FATAL: SecureJIT failed to start because PostgreSQL is unavailable.');
    console.error('Please configure a valid DATABASE_URL in your Azure App Service Application Settings.');
    console.error('================================================================================');
    process.exit(1);
  }

  // Requirement 5: In production, Express serves built static assets from dist/ and handles SPA routes
  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    // Production SPA Routing: All non-API GET requests return dist/index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Development mode: Mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Requirement 4: Listen on PORT
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SecureJIT] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[SecureJIT] Backed exclusively by PostgreSQL database.`);
  });
}

startServer().catch((err) => {
  console.error('[SecureJIT] Fatal startup failure:', err);
  process.exit(1);
});
