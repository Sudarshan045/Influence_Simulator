import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDG_mMtg5dVYiaTxxtspqhA-ZLYcggu14g",
  authDomain: "influence-simulator.firebaseapp.com",
  projectId: "influence-simulator",
  storageBucket: "influence-simulator.firebasestorage.app",
  messagingSenderId: "51502090884",
  appId: "1:51502090884:web:7dd7e29690424cf48f10d1",
  measurementId: "G-2CY8JTC4F4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
