import {
  Button,
  Modal,
  Popconfirm,
  Tooltip,
  message,
  Image,
  Select,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  updateRoom,
  deleteRoom,
  updateUserDocument,
  updateRoomFields,
} from "utils/firebase";
import "./GroupParticipants.scss";
import {
  SendOutlined,
  UsergroupDeleteOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  UserAddOutlined,
  PlusOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useChatWithUser } from "utils/hooks/useChatWithUser";
import { contactsActions } from "store";
import { useEffect, useState } from "react";
import UserProfileInfoModal from "./UserProfileInfoModal";
import { sendFirebaseNotification } from "utils/sendFirebaseNotification";

const GroupParticipants = ({
  participants,
  currentRoom,
  isParticipantsModalOpen,
  setIsParticipantsModalOpen,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const { chatWithUserHandler } = useChatWithUser();

  const authenticatedUser = useSelector((state) => state.auth);
  const { contacts } = useSelector((state) => state.contacts);
  const { rooms } = useSelector((state) => state.rooms);
  const { myUsers } = useSelector((state) => state.users);

  const [contactsList, setContactsList] = useState([]); // save list modified of contacts
  const [selectedValues, setSelectedValues] = useState([]); // save selected values of users from select input
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [userProfileInfoModal, setUserProfileInfoModal] = useState(false);
  const groupAdmin = currentRoom?.admin === authenticatedUser.email;

  const goToChat = (user) => {
    const existingRoomId = contacts.find(
      (cont) => cont.email === user.email
    )?.roomId;

    existingRoomId
      ? navigate(`/rooms/${existingRoomId}`)
      : chatWithUserHandler(user.email);

    setIsParticipantsModalOpen(false);
  };

  const removeUserFromGroup = (email) => {
    updateRoomFields(currentRoom.roomId, {
      userRemoved: {
        [email]: true,
      },
    }).catch((err) => console.log({ err }));
  };

  const deleteGroup = () => {
    deleteRoom(currentRoom.roomId).catch((err) => console.log({ err }));
    navigate("/");
  };

  const addUserToContacts = (email) => {
    //find room with this user and save our roomId
    const roomExists = rooms.find(
      (room) => room?.users.length === 2 && room?.chattingWithUser === email
    );
    const updatedContacts = [
      ...contacts,
      { email: email, roomId: roomExists?.roomId || "" },
    ];
    updateUserDocument(authenticatedUser, {
      contacts: updatedContacts,
    }).then((res) => {
      message.success("User added to your contacts");
      dispatch(contactsActions.myContacts(updatedContacts));
    });
  };

  useEffect(() => {
    setContactsList(
      contacts?.map((contact) => {
        const findedUser = myUsers.find((user) => user.email === contact.email);
        return {
          ...contact,
          displayName: findedUser?.displayName,
        };
      })
    );
  }, [myUsers.length]);

  //filter contacts by participants & filter contacts that are selected
  const filteredOptions =
    contactsList
      .filter((cont) => !participants.some((part) => part.email === cont.email))
      ?.filter((cont) => !selectedValues.includes(cont.email)) || [];

  const addUsersInGroup = () => {
    const updatedSelectedContacts = selectedContacts.map(({ email }) => ({
      email,
    }));

    //update current users if a user was removed and is added again
    const updatedRoomUsers = currentRoom.users.filter(
      (user) =>
        !updatedSelectedContacts.some(
          (userToAdd) => userToAdd.email === user.email
        )
    );
    // make that added user false as removed from group(even if it is removed one time and again is added)
    let userRemovedObj = {};
    updatedSelectedContacts.forEach(
      (item) => (userRemovedObj[item.email] = false)
    );

    let addedUsersNotifTokens = [];
    let roomUsersNotifTokens = [];
    let addedUser = "";
    myUsers.forEach((user) => {
      if (updatedRoomUsers.some((cont) => cont.email === user.email)) {
        user?.notificationToken &&
          roomUsersNotifTokens.push(user.notificationToken);
        addedUser = user.displayName;
      }
      if (updatedSelectedContacts.some((cont) => cont.email === user.email)) {
        user?.notificationToken &&
          addedUsersNotifTokens.push(user.notificationToken);
      }
    });

    const notifBody =
      updatedSelectedContacts.length > 1
        ? `${updatedSelectedContacts.length} Users added in group!`
        : `${addedUser} added in group!`;

    updateRoom(currentRoom.roomId, {
      userRemoved: { ...currentRoom.userRemoved, ...userRemovedObj },
      users: [...updatedRoomUsers, ...updatedSelectedContacts],
    })
      .then(() => {
        sendFirebaseNotification(
          `[${currentRoom.chatName}] New user added!`,
          notifBody,
          authenticatedUser.imageSrc,
          roomUsersNotifTokens,
          {
            toUser: JSON.stringify([
              updatedRoomUsers.map(({ email }) => email),
            ]),
            linkTo: `https://chatshqip.netlify.app${location.pathname}`,
          }
        );
        sendFirebaseNotification(
          "New Group!",
          `${authenticatedUser.displayName} added you in a group!`,
          authenticatedUser.imageSrc,
          addedUsersNotifTokens,
          {
            toUser: JSON.stringify([
              selectedContacts.map(({ email }) => email),
            ]),
            linkTo: `https://chatshqip.netlify.app${location.pathname}`,
          }
        );
        setSelectedValues([]);
      })
      .catch((err) => console.log({ err }));
  };

  const leaveGroup = () => {
    updateRoomFields(currentRoom.roomId, {
      userRemoved: {
        [authenticatedUser.email]: true,
      },
    }).catch((err) => console.log({ err }));
  };

  return (
    <Modal
      title={
        <>
          Users in <b>{currentRoom?.chatName}</b> group!
        </>
      }
      open={isParticipantsModalOpen}
      footer={
        groupAdmin ? (
          <Popconfirm
            placement="top"
            onConfirm={() => deleteGroup()}
            title="Delete Group"
            description="Are you sure to delete this group?"
            icon={<QuestionCircleOutlined style={{ color: "red" }} />}
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete Group
            </Button>
          </Popconfirm>
        ) : (
          <Popconfirm
            placement="top"
            onConfirm={() => leaveGroup()}
            title="Leave Group"
            description="Are you sure you want to leave this group?"
            icon={<QuestionCircleOutlined style={{ color: "red" }} />}
          >
            <Button danger type="primary" icon={<LogoutOutlined />}>
              Leave Group
            </Button>
          </Popconfirm>
        )
      }
      onCancel={() => setIsParticipantsModalOpen(false)}
    >
      <div className="participants-list">
        <h3 style={{ margin: 0 }}>{participants.length} Participants</h3>
        {participants.map((user, i) => {
          //check if this user is in my contact list
          const isUserInMyContacts = !!contacts.find(
            (cont) => cont.email === user.email
          );
          return (
            <div key={user.email} className="participant">
              <div className="user-info">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setUserProfileInfoModal({
                      chatImg: user?.imageSrc,
                      email: user.email,
                      displayName: user?.chatName,
                      userStatus: user.status,
                    })
                  }
                >
                  <Image
                    width={40}
                    height={40}
                    preview={false}
                    src={
                      user?.imageSrc
                        ? user.imageSrc
                        : `https://ui-avatars.com/api/?name=${user.displayName}&background=random`
                    }
                  />
                  <div className="name">
                    {user?.displayName}
                    {user.email === authenticatedUser.email && " (me)"}
                  </div>
                </div>
                &nbsp;
                <div className="user-status">
                  {user?.status && (
                    <div
                      className="status"
                      style={{
                        backgroundColor:
                          user.status === "online" ? "green" : "red",
                      }}
                    />
                  )}
                  &nbsp;
                  {user?.status}
                </div>
              </div>
              {user.email !== authenticatedUser.email && (
                <div className="chat_button">
                  {!isUserInMyContacts && (
                    <div className="chat__contact_add">
                      <Tooltip
                        placement="left"
                        title="Add user in your contacts!"
                      >
                        <Button
                          type="text"
                          shape="round"
                          onClick={() => addUserToContacts(user.email)}
                          icon={<UserAddOutlined twoToneColor="#eb2f96" />}
                        />
                      </Tooltip>
                    </div>
                  )}
                  <Button
                    type="text"
                    shape="round"
                    onClick={() => goToChat(user)}
                    icon={<SendOutlined />}
                  />
                  {groupAdmin && participants.length > 3 && (
                    <Popconfirm
                      placement="right"
                      title="Remove this user from the group?"
                      onConfirm={() => removeUserFromGroup(user.email)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        type="text"
                        danger
                        shape="round"
                        icon={<UsergroupDeleteOutlined />}
                      />
                    </Popconfirm>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {groupAdmin && (
          <div style={{ display: "flex", gap: "5px" }}>
            <Select
              mode="multiple"
              placeholder="Select Users from Contacts"
              allowClear
              showSearch={false}
              value={selectedValues}
              onChange={(value, option) => {
                setSelectedValues(value);
                setSelectedContacts(option);
              }}
              style={{
                width: "100%",
              }}
              options={filteredOptions.map((item) => ({
                email: item.email,
                value: item.displayName,
                label: item.displayName,
              }))}
            />
            <div className="chat_button">
              <Button
                type="dashed"
                shape="round"
                disabled={!selectedValues.length}
                onClick={addUsersInGroup}
                icon={<PlusOutlined />}
              >
                Add
              </Button>
            </div>
          </div>
        )}
        {userProfileInfoModal && (
          <UserProfileInfoModal
            {...{
              userProfileInfoModal,
              setUserProfileInfoModal,
              ...userProfileInfoModal,
            }}
          />
        )}
      </div>
    </Modal>
  );
};
export default GroupParticipants;
