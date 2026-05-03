const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const { Resend } = require('resend');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// --- Firebase Admin Initialization ---
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Firebase Admin init error:', error.message);
  console.log('Note: FCM will not work without FIREBASE_SERVICE_ACCOUNT env var.');
}

// --- Resend Initialization ---
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
if (resend) {
  console.log('✅ Resend initialized');
} else {
  console.log('⚠️ RESEND_API_KEY not found. Email notifications disabled.');
}

// --- MongoDB Initialization ---
let db;
async function connectDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db('deep_thinking');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
}
connectDB();

// --- Routes ---

// Register FCM Token
app.post('/api/notifications/register', async (req, res) => {
  const { uid, token, email } = req.body;
  if (!uid || !token) {
    return res.status(400).json({ error: 'Missing uid or token' });
  }

  try {
    await db.collection('users').updateOne(
      { uid },
      { $set: { fcmToken: token, email: email || null, emailEnabled: req.body.emailEnabled ?? true, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ message: 'Token registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Notification Settings
app.get('/api/notifications/settings/:uid', async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ uid: req.params.uid });
    if (!user) {
      return res.json({ emailEnabled: true }); // Default to true
    }
    res.json({ emailEnabled: user.emailEnabled ?? true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send Notification (Internal)
app.post('/api/notifications/send', async (req, res) => {
  const secret = req.headers['x-notification-secret'];
  if (secret !== process.env.NOTIFICATION_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { uid, title, message, type, data } = req.body;
  if (!uid) return res.status(400).json({ error: 'Missing uid' });

  try {
    if (!db) {
      console.error('❌ Database not initialized during notification request');
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const user = await db.collection('users').findOne({ uid });
    if (!user) {
      console.warn(`⚠️ User ${uid} not found in database`);
      return res.status(404).json({ error: 'User not found' });
    }

    const results = { fcm: null, email: null };
    console.log(`📡 Processing notifications for user: ${user.email || uid}`);

    // 1. Send FCM
    if (user.fcmToken) {
      try {
        const fcmResponse = await admin.messaging().send({
          token: user.fcmToken,
          notification: { title, body: message },
          data: data || {},
        });
        results.fcm = { success: true, response: fcmResponse };
      } catch (fcmError) {
        console.error('FCM Send Error:', fcmError.message);
        results.fcm = { success: false, error: fcmError.message };
      }
    }

    // 2. Send Email (Only if user has enabled it)
    if (user.email && resend && user.emailEnabled !== false) {
      try {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Inter', -apple-system, sans-serif; background-color: #0b0e14; color: #ffffff; margin: 0; padding: 0; }
              .wrapper { background-color: #0b0e14; padding: 40px 20px; }
              .container { max-width: 600px; margin: 0 auto; background: #161b22; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 32px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4); }
              .header { text-align: left; margin-bottom: 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 20px; }
              .logo { font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #3b82f6; text-transform: uppercase; }
              .badge { display: inline-block; padding: 4px 12px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 100px; color: #60a5fa; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
              .title { font-size: 24px; font-weight: 700; color: #ffffff; margin: 0 0 16px 0; line-height: 1.3; }
              .content { font-size: 16px; line-height: 1.6; color: #9ca3af; white-space: pre-wrap; }
              .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; color: #4b5563; text-align: center; }
              .btn { display: inline-block; padding: 14px 28px; background: #3b82f6; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 32px; }
              .accent { color: #3b82f6; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <div class="logo">Deep <span style="color: #ffffff;">Thinking</span></div>
                </div>
                <div class="badge">MARKET INTELLIGENCE</div>
                <h1 class="title">${title}</h1>
                <div class="content">${message}</div>
                <center>
                  <a href="${process.env.FRONTEND_URL || '#'}" class="btn">View Full Analysis</a>
                </center>
                <div class="footer">
                  This report was generated by your AI Trading System.<br/>
                  &copy; 2024 Deep Thinking Trading. All rights reserved.
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        const emailResponse = await resend.emails.send({
          from: process.env.RESEND_FROM || 'onboarding@resend.dev',
          to: user.email,
          subject: `📈 ${title}`,
          html: htmlContent,
        });
        results.email = { success: true, data: emailResponse };
      } catch (mailError) {
        console.error('Resend Send Error:', mailError.message);
        results.email = { success: false, error: mailError.message };
      }
    }

    res.json({ message: 'Notifications processed', results });
  } catch (error) {
    console.error('❌ Send notification error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// --- Start Server ---
async function startServer() {
  await connectDB();
  
  app.listen(port, () => {
    console.log(`🚀 Notification server running on port ${port}`);
    if (!db) {
      console.warn('⚠️ Server started but MongoDB is NOT connected. Notifications will fail.');
    }
  });
}

startServer();
