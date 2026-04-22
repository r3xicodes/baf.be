require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(helmet()); // Security headers
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'default-dev-secret-change-in-production';
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATA_DIR = path.join(__dirname, 'data');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.log');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Session middleware with secure cookies
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Note: CSRF protection temporarily disabled to fix login issues
// Can be re-enabled later with proper configuration
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', (req, res, next) => {
  console.log(`[API] ${req.method} ${req.url} ip=${getClientIp(req)} body=${JSON.stringify(req.body)}`);
  next();
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Invalid JSON payload:', err.message);
    return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
  }
  next(err);
});

// Audit logging
function auditLog(action, username, details, success = true) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    username: username || 'anonymous',
    details,
    success
  };
  fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n');
  console.log('[AUDIT]', action, username, success ? 'OK' : 'FAIL');
}

const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const PENDING_FILE = path.join(DATA_DIR, 'pending.json');
const BANS_FILE = path.join(DATA_DIR, 'bans.json');

function readJSON(file, defaultValue) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
      return JSON.parse(JSON.stringify(defaultValue));
    }
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw || JSON.stringify(defaultValue));
  } catch (e) {
    console.error('readJSON error', file, e);
    return defaultValue;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

let accounts = readJSON(ACCOUNTS_FILE, []);
let pending = readJSON(PENDING_FILE, []);
let bans = readJSON(BANS_FILE, []);

// Initialize default demo accounts if none exist
if (!accounts || accounts.length === 0) {
  const now = new Date().toISOString();
  accounts = [
    {
      id: uuidv4(),
      username: 'admin',
      password: bcrypt.hashSync('admin2026', 10),
      role: 'Administrator',
      name: 'System Administrator',
      email: 'admin@local',
      clearance: 'TOP SECRET',
      createdAt: now
    },
    {
      id: uuidv4(),
      username: 'pilot',
      password: bcrypt.hashSync('pilot2026', 10),
      role: 'Pilot Officer',
      name: 'John Smith',
      email: 'pilot@local',
      clearance: 'SECRET',
      createdAt: now
    },
    {
      id: uuidv4(),
      username: 'commander',
      password: bcrypt.hashSync('cmdr2026', 10),
      role: 'Wing Commander',
      name: 'Sarah Johnson',
      email: 'commander@local',
      clearance: 'TOP SECRET',
      createdAt: now
    }
  ];
  writeJSON(ACCOUNTS_FILE, accounts);
}

// Mailer setup
let transporter;
async function initMailer() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    console.log('✓ Using SMTP host:', process.env.SMTP_HOST);
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
    console.log('✓ Using Nodemailer test account. Preview URLs logged here.');
  }
}

initMailer().catch(err => console.error('Mailer init failed', err));

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) ? req.socket.remoteAddress.replace('::ffff:', '') : '';
}

function saveAll() {
  try {
    writeJSON(ACCOUNTS_FILE, accounts);
    writeJSON(PENDING_FILE, pending);
    writeJSON(BANS_FILE, bans);
  } catch (e) { console.error('saveAll error', e); }
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user || !req.session.user.role) {
    auditLog('ADMIN_ACCESS_DENIED', req.session?.user?.username, 'No session', false);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const role = req.session.user.role;
  if (role !== 'Administrator' && role !== 'Wing Commander' && role !== 'Group Captain') {
    auditLog('ADMIN_ACCESS_DENIED', req.session.user.username, 'Insufficient role: ' + role, false);
    return res.status(403).json({ error: 'Insufficient permission' });
  }
  next();
}

// API: get CSRF token (disabled - return empty)
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: 'disabled' });
});

