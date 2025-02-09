//firebase utils
export { auth } from "./firebaseUtils";
export { db } from "./firebaseUtils";
export { storage } from "./firebaseUtils";
export { firebaseApp } from "./firebaseUtils";

// firebase users
export { signInWithGooglePopup } from "./firebaseUsers";
export { createUserWithEmailAndPw } from "./firebaseUsers";
export { sigInWithEmailAndPw } from "./firebaseUsers";
export { setUpRecaptchaAndPhoneSignIn } from "./firebaseUsers";
export { getUserByUid } from "./firebaseUsers";
export { getUserByEmail } from "./firebaseUsers";
export { getAllUsers } from "./firebaseUsers";
export { updateUserDocument } from "./firebaseUsers";
export { uploadImage } from "./firebaseUsers";
export { deleteImage } from "./firebaseUsers";
export { myUsersDataChanges } from "./firebaseUsers";
export { changeUserPassword } from "./firebaseUsers";
export { resetPassword } from "./firebaseUsers";

//firebase rooms
export { getAllRooms } from "./firebaseRooms";
export { createRoom } from "./firebaseRooms";
export { updateRoom } from "./firebaseRooms";
export { deleteRoom } from "./firebaseRooms";
export { createGroup } from "./firebaseRooms";
export { uploadImageInRoom } from "./firebaseRooms";
export { roomsDataChanges } from "./firebaseRooms";
export { updateRoomFields } from "./firebaseRooms";
export { updateRoomChats } from "./firebaseRooms";

//firebase message notifications
export { requestPermissionAndGetToken } from "./firebaseMessage";
export { onMessageListener } from "./firebaseMessage";
export { updateAppBadge } from "./firebaseMessage";
