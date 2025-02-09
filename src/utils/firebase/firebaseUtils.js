import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();

//rooms changed
// export const roomsDataChanges = (documentIds, callback) => {
//   const unsubscribe = documentIds.map((id) => {
//     return onSnapshot(doc(db, "rooms", id), (doc) => {
//       console.log("room updaated");
//       if (doc.exists) {
//         callback({ roomId: id, ...doc.data() });
//       } else {
//         callback({ roomId: id, ...doc.data() });
//       }
//     });
//   });
//   return unsubscribe;
// };

//messges
// export const chatDataChanges = (roomId, callback) => {
//   const unsubscribe = onSnapshot(doc(db, "rooms", roomId), (snapshot) => {
//     console.log("new msg");
//     const messages = snapshot.data()?.chats;
//     callback(messages);
//   });
//   return unsubscribe;
// };