// API: register (stores pending request and records IP)
app.post('/api/register', (req, res) => {
  try {
    const ip = getClientIp(req) || 'unknown';
    if (bans.find(b => b.ip === ip)) {
      auditLog('REGISTER_BLOCKED_IP', 'unknown', ip, false);
      return res.status(403).json({ success: false, error: 'Your IP is banned' });
    }

    const payload = req.body || {};
    const { firstName, lastName, email, username, password, rank, unit, clearanceLevel, clearanceNumber, supervisor, emergencyContact, securityQuestion, securityAnswer } = payload;

    if (!email || !username || !password) return res.status(400).json({ success: false, error: 'Required fields missing' });

    // duplicate checks
    if (accounts.find(a => a.username === username || a.email === email) || pending.find(p => p.username === username || p.email === email)) {
      auditLog('REGISTER_DUPLICATE', username, email, false);
      return res.status(400).json({ success: false, error: 'Username or email already exists' });
    }

    const hashed = bcrypt.hashSync(password, 10);
    const id = 'p-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const entry = {
      id,
      username,
      passwordHash: hashed,
      firstName, lastName, email, rank, unit,
      clearance: clearanceLevel || '',
      clearanceNumber: clearanceNumber || '',
      supervisor: supervisor || '',
      emergencyContact: emergencyContact || '',
      securityQuestion: securityQuestion || '',
      securityAnswer: securityAnswer || '',
      ip,
      createdAt: new Date().toISOString()
    };

    pending.push(entry);
    saveAll();
    auditLog('REGISTER', username, ip, true);
    return res.json({ success: true, message: 'Account request submitted' });
  } catch (e) {
    console.error('register error', e);
    auditLog('REGISTER_ERROR', 'unknown', e.message, false);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// API: login
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    const ip = getClientIp(req) || 'unknown';
    
    if (!username || !password) {
      auditLog('LOGIN_MISSING_CREDENTIALS', 'unknown', ip, false);
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }
    if (bans.find(b => b.ip === ip)) {
      auditLog('LOGIN_BLOCKED_IP', username || 'unknown', ip, false);
      return res.status(403).json({ success: false, error: 'IP banned' });
    }

    const user = accounts.find(a => a.username === username || a.email === username);
    if (!user) {
      auditLog('LOGIN_USER_NOT_FOUND', username || 'unknown', ip, false);
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      auditLog('LOGIN_INVALID_PASSWORD', username, ip, false);
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    // Store user in session
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
      clearance: user.clearance
    };

    auditLog('LOGIN', username, ip, true);
    return res.json({
      success: true,
      user: req.session.user
    });
  } catch (e) {
    console.error('login error', e);
    auditLog('LOGIN_ERROR', 'unknown', e.message, false);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// API: logout
app.post('/api/logout', (req, res) => {
  const username = req.session?.user?.username || 'unknown';
  req.session.destroy(err => {
    if (err) console.error('logout error', err);
    auditLog('LOGOUT', username, 'User logged out', true);
    res.json({ success: true });
  });
});

// API: verify session
app.get('/api/session', (req, res) => {
  if (!req.session || !req.session.user) return res.json({ authenticated: false });
  res.json({ authenticated: true, user: req.session.user });
});

// API: get pending list (admin) with pagination
app.get('/api/pending', requireAdmin, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const total = pending.length;
  const items = pending.slice(offset, offset + limit);

  auditLog('VIEW_PENDING', req.session.user.username, `page=${page}, limit=${limit}`, true);
  return res.json({ success: true, pending: items, total, page, limit, pages: Math.ceil(total / limit) });
});

// API: approve pending (admin)
app.post('/api/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.body || {};
    const idx = pending.findIndex(p => p.id === id);
    if (idx === -1) {
      auditLog('APPROVE_NOT_FOUND', req.session.user.username, id, false);
      return res.status(404).json({ success: false, error: 'Pending request not found' });
    }

    const entry = pending.splice(idx, 1)[0];
    const newAccount = {
      id: uuidv4(),
      username: entry.username,
      password: entry.passwordHash,
      role: entry.role || 'Personnel',
      name: entry.firstName ? (entry.firstName + ' ' + (entry.lastName || '')) : entry.username,
      email: entry.email,
      clearance: entry.clearance || '',
      createdAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    saveAll();

    // Send approval email
    if (transporter) {
      const base = process.env.BASE_URL || `http://localhost:${PORT}`;
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Belgian Air Force" <noreply@plaaf.cn>',
        to: entry.email,
        subject: '✓ Account Approved - Belgian Air Force Personnel Portal',
        text: `Hello ${newAccount.name},\n\nYour account (${newAccount.username}) has been approved.\n\nLogin at: ${base}/pages/login.html\n\nBest regards,\nBelgian Air Force Administration`,
        html: `<h2>Account Approved</h2><p>Hello ${newAccount.name},</p><p>Your account (<strong>${newAccount.username}</strong>) has been approved.</p><p><a href="${base}/pages/login.html">Click here to login</a></p><p>Best regards,<br>Belgian Air Force Administration</p>`
      });
      const preview = nodemailer.getTestMessageUrl(info);
      auditLog('APPROVE', req.session.user.username, entry.username, true);
      return res.json({ success: true, previewUrl: preview });
    }

    auditLog('APPROVE', req.session.user.username, entry.username, true);
    return res.json({ success: true });
  } catch (e) {
    console.error('approve error', e);
    auditLog('APPROVE_ERROR', req.session.user.username, e.message, false);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// API: reject pending (admin)
app.post('/api/reject', requireAdmin, async (req, res) => {
  try {
    const { id, reason } = req.body || {};
    const idx = pending.findIndex(p => p.id === id);
    if (idx === -1) {
      auditLog('REJECT_NOT_FOUND', req.session.user.username, id, false);
      return res.status(404).json({ success: false, error: 'Pending request not found' });
    }

    const entry = pending.splice(idx, 1)[0];
    saveAll();

    if (transporter) {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Belgian Air Force" <noreply@plaaf.cn>',
        to: entry.email,
        subject: '✗ Account Request Rejected',
        text: `Hello ${entry.firstName || entry.username},\n\nYour account request was rejected.\n\nReason: ${reason || 'Not specified'}\n\nBest regards,\nBelgian Air Force Administration`,
        html: `<p>Hello ${entry.firstName || entry.username},</p><p>Your account request was rejected.</p><p><strong>Reason:</strong> ${reason || 'Not specified'}</p>`
      });
      const preview = nodemailer.getTestMessageUrl(info);
      auditLog('REJECT', req.session.user.username, entry.username, true);
      return res.json({ success: true, previewUrl: preview });
    }

    auditLog('REJECT', req.session.user.username, entry.username, true);
    return res.json({ success: true });
  } catch (e) {
    console.error('reject error', e);
    auditLog('REJECT_ERROR', req.session.user.username, e.message, false);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// API: ban IP (admin)
app.post('/api/ban', requireAdmin, (req, res) => {
  try {
    const { ip, reason } = req.body || {};
    if (!ip) return res.status(400).json({ success: false, error: 'IP required' });
    if (bans.find(b => b.ip === ip)) {
      auditLog('BAN_DUPLICATE', req.session.user.username, ip, false);
      return res.status(400).json({ success: false, error: 'IP already banned' });
    }
    bans.push({ ip, reason: reason || '', createdAt: new Date().toISOString(), by: req.session.user.username });
    saveAll();
    auditLog('BAN_IP', req.session.user.username, ip, true);
    return res.json({ success: true });
  } catch (e) {
    console.error('ban error', e);
    auditLog('BAN_ERROR', req.session.user.username, e.message, false);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// API: list bans (admin)
app.get('/api/bans', requireAdmin, (req, res) => {
  auditLog('VIEW_BANS', req.session.user.username, '', true);
  return res.json({ success: true, bans });
});

// API: list accounts (admin)
app.get('/api/accounts', requireAdmin, (req, res) => {
  const safe = accounts.map(a => ({ id: a.id, username: a.username, name: a.name, role: a.role, email: a.email, clearance: a.clearance, createdAt: a.createdAt }));
  auditLog('VIEW_ACCOUNTS', req.session.user.username, '', true);
  return res.json({ success: true, accounts: safe });
});

// API: view audit log (admin only)
app.get('/api/audit', requireAdmin, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    if (!fs.existsSync(AUDIT_FILE)) return res.json({ success: true, entries: [] });
    const lines = fs.readFileSync(AUDIT_FILE, 'utf8').trim().split('\n');
    const entries = lines.slice(-limit).map(line => {
      try { return JSON.parse(line); } catch (e) { return null; }
    }).filter(e => e);
    auditLog('VIEW_AUDIT', req.session.user.username, '', true);
    return res.json({ success: true, entries });
  } catch (e) {
    console.error('audit error', e);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Serve static site
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`✓ Belgian Air Force Portal Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${NODE_ENV}`);
  console.log(`✓ Audit log: ${AUDIT_FILE}`);
});
