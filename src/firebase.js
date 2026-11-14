import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB2G_BR_oFPzv_DEik2_VASaSV2CLPM0fY",
  authDomain: "finpilot-570e1.firebaseapp.com",
  projectId: "finpilot-570e1",
  storageBucket: "finpilot-570e1.firebasestorage.app",
  messagingSenderId: "579025821853",
  appId: "1:579025821853:web:09e117c49f67e3e50d7474",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enable a persistent, multi-tab Firestore cache. This allows previously loaded
// records to remain readable offline and queues supported writes for sync later.
// The browser keeps this cache between sessions; use FinPilot on a trusted device.
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (error) {
  // Fallback to the standard in-memory cache if IndexedDB is unavailable.
  console.warn("Persistent Firestore cache could not be enabled; using standard Firestore cache.", error);
  db = getFirestore(app);
}

export { db };
export default app;
