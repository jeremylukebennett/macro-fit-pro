import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDjGJHCO-DL_i46Moca_kc9tmUqo-OTYvI",
  authDomain: "macro-fit-pro.firebaseapp.com",
  projectId: "macro-fit-pro",
  storageBucket: "macro-fit-pro.firebasestorage.app",
  messagingSenderId: "749370786345",
  appId: "1:749370786345:web:e9b8e0941fdd3cf7fa9238",
  measurementId: "G-SYK4L8XNYW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
