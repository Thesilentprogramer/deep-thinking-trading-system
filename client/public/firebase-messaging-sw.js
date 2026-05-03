// Import and configure the Firebase SDK
// These scripts are made available when the app is served or built
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCtem2jYh2WuXmRQjDddwM3wqa8WkVJeAA",
  authDomain: "deep-thinking-trading.firebaseapp.com",
  projectId: "deep-thinking-trading",
  storageBucket: "deep-thinking-trading.firebasestorage.app",
  messagingSenderId: "1049367827602",
  appId: "1:1049367827602:web:b48ac09aea82461495824b",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
