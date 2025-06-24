// src/services/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your Firebase config

const firebaseConfig = {
  apiKey: "AIzaSyC-3myTWmyTW7yID15rij9hydQ-fvCslJ4",
  authDomain: "timetracker-acb7d.firebaseapp.com",
  projectId: "timetracker-acb7d",
  storageBucket: "timetracker-acb7d.firebasestorage.app",
  messagingSenderId: "964100802128",
  appId: "1:964100802128:web:65cac06e326598c62c7355",
  measurementId: "G-L9QVQF21Y0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider(); // ✅ Google provider

export { db, auth, provider };
