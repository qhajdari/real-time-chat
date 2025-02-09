import "./ChatsList.scss";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Avatar, Badge, Skeleton } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useMediaQuery } from "react-responsive";
import { searchValue } from "utils/searchValue";
import { useReduxToolkit } from "utils/hooks/useReduxToolkit";
import { Groups2Icon } from "icons";

const ChatsList = ({ search, isSidebarOpen, openCloseSidebar }) => {
  const location = useLocation();
  const roomIdLocation = location?.pathname?.split("/")?.[2]; //roomId

  const { rooms, roomsFetched } = useSelector((state) => state.rooms);
  const { myUsers } = useSelector((state) => state.users);
  const { email } = useSelector((state) => state.auth);

  const [selectedRoomId, setSelectedRoomId] = useReduxToolkit("selectedRoomId");

  // filter removed rooms and set chatName, chatImage & userStatus
  const modifiedRooms =
    rooms
      .filter((room) => room.userRemoved?.[email] !== true)
      .map((room) => {
        // if room is a group
        if (room?.isGroup) {
          return {
            ...room,
            chatName: room?.roomName,
            chatImg: room?.imageSrc,
          };
        } else {
          const chatingUser = myUsers.find(
            (user) => user.email === room.chattingWithUser
          );
          return {
            ...room,
            chatName: chatingUser?.displayName,
            chatImg: chatingUser?.imageSrc,
            userStatus: chatingUser?.status,
          };
        }
      }) || [];

  const goToChat = (roomId) => {
    setSelectedRoomId(roomId);
    if (isMobileView) {
      roomIdLocation === roomId && openCloseSidebar(!isSidebarOpen);
      // : isSidebarOpen && openCloseSidebar(false);
    }
  };

  const isMobileView = useMediaQuery({
    query: "(max-width: 460px)",
  });

  const sortedChats = searchValue(modifiedRooms, "chatName", search).sort(
    (a, b) => b.lastMessage?.updatedAt - a.lastMessage?.updatedAt
  );

  return (
    <div className="sidebar__chats">
      {roomsFetched ? (
        sortedChats.map((room, i) => {
          const roomId = room.roomId;
          const notMyMessages = room.chats.filter(
            (chat) => chat.author !== email
          ).length;
          return (
            <Badge
              key={roomId}
              className={`${!isSidebarOpen && "badgeSidebarClosed"}`}
              overflowCount={99}
              count={notMyMessages - (room?.messagesRead?.[email] || 0)}
              style={{
                backgroundColor: room.userStatus === "online" ? "green" : "red",
              }}
            >
              <Link to={`/rooms/${roomId}`} onClick={() => goToChat(roomId)}>
                <div
                  className={`sidebarChat`}
                  style={{
                    backgroundColor: roomId === selectedRoomId ? "#f0f0f0" : "",
                  }}
                >
                  <div className="icon-container">
                    <Avatar
                      size="large"
                      icon={<UserOutlined />}
                      src={
                        room?.chatImg ||
                        `https://api.dicebear.com/6.x/avataaars/svg?seed=4${roomId}`
                      }
                    />
                    {room?.isGroup ? (
                      <div className="groupIcon">
                        <Groups2Icon />
                      </div>
                    ) : (
                      <div
                        className="status-circle"
                        style={{
                          backgroundColor:
                            room.userStatus === "online" ? "green" : "red",
                        }}
                      />
                    )}
                  </div>
                  {isSidebarOpen && (
                    <div className="sidebarChat__info">
                      <h2>{room.chatName}</h2>
                      <p
                        className={
                          room.lastMessage?.isDeleted
                            ? "chat_lastMsg_deleted"
                            : ""
                        }
                      >
                        {room.lastMessage?.value || <>&nbsp;</>}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            </Badge>
          );
        })
      ) : (
        <Skeleton style={{ padding: "15px" }} active paragraph={{ rows: 16 }} />
      )}
    </div>
  );
};

export default ChatsList;
