import "./AuthUserProfileModal.scss";
import {
  Modal,
  Avatar,
  Typography,
  Input,
  Tooltip,
  Button,
  Alert,
  message as MessageAntd,
} from "antd";
import { UserOutlined, CloseOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useRef, useState } from "react";
import {
  changeUserPassword,
  deleteImage,
  updateUserDocument,
  uploadImage,
} from "utils/firebase";
import { authActions } from "store";
import { v4 as uuidv4 } from "uuid";

const { Title, Text } = Typography;

const AuthUserProfileModal = ({ isProfileOpen, setIsProfileOpen }) => {
  const hiddenFileInput = useRef(null);
  const dispatch = useDispatch();

  const authenticatedUser = useSelector((state) => state.auth);
  const { contacts } = useSelector((state) => state.contacts);

  const [currPw, setCurrPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [message, setMessage] = useState(false);
  const [newName, setNewName] = useState("");

  const handleClickUpload = () => {
    hiddenFileInput.current.click();
  };
  // save image in storage
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const fileName = `${file.name} - ${uuidv4()}`;
    uploadImage(authenticatedUser.email, file, fileName)
      .then((downloadURL) => {
        updateUserDocument(authenticatedUser, {
          imageSrc: downloadURL,
        }).then((res) => {
          MessageAntd.success("Image Uploaded Successfully");
          dispatch(
            authActions.saveImage({
              imageSrc: downloadURL,
            })
          );
        });
      })
      .catch((error) => {
        console.error("Error uploading image:", error);
      });
  };

  const changeName = () => {
    updateUserDocument(authenticatedUser, {
      displayName: newName,
    }).then((res) => {
      dispatch(authActions.changeName(newName));
      setNewName("");
      MessageAntd.success("Name Changed Successfully");
    });
  };

  const changePassword = () => {
    if (newPw.length < 6) {
      setMessage("Password is to weak");
      return;
    }
    changeUserPassword(currPw, newPw)
      .then((res) => {
        setCurrPw("");
        setNewPw("");
        MessageAntd.success("Password Changed Successfully");
      })
      .catch((error) => {
        setMessage(error.message);
      });
  };

  const removeImagePicture = () => {
    deleteImage(authenticatedUser.imageSrc)
      .then(() => {
        updateUserDocument(authenticatedUser, {
          imageSrc: "",
        }).then((res) => {
          MessageAntd.info("Image Deleted Successfully");
          dispatch(
            authActions.saveImage({
              imageSrc: "",
            })
          );
        });
      })
      .catch((error) => {
        console.error("Error uploading image:", error);
      });
  };

  return (
    <Modal
      className="userModal"
      closable={false}
      title={null}
      open={isProfileOpen}
      onCancel={() => setIsProfileOpen(false)}
      footer={null}
    >
      <div className="userContent">
        <div style={{ position: "relative" }}>
          <Tooltip placement="right" title="Click to Upload Image">
            <Avatar
              className="userAvatar"
              size="large"
              icon={<UserOutlined />}
              src={authenticatedUser?.imageSrc || ""}
              onClick={handleClickUpload}
            />
          </Tooltip>
          {authenticatedUser?.imageSrc && (
            <button className="remove-img" onClick={removeImagePicture}>
              <CloseOutlined style={{ fontSize: "14px", color: "white" }} />
            </button>
          )}
        </div>

        <input
          type="file"
          ref={hiddenFileInput}
          onChange={handleFileChange}
          gap={6}
          style={{ display: "none" }}
        />
        <Title level={4} className="userName">
          {authenticatedUser.displayName}
        </Title>
        <Text>
          <strong>Email: </strong>
          {authenticatedUser.email}
        </Text>
        <Text>
          <strong>Total Contacts:</strong> {contacts.length}
        </Text>
        <div className="userSection">
          <h3>Change Name</h3>
          <div className="input_save">
            <Input
              placeholder="New name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Button disabled={newName.trim() === ""} onClick={changeName}>
              Save
            </Button>
          </div>
        </div>
        <div className="userSection">
          <h3>Change Password</h3>
          <Input.Password
            placeholder="Type current password"
            value={currPw}
            onChange={(e) => setCurrPw(e.target.value)}
          />
          <div className="input_save">
            <Input.Password
              status={currPw === newPw ? "error" : ""}
              placeholder="Type new password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              disabled={currPw.trim() === ""}
            />
            <Button
              disabled={
                currPw.trim() === "" || newPw.trim() === "" || currPw === newPw
              }
              onClick={changePassword}
            >
              Save
            </Button>
          </div>
          {currPw !== "" && currPw === newPw && (
            <Alert
              type="error"
              closable
              message="Current password is same as new password"
              banner
            ></Alert>
          )}
          {message && (
            <Alert type="error" closable message={message} banner></Alert>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AuthUserProfileModal;
