import "./ChatBody.scss";
import { DoDisturbAlt, DoneAll } from "icons";
import moment from "moment/moment";
import { useSelector } from "react-redux";
import { Image, Skeleton, Dropdown } from "antd";
import { searchValue } from "utils/searchValue";
import { useMediaQuery } from "react-responsive";
import { useEffect, useRef, useState } from "react";
import { updateRoom } from "utils/firebase";

const ChatBody = ({
  roomId,
  currentRoom,
  searchInput,
  isSidebarOpen,
  openCloseSidebar,
  uploadingImage,
}) => {
  const containerRef = useRef(null);
  const { email } = useSelector((state) => state.auth);

  // for mobile is used to open delete message menu
  const [longPressTimeout, setLongPressTimeout] = useState(null); //save timeout to clear it
  const [dropdownVisible, setDropdownVisible] = useState(false);

  //auto scroll bottom
  useEffect(() => {
    // if user is deleting a message dont scroll
    if (!dropdownVisible) {
      const container = containerRef.current;
      const scrollToBottom = () => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      };
      scrollToBottom();
    }
  }, [currentRoom?.chats?.length]);

  //if delete dropdown is shown and user scrolls remove dropdown
  useEffect(() => {
    const container = containerRef.current;
    container.addEventListener("scroll", disableDeleteDropdown);
    return () => {
      container.removeEventListener("scroll", disableDeleteDropdown);
    };
  }, []);

  const disableDeleteDropdown = () => {
    setDropdownVisible(false);
  };

  const isMobileView = useMediaQuery({
    query: "(max-width: 460px)",
  });

  const isTyping = () => {
    const groupTyping = () => {
      const keysToSearch = Object.keys(currentRoom?.typing).filter(
        (emailKey) => emailKey !== email
      );
      return keysToSearch.some((key) => currentRoom?.typing[key]);
    };
    return currentRoom.isGroup
      ? groupTyping()
      : currentRoom?.typing?.[currentRoom?.chattingWithUser]; //in group check if any user except me is typing
  };

  const handleContextMenuClick = (event, msgId) => {
    const updatedChats = currentRoom.chats.map((msg) =>
      msg.messageId === msgId ? { ...msg, isDeleted: true } : msg
    );
    const lastMsg = updatedChats[updatedChats.length - 1];

    updateRoom(roomId, {
      chats: updatedChats,
      lastMessage: {
        value: lastMsg.isDeleted ? "This message was deleted" : lastMsg.message,
        updatedAt: lastMsg.createdAt,
        isDeleted: !!lastMsg.isDeleted,
      },
    }).catch((err) => console.log({ err }));
  };

  //only for mobile view
  const handleTouchStart = (e, messageId) => {
    setLongPressTimeout(
      setTimeout(() => {
        setLongPressTimeout(null);
        setDropdownVisible(messageId);
      }, 500)
    );
  };
  const handleTouchEnd = () => {
    clearTimeout(longPressTimeout);
    setLongPressTimeout(null);
  };

  return (
    <div className="draggable__chat__body" ref={containerRef}>
      <div
        onClick={() => {
          isMobileView && isSidebarOpen && openCloseSidebar("1");
          isMobileView && dropdownVisible && setDropdownVisible(false); //remove delete button when user clicks outside
        }}
        className="chat__body"
      >
        {searchValue(currentRoom?.chats, "message", searchInput, [
          "isImage",
          "deleted",
        ])?.map((message, i) => {
          const formattedTime = moment(message.createdAt).format("HH:mm");
          const disableDelete =
            message?.isDeleted || !(message?.author === email); //disable if im not author or message is deleted
          return (
            <div
              className="disable-text-selection"
              style={{ cursor: "context-menu" }}
              key={i}
            >
              <Dropdown
                disabled={disableDelete}
                menu={{
                  items: [{ label: "Delete" }],
                  onClick: (e) => {
                    handleContextMenuClick(e, message.messageId);
                  },
                }}
                overlayStyle={{ width: "50px !important", minWidth: "unset" }}
                trigger={isMobileView ? ["click"] : ["contextMenu"]}
                open={
                  isMobileView
                    ? !disableDelete && message.messageId === dropdownVisible
                    : undefined //undefined should be for web view
                }
              >
                <p
                  onTouchStart={(e) =>
                    isMobileView && handleTouchStart(e, message.messageId)
                  }
                  onTouchEnd={() => isMobileView && handleTouchEnd()}
                  className={`chat__message ${
                    message?.author === email && "chat__reciever"
                  } ${message?.isDeleted === true && "chat__deleted"}`}
                >
                  <span className="chat__name">
                    <nobr>{currentRoom.userNames[message.author]}</nobr>
                  </span>
                  <span className="chat__box">
                    <div className="mesage__content">
                      {message.isDeleted ? (
                        <span className="chat__deleted__text">
                          <DoDisturbAlt fontSize="small" />
                          {(!isMobileView || !isSidebarOpen) && (
                            <span>"This message was deleted"</span>
                          )}
                        </span>
                      ) : message?.isImage ? (
                        <Image width={100} src={message.message} />
                      ) : (
                        message.message
                      )}
                    </div>
                    {(!isMobileView || isSidebarOpen !== "2") && (
                      <div className="message__info">
                        <span className="chat__timestamp">
                          <span>{formattedTime}</span>
                        </span>
                        {message?.author === email && (
                          <DoneAll
                            style={{
                              color: message?.isSeen ? "#1976d2" : "#87a18b",
                            }}
                            className="seen-tick"
                          />
                        )}
                      </div>
                    )}
                  </span>
                </p>
              </Dropdown>
            </div>
          );
        })}
        {uploadingImage && (
          <Skeleton.Image style={{ width: 200, height: 200 }} active />
        )}
        {isTyping() && (
          <div className="chat__message typing-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBody;
