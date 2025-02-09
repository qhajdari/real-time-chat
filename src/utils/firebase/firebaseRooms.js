import {
  doc,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  onSnapshot,
  deleteDoc,
  arrayUnion, //used to add only a value in a field of give document
} from "firebase/firestore";

import { db, storage } from "utils/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

//ROOMS
export const getAllRooms = async () => {
  const roomsDoc = await getDocs(collection(db, "rooms"));
  const rooms = [];
  roomsDoc.forEach((room) => {
    const roomData = room.data();
    rooms.push({ roomId: room.id, ...roomData });
  });
  return rooms;
};

export const createRoom = async (generatedId, email, userEmail) => {
  const roomsDocRef = doc(db, "rooms", generatedId);
  try {
    await setDoc(roomsDocRef, {
      chats: [],
      lastSeen: { [email]: 0, [userEmail]: 0 },
      users: [{ email: email }, { email: userEmail }],
      lastMessage: {
        value: "",
        updatedAt: 0,
      },
      typing: { [email]: false, [userEmail]: false },
      messagesRead: { [email]: 0, [userEmail]: 0 },
      userRemoved: { [email]: false, [userEmail]: false },
    });
  } catch (error) {
    console.error("Error while saving room", error);
  }
};

//this updates only a key of a document field without overriding, but just merging objects keys
export const updateRoomFields = async (roomId, additionalInformation) => {
  const roomsDocRef = doc(db, "rooms", roomId);
  try {
    await setDoc(
      roomsDocRef,
      {
        ...additionalInformation,
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error while updating room", error);
  }
};

export const updateRoom = async (roomId, additionalInformation) => {
  const roomsDocRef = doc(db, "rooms", roomId);
  try {
    await updateDoc(roomsDocRef, {
      ...additionalInformation,
    });
  } catch (error) {
    console.error("Error while updating room", error);
  }
};

//update chat of a room without overriding prevoius data but just merging with arrayUnion
export const updateRoomChats = async (roomId, additionalInformation) => {
  try {
    const roomsDocRef = doc(db, "rooms", roomId);
    const { newChat, ...rest } = additionalInformation;

    await updateDoc(roomsDocRef, {
      chats: arrayUnion(newChat),
      ...rest,
    });
  } catch (error) {
    console.error("Error while updating room", error);
  }
};

export const deleteRoom = async (roomId) => {
  try {
    await deleteDoc(doc(db, "rooms", roomId));
  } catch (error) {
    console.error("Error while deleting room", error);
  }
};

//GROUP
export const createGroup = async (
  generatedId,
  groupName,
  authenticatedUser,
  users
) => {
  const roomsDocRef = doc(db, "rooms", generatedId);
  try {
    let usersLastSeen = {};
    let usersTypingValue = {};
    let usersMessagesRead = {};
    let userRemovedObj = {};

    users.forEach((item) => {
      usersLastSeen[item.email] = 0;
      usersTypingValue[item.email] = false;
      usersMessagesRead[item.email] = 0;
      userRemovedObj[item.email] = false;
    });
    const lastSeen = { [authenticatedUser.email]: 0, ...usersLastSeen };
    const typing = { [authenticatedUser.email]: false, ...usersTypingValue };
    const messagesRead = { [authenticatedUser.email]: 0, ...usersMessagesRead };
    const userRemoved = { [authenticatedUser.email]: false, ...userRemovedObj };

    await setDoc(roomsDocRef, {
      chats: [],
      lastSeen,
      users: [
        {
          email: authenticatedUser.email,
        },
        ...users,
      ],
      lastMessage: {
        value: "",
        updatedAt: 0,
      },
      typing,
      messagesRead,
      userRemoved,
      //group extra fields
      roomName: groupName || "Group",
      admin: authenticatedUser.email,
    });
  } catch (error) {
    console.error("Error while saving room", error);
  }
};

export const uploadImageInRoom = (roomId, file) => {
  // Create a reference to the file in Firebase storage
  const imageRef = ref(storage, `rooms/${roomId}/${file.name}`);
  const imgURL = uploadBytes(imageRef, file).then((snapshot) => {
    return getDownloadURL(snapshot.ref).then((downloadURL) => {
      return downloadURL;
    });
  });
  return imgURL;
};

//listen for every room changes
export const roomsDataChanges = (callback) => {
  return onSnapshot(collection(db, "rooms"), (snapshot) => {
    console.log("room updated");
    getAllRooms().then((res) => {
      callback(res);
    });
  });
};
