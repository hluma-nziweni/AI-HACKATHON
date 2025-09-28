const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const assistantRoutes = require('./routes/assistant');
const passport = require('./config/passport');
const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['POST', 'GET', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: "Too many requests, please try again later" }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Too many authorisation attempts, please try again later" }
});

app.use(generalLimiter);

app.use('/api/auth/login', authLimiter);    
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/google', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assistant', assistantRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Harmonai is running!', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy' });
});

module.exports = app;
