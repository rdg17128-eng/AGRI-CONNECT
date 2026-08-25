import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAU3vmUdzFDzseI3oT5JQy0jDdIxkmdVso",
    authDomain: "green-grid-b2222.firebaseapp.com",
    projectId: "green-grid-b2222",
    storageBucket: "green-grid-b2222.firebasestorage.app",
    messagingSenderId: "367679697189",
    appId: "1:367679697189:web:ef5ad8ebe8f02df185eacc",
    measurementId: "G-0R0BCB59E3"
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const db = getFirestore(app);
