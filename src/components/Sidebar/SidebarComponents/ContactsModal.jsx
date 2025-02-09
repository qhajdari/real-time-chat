import "./ContactsModal.scss";
import { CloseIcon, SearchOutlined, SearchOffIcon, IconButton } from "icons";
import {
  AutoComplete,
  Avatar,
  Button,
  Modal,
  Popconfirm,
  message,
  Input,
} from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { contactsActions } from "../../../store";
import { searchValue } from "../../../utils/searchValue";
import { useNavigate } from "react-router-dom";
import { updateUserDocument, getUserByEmail } from "utils/firebase";
import {
  SendOutlined,
  CloseOutlined,
  UserAddOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useChatWithUser } from "utils/hooks/useChatWithUser";
import { useReduxToolkit } from "utils/hooks/useReduxToolkit";
import axios from "axios";
import { sendFirebaseNotification } from "utils/sendFirebaseNotification";

const ContactsModal = ({ isContactModalOpen, setIsContactModalOpen }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const { contacts } = useSelector((state) => state.contacts);
  const { myUsers } = useSelector((state) => state.users);
  const { email, displayName, imageSrc } = useSelector((state) => state.auth);

  const { chatWithUserHandler } = useChatWithUser();

  const [selectedRoomId, setSelectedRoomId] = useReduxToolkit("selectedRoomId");

  const [contactsList, setContactsList] = useState([]); //modify contacts to add some othe fields
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchContact, setSearchContact] = useState("");
  const [searchedUser, setSearchedUser] = useState("");

  //add more info of users to contacts
  useEffect(() => {
    setContactsList(
      contacts?.map((contact) => {
        const userFinded = myUsers.find((user) => user.email === contact.email);
        return {
          ...contact,
          displayName: userFinded?.displayName,
          imageSrc: userFinded?.imageSrc,
        };
      })
    );
  }, [myUsers, contacts]);

  const addNewContact = () => {
    if (searchedUser.trim() === "") return;
    if (searchedUser === email) {
      message.info("You can not add yourself!!!");
      return;
    }

    const contactExists = contacts.find((cont) => cont.email === searchedUser);
    if (contactExists) {
      message.warning("User is already in your contacts list!");
    } else {
      getUserByEmail(searchedUser)
        .then((currUser) => {
          const updatedContacts = [
            ...contacts,
            { email: currUser.email, roomId: "" },
          ];
          updateUserDocument(auth, {
            contacts: updatedContacts,
          }).then((res) => {
            message.success("User added to your contacts");
            dispatch(contactsActions.myContacts(updatedContacts));
            sendFirebaseNotification(
              "New Friend!",
              `${displayName} added you as friend`,
              imageSrc,
              [currUser?.notificationToken],
              { toUser: JSON.stringify([currUser.email]) }
            );
            setSearchedUser("");
          });
        })
        .catch((error) => message.error(error.message));
    }
  };

  const goToChat = (contact) => {
    //check if i have chat room with my contact
    if (contact?.roomId) {
      setSelectedRoomId(contact.roomId);
      navigate(`/rooms/${contact.roomId}`);
    } else chatWithUserHandler(contact.email);

    setIsContactModalOpen(false);
  };

  //remove a contact from list
  const removeContact = (contact) => {
    const updatedContacts = contacts.filter(
      (cont) => cont.email !== contact.email
    );
    updateUserDocument(auth, {
      contacts: updatedContacts,
    }).then((res) => {
      dispatch(contactsActions.myContacts(updatedContacts));
    });
  };

  const modalHeader = (
    <div className="contacts_header">
      {showSearchInput ? (
        <IconButton
          onClick={() => {
            setShowSearchInput(false);
            setSearchContact("");
          }}
        >
          <SearchOffIcon />
        </IconButton>
      ) : (
        <IconButton onClick={() => setShowSearchInput(true)}>
          <SearchOutlined />
        </IconButton>
      )}
      {showSearchInput ? (
        <AutoComplete
          autoFocus
          allowClear
          style={{ width: 200 }}
          onSearch={(text) => setSearchContact(text)}
          placeholder="Search your contacts here"
        />
      ) : (
        <span>My Contact List</span>
      )}
      <IconButton onClick={() => setIsContactModalOpen(false)}>
        <CloseIcon />
      </IconButton>
    </div>
  );
  const modalFooter = (
    <div
      style={{
        display: "flex",
        textAlign: "start",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
      }}
    >
      <Input
        allowClear
        size="large"
        placeholder="Add user by email or phone!"
        value={searchedUser}
        onChange={(e) => setSearchedUser(e.target.value)}
        prefix={<UserAddOutlined />}
        onPressEnter={addNewContact}
      />
      <div className="chat_button">
        <Button
          type="dashed"
          shape="round"
          size="large"
          disabled={!searchedUser}
          onClick={addNewContact}
          icon={<PlusOutlined />}
        >
          Add
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      closable={false}
      title={modalHeader}
      open={isContactModalOpen}
      onCancel={() => setIsContactModalOpen(false)}
      footer={modalFooter}
    >
      <div className="contacts_list">
        {searchValue(contactsList, "displayName", searchContact)?.map(
          (contact, i) => (
            <div key={i} className="contactChat">
              <div className="chat_info">
                <Avatar
                  src={
                    contact?.imageSrc
                      ? contact.imageSrc
                      : `https://avatars.dicebear.com/api/human/${contact.email}.svg`
                  }
                />
                <div className="contactChat__info">
                  <h2>{contact.displayName}</h2>
                </div>
              </div>

              <div className="chat_button">
                <Button
                  type="primary"
                  shape="round"
                  onClick={() => goToChat(contact)}
                  icon={<SendOutlined />}
                />
                <Popconfirm
                  placement="topRight"
                  title="Are you sure to delete this contact?"
                  onConfirm={() => removeContact(contact)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="primary"
                    danger
                    shape="round"
                    icon={<CloseOutlined />}
                  />
                </Popconfirm>
              </div>
            </div>
          )
        )}
      </div>
    </Modal>
  );
};
export default ContactsModal;
