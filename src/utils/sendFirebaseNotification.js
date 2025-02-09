import axios from "axios";

/**
 *
 * @param {String}  title - Notification title
 * @param {String}  body - Content
 * @param {String}  imageSrc - imageSrc of auth user
 * @param {Array}  tokens - array of user device tokens
 * @param {Object}  data - other object with data
 *
 */
export const sendFirebaseNotification = (
  title,
  body,
  imageSrc, //not used in apple!!!
  tokens,
  data
) => {
  console.log({ title, body, imageSrc, tokens, data });
  axios
    .post(
      // "http://localhost:4322/send-notification",
      "https://chat-app-express.netlify.app/send-notification",
      {
        // notification: {
        //   title,
        //   body,
        //  // sound: "default",
        //  // badge: "1",
        //   image:
        //     imageSrc ||
        //     `https://api.dicebear.com/6.x/avataaars/svg?seed=4${title}`,
        // },
        collapseKey: title,
        tokens,
        data: {
          title,
          body,
          image:
            imageSrc ||
            `https://api.dicebear.com/6.x/avataaars/svg?seed=4${title}`,
          ...data,
        },

        //remove these
        // android: {
        //   // vibrationPattern: [200, 100, 200],
        //   collapseKey: title,
        // },
        // apns: {
        //   headers: {
        //     "apns-collapse-id": title,
        //   },
        //   payload: {
        //     aps: {
        //       ios: { notification: { sound: "default" } },
        //       sound: "default",
        //       badge: 13,
        //       alert: {
        //         title: title,
        //         body: body,
        //       },
        //     },
        //   },
        // },
      },
      { headers: { "Content-Type": "application/json" } }
    )
    .then((response) => console.log("Notification sent successfully!"))
    .catch((error) => console.error("Error sending notification:", error));
};
