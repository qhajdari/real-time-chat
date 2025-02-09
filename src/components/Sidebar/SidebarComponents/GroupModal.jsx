import { Input, Modal, Select, message } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { UsergroupAddOutlined } from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import { useLocation, useNavigate } from "react-router-dom";
import { createGroup } from "utils/firebase";
import { sendFirebaseNotification } from "utils/sendFirebaseNotification";

const GroupModal = ({ isGroupModalOpen, setIsGroupModalOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { contacts } = useSelector((state) => state.contacts);
  const auth = useSelector((state) => state.auth);
  const { myUsers } = useSelector((state) => state.users);

  const [selectedValues, setSelectedValues] = useState([]); // save selected users from select form
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [contactsList, setContactsList] = useState([]); // save list modified of contacts

  // useEffect(() => {
  //   getAllUsers().then((users) =>
  //     setContactsList(
  //       contacts?.map((contact) => {
  //         const chatingUser = users.find(
  //           (user) => user.email === contact.email
  //         );
  //         return {
  //           ...contact,
  //           displayName: chatingUser?.displayName,
  //           imageSrc: chatingUser?.imageSrc,
  //         };
  //       })
  //     )
  //   );
  // }, []);

  useEffect(() => {
    setContactsList(
      contacts?.map((contact) => {
        const chatingUser = myUsers.find(
          (user) => user.email === contact.email
        );
        return {
          ...contact,
          displayName: chatingUser?.displayName,
          notificationToken: chatingUser?.notificationToken,
        };
      })
    );
  }, [myUsers.length]);

  //selected contacts remove from select list
  const filteredOptions =
    contactsList?.filter((cont) => !selectedValues.includes(cont.email)) || [];

  const createGroupFunc = () => {
    if (selectedContacts.length > 1) {
      // get only email from object
      const updatedSelectedContacts = selectedContacts.map(({ email }) => ({
        email,
      }));
      const notificationTokens = selectedContacts
        .map(({ notificationToken }) => notificationToken)
        .filter(Boolean);
      const generatedId = uuidv4();
      createGroup(generatedId, groupName, auth, updatedSelectedContacts)
        .then((res) => {
          sendFirebaseNotification(
            "New Group!",
            `${auth.displayName} added you in a group!`,
            auth.imageSrc,
            notificationTokens,
            {
              toUser: JSON.stringify([
                selectedContacts.map(({ email }) => email),
              ]),
              linkTo: `https://chatshqip.netlify.app${location.pathname}`,
            }
          );
          navigate(`/rooms/${generatedId}`);
          setIsGroupModalOpen(false);
        })
        .catch((err) => console.log(err));
    } else message.warning("Group must be with 2 users or more");
  };

  return (
    <Modal
      title="Create New Group"
      open={isGroupModalOpen}
      // centered
      onCancel={() => setIsGroupModalOpen(false)}
      onOk={createGroupFunc}
      okText="Create Group"
      cancelText="Discard"
    >
      <div className="group_header"></div>
      <div className="group_content">
        <label>
          <h3>Group Name:</h3>
        </label>
        <Input
          placeholder="Enter Group name"
          allowClear
          prefix={<UsergroupAddOutlined />}
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <label>
          <h3>Users:</h3>
        </label>
        <Select
          mode="multiple"
          placeholder="Select Users from My Contacts"
          allowClear
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
            notificationToken: item.notificationToken,
          }))}
        />
      </div>
    </Modal>
  );
};
export default GroupModal;
