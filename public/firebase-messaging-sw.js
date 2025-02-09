// const { firebaseConfig } = require("./firebaseUtils");

//
// THIS FILE IS NEEDED TO BE IN PUBLIC
//

// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-messaging.js");

// const getConfig = async () => {
//   //fetch firebase config from api
//   const firebaseConfigRes = await fetch(
//     `https://chat-app-express.netlify.app/get-firebase-config`,
//     {
//       headers: {
//         "Content-Type": "application/json",
//       },
//     }
//   ).catch((error) => console.error("API call error:", error));
//   firebase.initializeApp(firebaseConfig);

//   const firebaseConfig = await firebaseConfigRes.json();
// };
// getConfig();

// git ignoreddddddddddddddddddd

try {
  firebase.initializeApp({
    databaseURL: "https://chat-app-75176-default-rtdb.firebaseio.com",
     apiKey: "AIzaSyB9BNCZJexmMb2Lch_2V2HUhY-MReuEh7E",
  authDomain: "realtime-chat-36fa1.firebaseapp.com",
  projectId: "realtime-chat-36fa1",
  storageBucket: "realtime-chat-36fa1.firebasestorage.app",
  messagingSenderId: "688111286034",
  appId: "1:688111286034:web:64dd5f02b3263c51c225cb"
  });

  if (firebase.messaging.isSupported()) {
    // Retrieve firebase messaging
    const messaging = firebase.messaging();

    //function to increase app badge value with firebase sdk in backend
    const updateAppBadge = () => {
      messaging.getToken().then((token) => {
        fetch(
          `https://chat-app-express.netlify.app/firestore/appBadges/${token}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
          .then((response) => response.json())
          .then((data) => {
            if (navigator.setAppBadge) {
              //set badge count
              navigator.setAppBadge(data.appBadge);
            }
          })
          .catch((error) => console.error("API call error:", error));
      });
    };

    messaging.onBackgroundMessage(function (payload) {
      console.log("Received background message ", payload);

      updateAppBadge(); //increase app badge value

      let notificationTitle = payload.data.title;
      let notificationOptions = {
        body: payload.data.body,
        vibrate: [300, 100, 400],
        data: {
          newMessageCount: 1,
          url: payload?.data?.linkTo || "https://chatshqip.netlify.app/",
        },
        tag: "renotify",
        renotify: true,
        // image: payload.data.image, //only in windows
        // badge: payload.data.image,
        // icon:''
      };

      //get last notification if it is same as new one
      const promiseChain = registration
        .getNotifications()
        .then((notifications) => {
          // returns latest notification
          let currentNotification;

          for (let i = 0; i < notifications.length; i++) {
            if (
              notifications[i].title &&
              notifications[i].title === notificationTitle
            ) {
              currentNotification = notifications[i];
            }
          }
          return currentNotification;
        });

      promiseChain.then((currentNotification) => {
        // if last msg has same origin as new one
        if (currentNotification) {
          const messageCount =
            (currentNotification.data.newMessageCount || 0) + 1;

          notificationOptions.body = `You have ${messageCount} unread messages from ${notificationTitle}.`;
          notificationOptions.data = {
            ...notificationOptions.data,
            newMessageCount: messageCount,
          };

          currentNotification.close(); // Close the old notification.
        }

        self.registration.showNotification(
          notificationTitle,
          notificationOptions
        );
      });
    });

    self.addEventListener("notificationclick", (event) => {
      const clickedNotification = event.notification;
      // Open the url you set on notification.data
      clients.openWindow(clickedNotification.data.url);
      clickedNotification.close(); //in android maybe in click removes current notification in ios is ok without it
    });

    //IT IS CALLED FOR EVERY NEW NOTIFICATION
    // self.addEventListener("push", (event) => {
    // const notificationData = event.data.json();
    // console.log({ notificationData });
    // });
  }
} catch (error) {
  console.log({ firebaseMessagingServiceWorkerError: error });
  fetch(
    `https://chat-app-express.netlify.app/firebase-messaging-service-worker-error`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(error),
    }
  );
}
