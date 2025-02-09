import { Modal, Typography, Tooltip, Image } from "antd";
import "./UserProfileInfoModal.scss";
const { Title, Text } = Typography;

const UserProfileInfoModal = ({
  userProfileInfoModal,
  setUserProfileInfoModal,
  chatImg,
  displayName,
  email,
  userStatus,
}) => {
  return (
    <Modal
      className="userModal"
      closable={false}
      title={null}
      open={userProfileInfoModal}
      onCancel={() => setUserProfileInfoModal(false)}
      footer={null}
    >
      <div className="userContent">
        <Image
          width={100}
          height={100}
          preview={!!chatImg}
          src={
            chatImg ||
            `https://ui-avatars.com/api/?name=${displayName}&background=random`
          }
        />
        <Title level={4} className="userName">
          {displayName}
        </Title>
        <Text>
          <strong>Email: </strong>
          {email}
        </Text>
        <Text>
          <strong>Status:</strong>
          <text style={{ color: userStatus === "online" ? "green" : "red" }}>
            {" " + userStatus}
          </text>
        </Text>
      </div>
    </Modal>
  );
};

export default UserProfileInfoModal;
