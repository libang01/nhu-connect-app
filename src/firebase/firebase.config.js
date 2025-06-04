import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2wjktNP0QSoxQIFJGOyAWUqEjbryS2lQ",
  authDomain: "nhu-connect-418fe.firebaseapp.com",
  projectId: "nhu-connect-418fe",
  storageBucket: "nhu-connect-418fe.appspot.com",
  messagingSenderId: "294768935182",
  appId: "1:294768935182:web:9a8b83d9905c4611fe975f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

export { app, auth, db, functions, storage };
