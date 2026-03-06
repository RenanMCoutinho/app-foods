import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCVHE_HC0Vw8Ng_W2DSJh8t3CWSVYrmNK4",
    authDomain: "app-foods-916ab.firebaseapp.com",
    projectId: "app-foods-916ab",
    storageBucket: "app-foods-916ab.appspot.com",
    messagingSenderId: "177875639667",
    appId: "1:177875639667:web:4b12c3044b24c5f536b906",
    measurementId: "G-S3M7867HPK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
