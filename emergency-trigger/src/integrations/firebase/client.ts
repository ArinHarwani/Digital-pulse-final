import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: "adamya-c0ab1.firebaseapp.com",
    projectId: "adamya-c0ab1",
    storageBucket: "adamya-c0ab1.firebasestorage.app",
    messagingSenderId: "573320828318",
    appId: "1:573320828318:web:36f0f9864316b05b4c328f",
    measurementId: "G-L5ZCC39PFG"
};

// Initialize Firebase safely
let messaging: any = null;
try {
  const app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
} catch (e) {
  console.warn('Firebase init skipped:', e);
}

export { messaging };

// Helper to request permission
export const requestForToken = async () => {
    if (!messaging) return null;
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const currentToken = await getToken(messaging, {});
            if (currentToken) {
                console.log('FCM Token:', currentToken);
                return currentToken;
            }
        }
        return null;
    } catch (err) {
        console.log('Token retrieval error:', err);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        if (!messaging) { resolve(null); return; }
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });

