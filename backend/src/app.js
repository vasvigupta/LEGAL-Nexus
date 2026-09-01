const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/env');
const apiRoutes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();

// Security Headers
app.use(helmet());

// Allowed origins for CORS (supports dynamic dev ports like 5173, 5174 and clientUrl)
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        config.env === 'development'
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Request Logging
if (config.env !== 'test') {
  app.use(morgan('combined'));
}

// Global API Rate Limiter
app.use('/api', apiLimiter);

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Legal Nexus API',
    description: 'AI-Powered Legal Tech & Case Intelligence Platform for India',
    version: '1.0.0',
    documentation: '/docs',
    healthCheck: '/api/health',
  });
});

// Main API Routes
app.use('/api', apiRoutes);

// Catch 404
app.use(notFoundHandler);

// Centralized Error Handling
app.use(globalErrorHandler);

module.exports = app;
