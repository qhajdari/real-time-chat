import {
  MoreVert,
  IconButton,
  PersonAddIcon,
  Groups2Icon,
  LogoutIcon,
  HomeIcon,
} from "icons";
import React, { useEffect, useRef, useState } from "react";
import "./Sidebar.scss";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { authActions } from "../../store";
import ChatsList from "./SidebarComponents/ChatsList";
import ContactsModal from "./SidebarComponents/ContactsModal";
import {
  SearchOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  HomeOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Dropdown,
  Input,
  Skeleton,
  Tooltip,
  Tour,
  message,
} from "antd";
import { updateUserDocument } from "utils/firebase";
import GroupModal from "./SidebarComponents/GroupModal";
import { useReduxToolkit } from "utils/hooks/useReduxToolkit";
import AuthUserProfileModal from "./SidebarComponents/AuthUserProfileModal";

//menu items
const items = [
  {
    label: "Home",
    key: "home",
    icon: <HomeOutlined />,
  },
  {
    label: "Profile",
    key: "profile",
    icon: <UserOutlined />,
  },

  {
    label: "Log Out",
    key: "logout",
    icon: <LogoutIcon />,
    danger: true,
  },
  {
    label: "Refresh",
    key: "refresh",
    icon: <ReloadOutlined />,
  },
];

const Sidebar = ({ closingSidebar, openCloseSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const roomId = location?.pathname?.split("/")?.[2]; //roomId

  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);
  const ref4 = useRef(null);

  const authenticatedUser = useSelector((state) => state.auth);

  const [search, setSearch] = useState("");
  const [isContactModalOpen, setIsContactModalOpen] = useState(false); //contacts list modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [openTour, setOpenTour] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useReduxToolkit("isSidebarOpen");

  const LogOut = () => {
    message.info("Logging out!");
    updateUserDocument(authenticatedUser, {
      status: "offline",
      notificationToken: "",
    }).then((res) => {
      localStorage.setItem("userId", "");
      dispatch(authActions.logout());
      navigate("/login");
      message.warning("Logged out Successfully");
    });
  };

  const handleMenuClick = (e) => {
    if (e.key === "logout") LogOut();
    else if (e.key === "home") navigate("/");
    else if (e.key === "profile") setIsProfileOpen(true);
    else if (e.key === "refresh") window.location.reload();
  };

  const tourSteps = [
    {
      title: "Profile",
      description: "Here is your profile!",
      target: () => ref1.current,
    },
    {
      title: "Contacts",
      description: "Add a friend here!",
      target: () => ref2.current,
    },

    {
      title: "Options",
      description: "Click to see more actions.",
      target: () => ref3.current,
    },
    {
      title: "Group",
      description: "Easy to create group here!",
      target: () => ref4.current,
    },
  ];

  useEffect(() => {
    // after user is logged in within 1 minute set tour to true
    if (authenticatedUser.userFetched) {
      const currentDate = Date.now();
      const difference = currentDate - (authenticatedUser?.updatedAt || 0);
  
      //if user is not seen since 2 weeks
      if (difference > 1209600000) {
        setOpenTour(true);
        updateUserDocument(authenticatedUser, {
          updatedAt: currentDate,
        }).then(() => {
          dispatch(
            authActions.setUser({
              ...authenticatedUser,
              updatedAt: currentDate,
            })
          );
        });
      }
    }
  }, [authenticatedUser]);

  return (
    <div
      className={`sidebar ${
        closingSidebar === "0"
          ? " full_closed"
          : closingSidebar === "1"
          ? " half_closed"
          : ""
      } ${isSidebarOpen ? "" : " closed"}`}
    >
      {closingSidebar !== "0" && (
        <>
          <div className="sidebar__header">
            {authenticatedUser.userFetched ? (
              <>
                <Tour
                  open={openTour}
                  onClose={() => setOpenTour(false)}
                  steps={tourSteps}
                  mask={{
                    style: {
                      boxShadow: "inset 0 0 15px #333",
                    },
                  }}
                />
                <Tooltip title="Profile" onClick={() => setIsProfileOpen(true)}>
                  <div ref={ref1} className="sidebar___user">
                    <Avatar
                      shape="square"
                      size="large"
                      icon={<UserOutlined />}
                      src={authenticatedUser?.imageSrc || ""}
                    />
                    {isSidebarOpen && <h3>{authenticatedUser.displayName}</h3>}
                  </div>
                </Tooltip>
                <div className="sidebar__headerRight">
                  <Tooltip title="Home">
                    <IconButton onClick={() => navigate("/")}>
                      <HomeIcon color="primary" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add Contact">
                    <IconButton
                      ref={ref2}
                      onClick={() => setIsContactModalOpen(true)}
                    >
                      <PersonAddIcon color="primary" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="More">
                    <IconButton ref={ref3}>
                      <Dropdown
                        menu={{
                          items,
                          onClick: handleMenuClick,
                        }}
                        trigger={["click"]}
                        placement="bottomRight"
                        arrow={{ pointAtCenter: true }}
                      >
                        <MoreVert color="info" />
                      </Dropdown>
                    </IconButton>
                  </Tooltip>
                </div>
              </>
            ) : (
              <div className="skeletonLoading">
                <Skeleton.Avatar active size={40} />
                <Skeleton.Input active />
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <div className="sidebar__search">
              {authenticatedUser.userFetched ? (
                <>
                  <div className="sidebar__searchContainer">
                    <Input
                      allowClear
                      placeholder="Search or start new chat"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      prefix={<SearchOutlined />}
                    />
                  </div>
                  <Tooltip placement="right" title="Create Group">
                    <IconButton
                      ref={ref4}
                      onClick={() => setIsGroupModalOpen(true)}
                    >
                      <Groups2Icon color="info" />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <div className="skeletonLoading">
                  <Skeleton active paragraph={false}></Skeleton>
                </div>
              )}
            </div>
          )}
          <ChatsList {...{ search, isSidebarOpen, openCloseSidebar }} />
          <div className="sidebar__footer">
            <Button
              icon={
                isSidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />
              }
              onClick={() => openCloseSidebar(!isSidebarOpen)}
            />
          </div>
        </>
      )}
      {isContactModalOpen && (
        <ContactsModal {...{ isContactModalOpen, setIsContactModalOpen }} />
      )}
      {isGroupModalOpen && (
        <GroupModal {...{ isGroupModalOpen, setIsGroupModalOpen }} />
      )}
      {isProfileOpen && (
        <AuthUserProfileModal {...{ isProfileOpen, setIsProfileOpen }} />
      )}
    </div>
  );
};

export default Sidebar;
