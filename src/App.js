import "./App.scss";
import React, { useEffect, useState } from "react";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Sidebar, Login, Register, PhoneAuth } from "components";
import {
  allUsersActions,
  authActions,
  contactsActions,
  roomsActions,
} from "./store";
import {
  getUserByUid,
  myUsersDataChanges,
  requestPermissionAndGetToken,
  onMessageListener,
  roomsDataChanges,
  updateUserDocument,
  updateAppBadge,
} from "utils/firebase";
import { useReduxToolkit } from "utils/hooks/useReduxToolkit";
import ResetPassword from "components/auth/ResetPassword";
import ChatRoute from "routes/ChatRoute";
import { WechatOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { notification, Button, message } from "antd";

function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const [api, contextHolder] = notification.useNotification(); // display of notification

  const userId = localStorage.getItem("userId");

  const { email } = useSelector((state) => state.auth);
  const authenticatedUser = useSelector((state) => state.auth);
  const { rooms } = useSelector((state) => state.rooms);
  const { myUsersEmails } = useSelector((state) => state.users);
  const { contacts } = useSelector((state) => state.contacts);

  const [contentHeight, setContentHeight] = useState(0); //to find safari toolbar height

  // 2 - fully open, 1 - half open, 0 fully closed
  const [closingSidebar, setClosingSidebar] = useState("2"); //set transition when closing opening sidebar

  const [isSidebarOpen, setIsSidebarOpen] = useReduxToolkit(
    "isSidebarOpen",
    true
  );

  // listen for room changes
  useEffect(() => {
    const unsubscribe = roomsDataChanges((callbackRes) => {
      dispatch(
        roomsActions.myRooms({
          roomsArr: callbackRes,
          email,
        })
      );
    });

    if (email) {
      requestPermissionAndGetToken((notificationToken) => {
        console.log({ myToken: notificationToken });
        updateAppBadge(notificationToken);
        updateUserDocument(authenticatedUser, {
          notificationToken,
        })
          .then(() => {
            dispatch(authActions.saveNotToken(notificationToken));
          })
          .catch((err) => message.error(err));
      });
    }

    return () => {
      unsubscribe();
      // clearTimeout(timer);
    };
  }, [email]);

  //get list of users that should i listen for any changes
  useEffect(() => {
    //get all users from all rooms
    const usersFromRooms = [
      ...new Set(
        rooms.flatMap((room) =>
          room.users.map((user) => user.email !== email && user.email)
        )
      ),
    ].filter(Boolean);

    //get all users from my contacts
    const usersFromContacts = [
      ...new Set(contacts?.map((user) => user.email !== email && user.email)),
    ];

    const mergedUsers = [...new Set([...usersFromRooms, ...usersFromContacts])];

    dispatch(allUsersActions.myUsersEmails(mergedUsers));
  }, [rooms, contacts]); //if any room has any changes get updated changes

  //update data of my users
  useEffect(() => {
    if (myUsersEmails.length) {
      const unsubscribe = myUsersDataChanges(myUsersEmails, (callbackRes) => {
        dispatch(allUsersActions.myUsers(callbackRes));
      });
      return () => unsubscribe();
    }
  }, [myUsersEmails]);

  //main useeffect
  useEffect(() => {
    if (navigator.clearAppBadge) {
      navigator.clearAppBadge();
    }

    if (userId) {
      getUserByUid(userId).then((currUser) => {
        dispatch(
          authActions.setUser({
            uid: userId,
            email: currUser?.email,
            displayName: currUser?.displayName,
            imageSrc: currUser?.imageSrc || "",
            updatedAt: currUser?.updatedAt,
          })
        );
        dispatch(contactsActions.myContacts(currUser?.contacts || []));
      });
    } else {
      navigate("/login");
    }
  }, [userId]);

  //when hide toolbar in safari executes makes a resize
  useEffect(() => {
    const handleResize = () => {
      // Calculate the height of the content container
      const viewportHeight = window.visualViewport.height;
      const browserChromeHeight = window.innerHeight - viewportHeight;
      const newContentHeight =
        viewportHeight - (hasHiddenToolbar() ? 0 : browserChromeHeight);
      // Set the height of the content container
      setContentHeight(newContentHeight);
    };
    // Add event listener for resize
    window.addEventListener("resize", handleResize);
    // Call the resize handler initially
    handleResize();
    // Clean up the event listener
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const hasHiddenToolbar = () => {
    return window.visualViewport.width === window.innerWidth;
  };

  // sidebar open/close afer 0.4 seconds of transition
  const openCloseSidebar = (event) => {
    if (event) {
      setIsSidebarOpen(true);
      setClosingSidebar("2");
    } else {
      setClosingSidebar("1");

      const timeoutId = setTimeout(() => {
        setIsSidebarOpen(false);
      }, 300);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  };

  //////////////////////////////////// CHECK THISSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS
  onMessageListener()
    .then((payload) => {
      const users = JSON.parse(payload.data.toUser); // if one device has multiple accounts then get email only to given account
      const currLink = `https://chatshqip.netlify.app${location.pathname}`;
      if (payload.data.linkTo !== currLink && users.includes(email)) {
        api.open({
          message: payload.data.title,
          description: payload.data.body,
          icon: <WechatOutlined style={{ color: "#108ee9" }} />,
        });
      }
    })
    .catch((err) => console.log("failed: ", err));

  return (
    <div className="App" style={{ height: contentHeight }}>
      {contextHolder}
      {!userId ? (
        <div className="auth__body">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/phone-login" element={<PhoneAuth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </div>
      ) : (
        <div className="app__body">
          <Sidebar
            {...{
              closingSidebar,
              openCloseSidebar,
            }}
          />

          <Routes>
            <Route
              path="/"
              element={
                <img
                  className="chat"
                  width={"100%"}
                  src="https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png"
                  alt="Welcome to ChatSHQIP!"
                />
              }
            />
            <Route
              path="/rooms/:roomId"
              element={
                <ChatRoute
                  {...{ openCloseSidebar, setClosingSidebar, closingSidebar }}
                />
              }
            />
          </Routes>
        </div>
      )}
    </div>
  );
}

export default App;
