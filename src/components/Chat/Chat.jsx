import {
  InsertEmoticon,
  SearchOutlined,
  IconButton,
  PhotoCameraIcon,
  PersonAddAltIcon,
  DeleteIcon,
  RestoreIcon,
} from "icons";
import {
  SendOutlined,
  QuestionCircleOutlined,
  RightOutlined,
  LeftOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import "./Chat.scss";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  AutoComplete,
  Button,
  Input,
  message,
  Avatar,
  Tooltip,
  Skeleton,
  Image,
  Popconfirm,
  Modal,
} from "antd";
import {
  updateRoom,
  deleteRoom,
  updateRoomFields,
  updateRoomChats,
  uploadImageInRoom,
  updateUserDocument,
} from "utils/firebase";
import { useMediaQuery } from "react-responsive";
import Picker from "emoji-picker-react";
import moment from "moment/moment";
import ChatBody from "./ChatComponents/ChatBody";
import GroupParticipants from "./ChatComponents/GroupParticipants";
import { contactsActions } from "store";
import Draggable from "react-draggable";
import { useReduxToolkit } from "utils/hooks/useReduxToolkit";
import { sendFirebaseNotification } from "utils/sendFirebaseNotification";
import UserProfileInfoModal from "./ChatComponents/UserProfileInfoModal";
import { getChatSummary } from "utils/llmService";


