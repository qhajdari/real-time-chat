import { message } from "antd";
import { doc, setDoc } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { db, firebaseApp } from "utils/firebase";

const firebaseCloudMsgKey =
  "BBrDnPzNlczG1oGeVeMjTuNJ_a1wO9XpnApoNrFHcUasbiDo3jTjK6eT1ZxgWrHbIMllf6DCOGGVcipZwQsQiFQ";
export const messaging = getMessaging(firebaseApp);

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export const requestPermissionAndGetToken = (callback) => {
  // Service Worker isn't supported on this browser, disable or hide UI.
  if (!("serviceWorker" in navigator)) return;

  // Push isn't supported on this browser, disable or hide UI.
  if (!("PushManager" in window)) return;

  Promise.resolve(Notification.requestPermission())
    .then(async (permission) => {
      // if (permission === "granted") {
      //   console.log("Notification permission granted.");
      const currentToken = await getToken(messaging, {
        vapidKey: firebaseCloudMsgKey,
      });

      if (currentToken) {
        callback(currentToken);
      } else
        console.log(
          "No registration token available. Request permission to generate one."
        );
      // } else {
      //   message.warning("Notification NOT granted.", 5);
      //   console.log("Notification NOT granted.");
      // }
    })
    .catch((error) => console.error({ error }));
};

//function to save logged in user data in db
export const updateAppBadge = async (token) => {
  if (!token) return;
  try {
    const userDocRef = doc(db, "appBadges", token);

    await setDoc(userDocRef, {
      appBadge: 0,
    });
  } catch (error) {
    console.error("Error while restarting app badge", error);
  }
};
