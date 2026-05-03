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
      { $set: { fcmToken: token, email: email || null, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ message: 'Token registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
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
    const user = await db.collection('users').findOne({ uid });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const results = { fcm: null, email: null };

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

    // 2. Send Email
    if (user.email && resend) {
      try {
        const emailResponse = await resend.emails.send({
          from: process.env.RESEND_FROM || 'onboarding@resend.dev',
          to: user.email,
          subject: title,
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                  <h2 style="color: #10b981;">Deep Thinking Trading</h2>
                  <h3>${title}</h3>
                  <p>${message}</p>
                  ${data?.run_id ? `<p><a href="${process.env.FRONTEND_URL}/history" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Analysis</a></p>` : ''}
                  <hr/>
                  <p style="font-size: 0.8rem; color: #888;">This is an automated notification from your Deep Thinking Trading System.</p>
                </div>`,
        });
        results.email = { success: true, data: emailResponse };
      } catch (mailError) {
        console.error('Resend Send Error:', mailError.message);
        results.email = { success: false, error: mailError.message };
      }
    }

    res.json({ message: 'Notifications processed', results });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(port, () => {
  console.log(`🚀 Notification server running on port ${port}`);
});