const Chat = ({
  openCloseSidebar,
  roomId,
  closingSidebar,
  setClosingSidebar,
}) => {
  const navigate = useNavigate();
  const hiddenFileInput = useRef(null);
  const dispatch = useDispatch();

  const authenticatedUser = useSelector((state) => state.auth);
  const { displayName, email, imageSrc } = useSelector((state) => state.auth);
  const { rooms, roomsFetched } = useSelector((state) => state.rooms);
  const { myUsers } = useSelector((state) => state.users);
  const { contacts } = useSelector((state) => state.contacts);

  const [searchInput, setSearchInput] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [input, setInput] = useState("");
  const [chosenEmoji, setChosenEmoji] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false); //used to fix paddind for mobile app view
  const [userProfileInfoModal, setUserProfileInfoModal] = useState(false); //user info modal

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const showHistoryModal = () => {
    setIsHistoryModalOpen(true);
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useReduxToolkit("isSidebarOpen");
  const [summary, setSummary] = useState("");

  const handleSummarize =async () => {
    if(roomId) {
    const currentRoom = rooms.find((room) => room.roomId === roomId);
      const chatSummary = await getChatSummary(currentRoom.chats);
      setSummary(chatSummary);
    }
    showHistoryModal();
  };
  const location = useLocation();

  const participants =
    currentRoom?.isGroup &&
    currentRoom?.users &&
    [
      ...currentRoom?.users?.map((roomUser) => {
        const findedUser = myUsers.find(
          (user) => user.email === roomUser?.email
        );
        if (findedUser) {
          const { contacts, ...rest } = findedUser;
          if (currentRoom.userRemoved[roomUser?.email] !== true) {
            return rest;
          }
        }
      }),
      authenticatedUser,
    ].filter(Boolean);

  useEffect(() => {
    if (!!roomId) {
      const roomExists = rooms.find((room) => room.roomId === roomId);
      if (roomExists) {
        //for groups we dont need chatImg and chat status
        if (roomExists?.isGroup) {
          let userNames = {};
          roomExists.users.forEach(({ email }) => {
            const findedUser =
              email === authenticatedUser.email
                ? authenticatedUser
                : myUsers?.find((user) => user.email === email);
            userNames[email] = findedUser?.displayName;
          });

          setCurrentRoom({
            ...roomExists,
            chatName: roomExists?.roomName,
            userNames,
          });
        } else {
          const findedUser = myUsers.find(
            (user) => user.email === roomExists?.chattingWithUser
          );
          setCurrentRoom({
            ...roomExists,
            chatName: findedUser?.displayName,
            chatImg: findedUser?.imageSrc,
            userStatus: findedUser?.status,
            userNames: {
              [email]: displayName,
              [findedUser?.email]: findedUser?.displayName,
            },
          });
        }
      } else rooms.length && navigate("/"); //this mean if rooms are fetched and can not find that roomId navigate to home
    }
  }, [roomId, rooms, myUsers]);

  //when room has changes update last seen of user
  useEffect(() => {

    if (email && currentRoom?.chats) {
      const lastSeen = new Date().getTime();

      //get messages that are not written by me to save its length
      const notMyMessages = currentRoom.chats.filter(
        (chat) => chat.author !== email
      )?.length;

      // return;
      updateRoomFields(roomId, {
        lastSeen: {
          [email]: lastSeen,
        },
        messagesRead: {
          [email]: notMyMessages,
        },
        //make chats as seen
        chats: currentRoom.chats.map((msg) =>
          msg.author !== email ? { ...msg, isSeen: true } : msg
        ),
      })
        .then((res) => {})
        .catch((err) => console.log({ err }));
    }
  }, [email, currentRoom?.chats?.length]); // currentRoom without chats.length causes for loop

  const sendMessage = () => {
    if (input.trim() !== "") {
      const createdAt = new Date().getTime();
      const messageId = uuidv4();

      // const updatedChats = [
      //   ...currentRoom?.chats,
      //   { messageId, author: email, message: input, createdAt },
      // ];
      setInput("");

      // updateRoom(roomId, {
      //   chats: updatedChats,
      //   lastMessage: { value: input, updatedAt: createdAt },
      //   typing: { ...currentRoom?.typing, [email]: false },
      // });
      // return;

      //after update room in firebase, redux state is updated automatically from snapshot
      //updateRoom is not used bcs it also modifies other chats
      updateRoomChats(roomId, {
        newChat: {
          messageId,
          author: email,
          message: input,
          createdAt,
        },
        lastMessage: { value: input, updatedAt: createdAt },
        typing: { ...currentRoom?.typing, [email]: false },
      })
        .then((res) => {
          //get emails to send in notifBody variosly when user is group or not
          const userEmails = !currentRoom.isGroup
            ? [currentRoom.chattingWithUser]
            : participants?.map((user) => user.email);

          //get all users tokens infos
          const userNotifTokens = myUsers
            .map((user) => {
              if (userEmails.includes(user.email)) {
                return user.notificationToken;
              }
            })
            .filter(Boolean);
          sendFirebaseNotification(
            currentRoom.isGroup
              ? `[${displayName}] ${currentRoom.chatName}`
              : displayName,
            input,
            imageSrc,
            [...userNotifTokens],
            {
              toUser: JSON.stringify(userEmails),
              linkTo: `https://chatshqip.netlify.app${location.pathname}`,
            }
          );
          emojiOpen && setEmojiOpen(false);
        })
        .catch((err) => console.log({ err }));
    }
  };

  const onEmojiClick = (event, emojiObject) => {
    setChosenEmoji(emojiObject);
    if (chosenEmoji !== null) {
      setInput(input + chosenEmoji.emoji);
    }
  };

  // save image in storage
  const handleFileChange = (event) => {
    setUploadingImage(true); // show skeleton to tell user that image is sending
    const file = event.target.files[0];
    uploadImageInRoom(roomId, file)
      .then((downloadURL) => {
        const messageId = uuidv4();
        const createdAt = new Date().getTime();
        // const updatedChats = [
        //   ...currentRoom?.chats,
        //   {
        //     messageId,
        //     author: email,
        //     message: downloadURL,
        //     isImage: true,
        //     createdAt,
        //   },
        // ];

        updateRoomChats(roomId, {
          newChat: {
            messageId,
            author: email,
            message: downloadURL,
            isImage: true,
            createdAt,
          },
          lastMessage: { value: "Image", updatedAt: createdAt },
        })
          .then((res) => message.success("Image sent"))
          .catch((err) => console.log({ err }));
        setUploadingImage(false);
      })
      .catch((error) => {
        setUploadingImage(false);
        console.error("Error uploading image:", error);
      });
  };

  const getLastSeen = () => {
    let displayLastSeen;
    //if room is a group should get last seen of all users
    if (currentRoom?.isGroup) {
      let latestEmail;
      let latestTimestamp = 0;
      //get latest last seen of latest user except me
      for (const [emailSeen, timestamp] of Object.entries(
        currentRoom.lastSeen
      )) {
        // get biggest timestamp
        if (emailSeen !== email && timestamp > latestTimestamp) {
          latestTimestamp = timestamp;
          latestEmail = emailSeen;
        }
      }
      // get their names
      const myUser = myUsers?.find((user) => user.email === latestEmail);

      if (latestTimestamp !== 0) {
        displayLastSeen = (
          <p>
            last seen from {myUser?.displayName}&nbsp;
            {moment(latestTimestamp).fromNow(true)} ago
          </p>
        );
      }
    } else {
      const lastSeenValue =
        currentRoom?.lastSeen?.[currentRoom.chattingWithUser];
      const lastSeen = moment(lastSeenValue);
      if (lastSeenValue !== 0) {
        displayLastSeen = <p>last seen {lastSeen.fromNow(true)} ago</p>;
      }
    }
    //for mobile view dont show last seen result if sidebar or search input is open
    const shouldDisplayLastSeen = !isSidebarOpen && !showSearchInput;
    return isMobileView
      ? shouldDisplayLastSeen && displayLastSeen
      : displayLastSeen;
  };

  //set typing true when a user is typing
  const setTyping = (value) => {
    //if input change & has new value set as typing
    if (!!value) {
      if (!currentRoom?.typing[email]) {
        updateRoomFields(roomId, {
          typing: { [email]: !!value },
        })
          .then(() => {
            //set typing off after 3 seconds
            const timerId = setTimeout(() => {
              updateRoomFields(roomId, {
                typing: { [email]: false },
              }).catch((err) => console.log({ err }));
            }, 3000);
            // Clear the timer when the component unmounts
            return () => clearTimeout(timerId);
          })
          .catch((err) => console.log({ err }));
      }
    }
  };

  //add chattingUser in my contact list
  const addUserToContacts = () => {
    const updatedContacts = [
      ...contacts,
      { email: currentRoom.chattingWithUser, roomId: roomId },
    ];
    updateUserDocument(authenticatedUser, {
      contacts: updatedContacts,
    }).then((res) => {
      message.success("User added to your contacts");
      dispatch(contactsActions.myContacts(updatedContacts));
    });
  };

  //get draggable length
  const handleStop = (event, data) => {
    if (data.lastX > 20) openCloseSidebar(true);
    if (data.lastX < -20) openCloseSidebar(false);
  };

  //delete room
  const deleteChatRoom = () => {
    //also remove roomId with that contact
    const updatedContacts = contacts?.map((cont) =>
      cont.email === currentRoom.chattingWithUser
        ? { ...cont, roomId: "" }
        : cont
    );
    //if chattingWithUser has also deleted this chat remove chat from db
    if (currentRoom.userRemoved?.[currentRoom.chattingWithUser] === true) {
      deleteRoom(roomId)
        .then(() => {
          updateUserDocument(authenticatedUser, {
            contacts: updatedContacts,
          }).then((res) => {
            dispatch(contactsActions.myContacts(updatedContacts));
            message.error("Chat deleted permanently");
            navigate("/");
          });
        })
        .catch((err) => console.log({ err }));
    } else {
      updateRoomFields(roomId, {
        userRemoved: {
          // ...currentRoom.userRemoved,
          [email]: true,
        },
      })
        .then(() => {
          updateUserDocument(authenticatedUser, {
            contacts: updatedContacts,
          }).then((res) => {
            dispatch(contactsActions.myContacts(updatedContacts));
            message.warning("Chat deleted successfully");
            navigate("/");
          });
        })
        .catch((err) => console.log({ err }));
    }
  };

  //restore room from delete
  const restoreRoom = () => {
    updateRoomFields(roomId, {
      userRemoved: {
        ...currentRoom.userRemoved,
        [email]: false,
      },
    }).catch((err) => console.log({ err }));
  };

  const isMobileView = useMediaQuery({
    query: "(max-width: 460px)",
  });
  const isStandalone = useMediaQuery({ query: "(display-mode: standalone)" }); //this checks if app is saved in homescreen mobile app

  return (
    <>
      <Draggable
        axis="x"
        position={{ x: 0, y: 0 }}
        onStop={handleStop}
        bounds={{ right: 50, left: -50 }} //set max drag
        cancel=".chat__header, .chat__body, .chat__footer"
      >
        <div className="chat">
          <div className="chat__header">
            {roomsFetched ? (
              <>
                <div
                  className="chat__headerLeft"
                  onClick={() =>
                    currentRoom?.isGroup
                      ? setIsParticipantsModalOpen(true)
                      : setUserProfileInfoModal(true)
                  }
                >
                  {closingSidebar !== "2" && (
                    <Button
                      size="large"
                      className="back__button"
                      icon={
                        closingSidebar === "1" ? (
                          <LeftOutlined
                            style={{ fontSize: "24px", color: "#08c" }}
                          />
                        ) : (
                          <RightOutlined
                            style={{ fontSize: "24px", color: "#08c" }}
                          />
                        )
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        setClosingSidebar(closingSidebar === "1" ? "0" : "1");
                        // openCloseSidebar("2");
                      }}
                    />
                  )}
                  <div className="icon-container">
                    {currentRoom?.isGroup ? (
                      <Avatar.Group
                        maxCount={2}
                        size="large"
                        maxStyle={{
                          color: "#f56a00",
                          backgroundColor: "#fde3cf",
                        }}
                      >
                        {participants?.map(
                          (user, i) =>
                            user.email !== email && (
                              <Tooltip
                                key={i}
                                title={user.displayName}
                                placement="top"
                              >
                                <Avatar
                                  src={
                                    user?.imageSrc
                                      ? user?.imageSrc
                                      : `https://ui-avatars.com/api/?name=${user.displayName}&background=random`
                                  }
                                />
                              </Tooltip>
                            )
                        )}
                      </Avatar.Group>
                    ) : (
                      <Image
                        width={40}
                        height={40}
                        preview={false}
                        src={
                          currentRoom?.chatImg ||
                          (currentRoom?.isGroup
                            ? ""
                            : `https://api.dicebear.com/6.x/avataaars/svg?seed=4${roomId}`)
                        }
                      />
                    )}
                    {currentRoom?.userStatus && (
                      // for group we don't need status icon
                      <div
                        className="status-circle"
                        style={{
                          backgroundColor:
                            currentRoom.userStatus === "online"
                              ? "green"
                              : "red",
                        }}
                      />
                    )}
                  </div>
                  <div className="chat__headerInfo">
                    <h3>{currentRoom?.chatName}</h3>
                    {getLastSeen()}
                  </div>
                </div>
                <div className="chat__headerRight">
                  {!currentRoom?.isGroup &&
                    //check if this user is in my contact list
                    !contacts.find(
                      (cont) => cont.email === currentRoom.chattingWithUser
                    ) && (
                      <div className="chat__contact_add">
                        <Tooltip
                          placement="left"
                          title="Add user in your contacts!"
                        >
                          <IconButton
                            color="success"
                            onClick={addUserToContacts}
                          >
                            <PersonAddAltIcon />
                          </IconButton>
                        </Tooltip>
                      </div>
                    )}
                  <div className="chat__search">
                    {showSearchInput && (
                      <AutoComplete
                        autoFocus
                        allowClear
                        style={{ width: isMobileView ? 100 : 200 }}
                        onSearch={(text) => setSearchInput(text)}
                        placeholder="Search messages here"
                      />
                    )}
                    <IconButton
                      onClick={() => setShowSearchInput((prev) => !prev)}
                    >
                      <SearchOutlined color="primary" />
                    </IconButton>                    
                  </div>
                  <div className="chat__search">
                    {/* History button */}
                    <IconButton onClick={handleSummarize} style={{ cursor: "pointer" }}> 
                      <HistoryOutlined />
                    </IconButton>
                

                  {/* History Modal */}
                  <Modal
                    title="Chat Summary"
                    open={isHistoryModalOpen} 
                    onCancel={closeHistoryModal} 
                    footer={null}
                  >
                    <p>{summary}</p>
                  </Modal>
                    </div>
                  {/* show delete for rooms except groups */}
                  {/* if room was removed show restore button */}
                  {!currentRoom?.isGroup &&
                    (currentRoom.userRemoved?.[email] !== true ? (
                      <Popconfirm
                        placement="top"
                        onConfirm={deleteChatRoom}
                        title="Delete Chat"
                        description="Really want to delete this chat?"
                        icon={
                          <QuestionCircleOutlined style={{ color: "red" }} />
                        }
                      >
                        <div className="chat__contact_add">
                          <Tooltip title="Delete Chat!">
                            <IconButton color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </Popconfirm>
                    ) : (
                      <div className="chat__contact_add">
                        <Tooltip title="This chat was deleted! Restore!">
                          <IconButton color="warning" onClick={restoreRoom}>
                            <RestoreIcon />
                          </IconButton>
                        </Tooltip>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="skeletonLoading">
                <Skeleton.Avatar active size={44} />
                <Skeleton active title={false} paragraph={{ rows: 2 }} />
              </div>
            )}
          </div>

          {/* CHAT BODY */}
          <ChatBody
            {...{
              roomId,
              currentRoom,
              searchInput,
              isSidebarOpen,
              openCloseSidebar,
              uploadingImage,
            }}
          />
          {/* ENDS CHAT BODY  */}

          <div
            className={`chat__footer ${
              isStandalone && isInputFocused && "inputFocused"
            } `}
          >
            {emojiOpen && (
              <div className="emoji__container">
                <Picker onEmojiClick={onEmojiClick} />
              </div>
            )}

            {!isMobileView && (
              <IconButton
                size="small"
                onClick={() => setEmojiOpen((prev) => !prev)}
              >
                <InsertEmoticon />
              </IconButton>
            )}
            <IconButton onClick={() => hiddenFileInput.current.click()}>
              <PhotoCameraIcon />
            </IconButton>

            <Input
              size="large"
              placeholder="Type something..."
              value={input}
              allowClear
              onChange={(e) => {
                setTyping(e.target.value);
                emojiOpen && setEmojiOpen(false);
                setInput(e.target.value);
              }}
              onPressEnter={sendMessage}
              onFocus={() => {
                isMobileView && isSidebarOpen && openCloseSidebar(false);
                emojiOpen && setEmojiOpen(false);
                isStandalone && setIsInputFocused(true);
              }}
              onBlur={() => isStandalone && setIsInputFocused(false)}
            />
            <Button
              type="primary"
              shape={isMobileView && "circle"}
              icon={<SendOutlined />}
              disabled={input.trim() === ""}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                sendMessage();
              }}
            >
              {!isMobileView && "Send"}
            </Button>
            <input
              type="file"
              ref={hiddenFileInput}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>
        </div>
      </Draggable>
      {isParticipantsModalOpen && (
        <GroupParticipants
          {...{
            participants,
            currentRoom,
            isParticipantsModalOpen,
            setIsParticipantsModalOpen,
          }}
        />
      )}
      {userProfileInfoModal && (
        <UserProfileInfoModal
          {...{
            userProfileInfoModal,
            setUserProfileInfoModal,
            chatImg: currentRoom?.chatImg,
            email: currentRoom.chattingWithUser,
            displayName: currentRoom?.chatName,
            userStatus: currentRoom.userStatus,
          }}
        />
      )}
    </>
  );
};

export default Chat;
