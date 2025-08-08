// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Import getAuth

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAauXa1Q_SrZLXdXolargwy6NG-tK7PGFo",
  authDomain: "mine-safety-reporter-efb8c.firebaseapp.com",
  projectId: "mine-safety-reporter-efb8c",
  storageBucket: "mine-safety-reporter-efb8c.firebasestorage.app",
  messagingSenderId: "548225721808",
  appId: "1:548225721808:web:3af043e0bc557960a385d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app); // Add this line

export { db, auth }; // Export auth as well
