import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAJDJV-RqYJQqdtn1p3cpWoS1ahh8dFVWM",
  authDomain: "diet-tracker-202e4.firebaseapp.com",
  projectId: "diet-tracker-202e4",
  storageBucket: "diet-tracker-202e4.appspot.com",
  messagingSenderId: "731628330288",
  appId: "1:731628330288:web:7d0d7e4816f862bcbd7cf5",
  measurementId: "G-4PXHP7GQRL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
