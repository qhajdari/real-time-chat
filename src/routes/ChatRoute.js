import { Chat } from "components";
import { useParams } from "react-router-dom";

const ChatRoute = ({ openCloseSidebar, closingSidebar, setClosingSidebar }) => {
  const { roomId } = useParams();

  return (
    <Chat
      key={roomId}
      {...{ openCloseSidebar, roomId, closingSidebar, setClosingSidebar }}
    />
  );
};

export default ChatRoute;
