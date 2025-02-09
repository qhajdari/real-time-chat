import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { contactsActions } from "store";
import { createRoom, updateUserDocument } from "utils/firebase";
import { v4 as uuidv4 } from "uuid";
import { useReduxToolkit } from "./useReduxToolkit";

export const useChatWithUser = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const authenticatedUser = useSelector((state) => state.auth);
  const { contacts } = useSelector((state) => state.contacts);
  const { rooms } = useSelector((state) => state.rooms);

  const [selectedRoomId, setSelectedRoomId] = useReduxToolkit("selectedRoomId");

  const chatWithUserHandler = (email) => {
    //check if i have a room with that user avoid group rooms
    const roomExists = rooms.find(
      (room) => room?.users.length === 2 && room?.chattingWithUser === email
    );

    console.log({ roomExists });

    //if i have a room with it, save roomId for the future chat
    if (roomExists) {
      const updatedContacts = contacts.map((cont) =>
        cont.email === email ? { ...cont, roomId: roomExists.roomId } : cont
      );
      updateUserDocument(authenticatedUser, {
        contacts: updatedContacts,
      }).then(() => {
        dispatch(contactsActions.myContacts(updatedContacts));
        navigate(`/rooms/${roomExists.roomId}`);
      });
    } else {
      const generatedId = uuidv4();
      createRoom(generatedId, authenticatedUser.email, email)
        .then((res) => {
          updateUserDocument(authenticatedUser, {
            contacts: contacts.map((cont) =>
              cont.email === email
                ? { email: email, roomId: generatedId }
                : cont
            ),
          });
          setSelectedRoomId(generatedId);
          navigate(`/rooms/${generatedId}`);
        })
        .catch((err) => console.log(err));
    }
  };
  return { chatWithUserHandler };
};
