import { createSlice, configureStore, current } from "@reduxjs/toolkit";
import { message } from "antd";

const initialAuthState = {
  uid: "",
  displayName: "",
  email: "",
  imageSrc: "",
  updatedAt: "",
  userFetched: false,
  notificationToken: "",
};

const authSlice = createSlice({
  name: "authentication",
  initialState: initialAuthState,
  reducers: {
    setUser(state, action) {
      state.uid = action.payload.uid;
      state.displayName = action.payload.displayName;
      state.email = action.payload.email;
      state.imageSrc = action.payload.imageSrc;
      state.updatedAt = action.payload.updatedAt;

      state.userFetched = true; //make true when user fetched
    },
    logout(state) {
      state.uid = "";
      state.displayName = "";
      state.email = "";
      state.imageSrc = "";
    },
    saveImage(state, action) {
      state.imageSrc = action.payload.imageSrc;
    },
    changeName(state, action) {
      state.displayName = action.payload;
    },
    saveNotToken(state, action) {
      state.notificationToken = action.payload;
    },
  },
});

//CONTACTS
const initialContactsState = {
  contacts: [],
};

const contactsSlice = createSlice({
  name: "contacts",
  initialState: initialContactsState,
  reducers: {
    myContacts(state, action) {
      state.contacts = action.payload;
    },
  },
});

//ROOMS
const initialRoomsState = {
  rooms: [],
  roomsFetched: false,
};

const roomsSlice = createSlice({
  name: "rooms",
  initialState: initialRoomsState,
  reducers: {
    myRooms(state, action) {
      const { roomsArr, email } = action.payload;
      const myRooms = roomsArr.reduce((acc, room) => {
        //if room is only with two persons filter by email else by list of users
        if (room?.users?.length === 2) {
          const otherUsers = room?.users.filter((user) => user.email !== email);
          if (otherUsers.length === 1) {
            acc.push({
              ...room,
              chattingWithUser: otherUsers[0]?.email, //save the user wich we are chatting
            });
          }
        } else if (room?.users?.length > 2) {
          // do not add this room if user is removed from group
          if (
            room?.users?.some(
              (user) =>
                user.email === email && room?.userRemoved?.[email] !== true
            )
          ) {
            acc.push({
              ...room,
              roomName: room.roomName,
              chatImg: room.chatImg || "",
              isGroup: room.admin,
            });
          }
        } else {
          console.log({ room });
          message.error("FOUND A ROOM WITH ONE USER");
        }
        return acc;
      }, []);
      state.rooms = myRooms;
      state.roomsFetched = true;
    },
  },
});

//USERS
const initialAllUsersState = {
  allUsers: [],
  myUsersEmails: [],
  myUsers: [],
};

const allUsersSlice = createSlice({
  name: "users",
  initialState: initialAllUsersState,
  reducers: {
    allUsers(state, action) {
      state.allUsers = action.payload;
    },
    myUsersEmails(state, action) {
      state.myUsersEmails = action.payload;
    },
    myUsers(state, action) {
      state.myUsers = action.payload;
    },
  },
});

const customStateSlice = createSlice({
  name: "cust",
  initialState: {},
  reducers: {
    customReducer(state, action) {
      const { selector, newState } = action.payload;
      state[selector] = newState;
    },
  },
});

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    rooms: roomsSlice.reducer,
    contacts: contactsSlice.reducer,
    users: allUsersSlice.reducer,
    custom: customStateSlice.reducer,
  },
});

export const authActions = authSlice.actions;
export const roomsActions = roomsSlice.actions;
export const contactsActions = contactsSlice.actions;
export const allUsersActions = allUsersSlice.actions;
export const customActions = customStateSlice.actions;

export default store;
