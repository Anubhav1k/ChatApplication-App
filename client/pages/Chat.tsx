import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { User, Message, Chat as ChatType } from "@shared/types";
import { ContactList } from "@/components/chat/ContactList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ThreadPanel } from "@/components/chat/ThreadPanel";
import { MembersPanel } from "@/components/chat/MembersPanel";
import { Button } from "@/components/ui/button";
import {
  Bell,
  ListPlus,
  ListVideo,
  LogOut,
  MessageCircle,
  X,
} from "lucide-react";
import { BaseUrl } from "@/constant";
import { AddMenuDropdown } from "@/components/chat/AddMenuDropdown";
import { GroupModal } from "@/components/chat/GroupModal";
import { ExternalContactModal } from "@/components/chat/ExternalContactModal";
import { OrganizationModal } from "@/components/chat/OrganizationModal";
import { SettingsPanel } from "@/components/chat/SettingsPanel";
import axios from "@/context/NetworkServices";
import { Mail, Flag, Users, FileText, Lock } from "lucide-react";
import { log } from "console";
import { ToastNotification } from "@/components/chat/ToastNotification";
import audio from "../../client/audio/notification-sound.mp3";
// Add GroupDetails interface
interface GroupMember {
  _id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  isOnline: boolean;
  lastSeen: string;
}

interface GroupDetails {
  _id: string;
  participants: GroupMember[];
  type: number;
  groupName: string;
  groupImage?: string;
  groupDescription: string;
  groupAdmin: GroupMember[];
  createdBy: GroupMember;
  settings: {
    groupinfo: number;
    editmembers: number;
    mention: number;
    pin: number;
    cliptop: number;
    approroval: boolean;
  };
  permissions: {
    groupinfo: boolean;
    editmembers: boolean;
    mention: boolean;
    pin: boolean;
    cliptop: boolean;
    approroval: boolean;
  };
}

export default function Chat() {
  const { user, logout } = useAuth();
  const {
    socket,
    typingUsers,
    onlineUsers,
    SeenMessage,
    updateChat,
    UnseenNotification,
    RejectRequest,
    ApprvedRequest,
  } = useSocket();

  // Chat states
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentChat, setCurrentChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Add a loading state for better UX
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<string>("all"); // Track current filter

  // Thread states
  const [threadMessage, setThreadMessage] = useState<Message | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [threadReplies, setThreadReplies] = useState<Message[]>([]);

  // Members panel states
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [groupDetailsLoading, setGroupDetailsLoading] = useState(false);
  const [groupDetailsError, setGroupDetailsError] = useState<string | null>(
    null,
  );

  // Settings panel states
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // UI states
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isExternalContactModalOpen, setIsExternalContactModalOpen] =
    useState(false);
  const [isOrganizationModalOpen, setIsOrganizationModalOpen] = useState(false);
  const [showAddGroupBox, setShowAddGroupBox] = useState(false);

  // refresh key for MessageBubble components
  const [refreshKey, setRefreshKey] = useState(0);
  const [showGroupSettingsPanel, setShowGroupSettingsPanel] = useState(false);
  const [showVideoMenu, setShowVideoMenu] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [toastNotifications, setToastNotifications] = useState<
    Array<{
      id: string;
      message: string;
      senderName: string;
    }>
  >([]);

  // Add state for editing message
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);

  // Handler for initiating message edit
 const handleEditMessage = (messageId: string, content: string) => {
  setEditingMessage({ id: messageId, content });
};

  const handleEditUpdateMessage = async (chatId: string, messageId: string, content: string) => {
  try {
    const response = await axios.put(
      `${BaseUrl}/api/chat/${chatId}/message/${messageId}`,
      { content },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );


    setEditingMessage(null);
  } catch (error: any) {
    console.error(
      "Failed to update message:",
      error?.response?.data?.message || error.message
    );
  }
};

  // Generic function to fetch users with different endpoints
  const fetchUsers = async (
    endpoint: string = "chats",
    filterType: string = "all",
  ) => {
    try {
      setLoadingUsers(true);
      const response = await axios.get(`${BaseUrl}/api/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });

      const fetchedUsers = response.data?.data || [];
      setUsers(fetchedUsers);
      setCurrentFilter(filterType);

      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error(
        `Failed to fetch ${filterType} users:`,
        error?.response?.data?.message || error.message,
      );
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [updateChat]);

  useEffect(() => {

    if (ApprvedRequest.includes(selectedUser?._id)) {
      setSelectedUser((prev) => {
        if (prev) {
          return { ...prev, isAllowed: true, isRequested: false };
        }
        return prev;
      });
    }
    if (RejectRequest.includes(selectedUser?._id)) {
      setSelectedUser((prev) => {
        if (prev) {
          return { ...prev, isAllowed: false, isRequested: false };
        }
        return prev;
      });
    }



  }, [ApprvedRequest, RejectRequest]);


  const fetchGroupDetails = async (groupId: string) => {
    try {
      setGroupDetailsLoading(true);
      setGroupDetailsError(null);

      const response = await axios.get(`${BaseUrl}/api/group/${groupId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });

      setGroupDetails(response.data?.data);
    } catch (error: any) {
      console.error(
        "Failed to fetch group details:",
        error?.response?.data?.message || error.message,
      );
      setGroupDetailsError("Failed to load group members");
    } finally {
      setGroupDetailsLoading(false);
    }
  };

  const handleReactionClick = async (messageId: string, reaction: string) => {
    try {
      const response = await axios.post(
        `${BaseUrl}/api/message/reaction`,
        {
          messageId,
          reaction,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = response.data;
    } catch (error: any) {
      console.error(
        "Failed to add reaction:",
        error?.response?.data?.message || error.message,
      );
    }
  };

  const fetchThreadReplies = async (messageId: string) => {
    try {
      const response = await axios.get(
        `${BaseUrl}/api/message/thread/${messageId}?page=1&size=10`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        },
      );

      const replies = response.data?.data?.replys ?? [];
      setThreadReplies(replies.reverse());
    } catch (error: any) {
      console.error(
        "Failed to fetch thread replies:",
        error?.response?.data?.message || error.message,
      );
      setThreadReplies([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers(); // Default fetch all chats
    }
  }, [user]);

  // Fetch all users for search functionality
  useEffect(() => {
    if (!user) return;

    const fetchAllUsers = async () => {
      try {
        const { data } = await axios.get(`${BaseUrl}/api/users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        });

        setAllUsers(data ?? []);
      } catch (error: any) {
        console.error(
          "Failed to fetch all users:",
          error?.response?.data?.message || error.message,
        );
      }
    };

    fetchAllUsers();
  }, [user]);

  const updateCount = (
    userId: string,
    count: number,
    isreset?: boolean,
    istop?: boolean,
  ) => {
    setUsers((prevUsers) => {
      const updatedUsers = prevUsers.map((u) =>
        u._id === userId
          ? { ...u, count: isreset ? count : (u.count ?? 0) + count }
          : u,
      );

      if (istop) {
        const updatedUser = updatedUsers.find((u) => u._id === userId);
        const restUsers = updatedUsers.filter((u) => u._id !== userId);
        return updatedUser ? [updatedUser, ...restUsers] : prevUsers;
      }

      return updatedUsers;
    });
  };

  // useEffect(() => {
  //   if (!socket) return;

  //   socket.on("new-message", (message: Message) => {
  //     updateCount(message.chatId, 1);
  //     setMessages((prev) => [...prev, message]);
  //   });

  //   socket.on("updatemessage", (updatedMessage: Message) => {
  //     setMessages((prevMessages) =>
  //       prevMessages.map((msg) =>
  //         msg._id === updatedMessage._id ? updatedMessage : msg
  //       )
  //     );
  //   });

  //   return () => {
  //     socket.off("new-message");
  //     socket.off("updatemessage");
  //   };
  // }, [socket, threadMessage]);

  useEffect(() => {
    if (!socket || !currentChat) return;

    const handleNewMessage = (message: Message) => {
      if (message.chatId === currentChat._id) {
        updateCount(message.chatId, 1, false, true);
        setMessages((prev) => [...prev, message]);
      } else {
        updateCount(message.chatId, 1, false, true);
        // Show toast notification for messages from other chats
        const senderName = message.senderId?.firstname
          ? `${message.senderId.firstname} ${message.senderId.lastname || ""}`.trim()
          : message.senderId?.username || "Unknown User";

        const toastId = `toast-${Date.now()}-${Math.random()}`;
        setToastNotifications((prev) => [
          ...prev,
          {
            id: toastId,
            message: message.content || "New message",
            senderName,
          },
        ]);

        // Play notification sound
        if (audioRef.current) {
          audioRef.current.play().catch((err) => {
            console.warn("Audio playback failed:", err);
          });
        }
      }
    };

    const handleUpdateMessage = (updatedMessage: Message) => {
      if (updatedMessage.chatId === currentChat._id) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === updatedMessage._id ? updatedMessage : msg,
          ),
        );
      }
    };
    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [...prev, notification]);

      //  Play notification sound
      if (audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.warn("Audio playback failed:", err);
        });
      }
    };

    socket.on("new-message", handleNewMessage);
    socket.on("updatemessage", handleUpdateMessage);
    // socket.on("newNotification", handleNewNotification);
    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("updatemessage", handleUpdateMessage);
      socket.off("newNotification", handleNewNotification);
      // socket.off("newNotification",handleNewNotification);
    };
  }, [socket, currentChat]);

  const handleUserSelect = async (selectedUser: User) => {
    try {
      setSelectedUser(selectedUser);
      setShowThread(false);
      setShowMembersPanel(false);
      setShowSettingsPanel(false);
      setThreadMessage(null);
      setThreadReplies([]);
      setGroupDetails(null);

      const chatResponse = await axios.get(
        `${BaseUrl}/api/chat/${selectedUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        },
      );

      const chat = chatResponse.data;
      setCurrentChat(chat);

      let messagesData: any = [];

      // if (selectedUser.type === 1 && selectedUser?._id) {
      if (false) {
        // Hit thread API if type === 1
        const threadRes = await axios.get(
          `${BaseUrl}/api/message/thread/${selectedUser?._id}?page=1&size=10`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "ngrok-skip-browser-warning": "69420",
            },
          },
        );

        // Assuming thread replies are the chat context here
        messagesData = threadRes.data?.data?.replys?.reverse() ?? [];
      } else {
        // Default messages API
        const messagesResponse = await axios.get(
          `${BaseUrl}/api/chat/${chat._id}/messages`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "ngrok-skip-browser-warning": "69420",
            },
          },
        );

        messagesData = messagesResponse.data?.data ?? [];
      }

      setMessages(messagesData);
      SeenMessage(selectedUser._id, selectedUser.id);
      updateCount(selectedUser._id, 0, true);

      if (socket) {
        socket.emit("join-chat", chat._id);
      }
    } catch (error: any) {
      console.error(
        "Failed to select user:",
        error?.response?.data?.message || error.message,
      );
    }
  };

  //   const handleNotificationClick = async (notification: any) => {
  //
  //  try {
  //    const matchedUser = allUsers.find(user => user._id === notification.sender._id);

  //    if (matchedUser) {
  //      await handleUserSelect(matchedUser);
  //      setShowNotifications(false);

  //      setNotifications(prev =>
  //        prev.map(notif =>
  //          notif._id === notification._id
  //            ? { ...notif, seen: true }
  //            : notif
  //        )
  //      );
  //    }
  //  } catch (error) {
  //    console.error("Failed to open chat from notification:", error);
  //  }
  // };

  const handleThreadClick = async (message: Message) => {
    await fetchThreadReplies(message._id);
    setThreadMessage(message);
    setShowThread(true);
    setShowMembersPanel(false);
    setShowSettingsPanel(false);
  };

  const handleCloseThread = () => {
    setShowThread(false);
    setThreadMessage(null);
    setThreadReplies([]);
  };

  const handleMembersClick = async () => {
    setShowMembersPanel(true);
    setShowThread(false);
    setShowSettingsPanel(false);
    setThreadMessage(null);
    setThreadReplies([]);

    if (selectedUser && selectedUser.isgroup) {
      await fetchGroupDetails(selectedUser._id);
    }
  };

  const handleCloseMembersPanel = () => {
    setShowMembersPanel(false);
    setGroupDetails(null);
  };

  const handleSettingsClick = async () => {
    setShowSettingsPanel(true);
    setShowThread(false);
    setShowMembersPanel(false);
    setThreadMessage(null);
    setThreadReplies([]);

    if (selectedUser && selectedUser.isgroup) {
      await fetchGroupDetails(selectedUser._id);
    }
  };

  const handleCloseSettingsPanel = () => {
    setShowSettingsPanel(false);
  };

  const handleSendThreadReply = async (content: string) => {
    if (!threadMessage || !currentChat) return;

    try {
      const response = await axios.post(
        `${BaseUrl}/api/message/thread`,
        {
          messageId: threadMessage._id,
          content,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      const newReply = response.data;
      setThreadReplies((prev) => [...prev, newReply.data]);

      if (socket) {
        socket.emit("thread-reply", {
          originalMessage: threadMessage._id,
          reply: newReply.data,
          chatId: currentChat._id,
        });
      }

      // setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      console.error(
        "Failed to send thread reply:",
        error?.response?.data?.message || error.message,
      );
    }
  };

  const refreshContacts = async () => {
    await fetchUsers(); // This will fetch all chats by default
  };

  if (!user) return null;

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await axios.get(`${BaseUrl}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });

      const fetchedNotifications = response.data?.data || [];
      setNotifications(fetchedNotifications);
    } catch (error: any) {
      console.error(
        "Failed to fetch notifications:",
        error?.response?.data?.message || error.message,
      );
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch notifications on mount and when bell is clicked
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    if (!showNotifications) {
      fetchNotifications(); // Refresh notifications when opening
      // Optionally mark notifications as seen
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, seen: true })),
      );

      axios.get(`${BaseUrl}/api/notifications/seen`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    }
  };

  // Calculate unread notifications count
  const unreadCount = UnseenNotification;

  // Handle outside click to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bellRef.current &&
        notificationDropdownRef.current &&
        !bellRef.current.contains(event.target as Node) &&
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Calculate right margin based on which panel is open
  const getRightMargin = () => {
    if (
      showThread ||
      showMembersPanel ||
      showSettingsPanel ||
      showGroupSettingsPanel ||
      showNotifications
    )
      return "mr-96";
    return "";
  };

  const removeToastNotification = (id: string) => {
    setToastNotifications((prev) => prev.filter((toast) => toast.id !== id));
  };

  const isGroupChat = (chatData: any) => {
    // Check if it's a group based on multiple criteria
    return (
      chatData.type === 4 || // Group chat type
      (chatData.groupName && chatData.groupName.trim() !== "") || // Has group name
      (chatData.participants && chatData.participants.length > 2) || // More than 2 participants
      (chatData.receiverId &&
        Array.isArray(chatData.receiverId) &&
        chatData.receiverId.length > 2)
    ); // More than 2 receivers
  };
  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col relative">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-end space-x-3">
            <AddMenuDropdown
              isOpen={showAddGroupBox}
              onToggle={() => setShowAddGroupBox(!showAddGroupBox)}
              onNewGroup={() => setIsGroupModalOpen(true)}
              onAddExternalContact={() => setIsExternalContactModalOpen(true)}
              onOrganizationmember={() => {
                setIsOrganizationModalOpen(true);
              }}
            />

            <button
              ref={bellRef}
              onClick={toggleNotifications}
              className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 relative">
              <div
                className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center cursor-pointer"
                onClick={() => setShowVideoMenu(!showVideoMenu)}
              >
                <ListVideo className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{user.username}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
                {/* Show current filter */}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-500 hover:text-gray-700"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {toastNotifications.map((toast) => (
          <ToastNotification
            key={toast.id}
            message={toast.message}
            senderName={toast.senderName}
            onClose={() => removeToastNotification(toast.id)}
          />
        ))}

        {/* Notification Dropdown */}
        {showNotifications && (
          <div
            ref={notificationDropdownRef}
            className="fixed right-0 top-0 h-full z-50 w-1/5"
          >
            <div className="p-4">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Notifications
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotifications(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {loadingNotifications ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-4 text-center text-gray-500">
                  No new notifications
                </div>
              ) : (
                <ul className="mt-2 space-y-2 max-h-[calc(100vh-100px)] overflow-y-auto">
                  {notifications.map((notification: any) => (
                    <li
                      key={notification._id}
                      className={`p-3 rounded-md ${notification.seen ? "bg-gray-50" : "bg-blue-50"
                        } hover:bg-gray-100 transition-colors cursor-pointer`}
                    // onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {notification.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdOn).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Show loading state */}
        {loadingUsers && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading...</p>
          </div>
        )}

        <ContactList
          key={refreshKey} // Force re-render when data changes
          onlineUsers={onlineUsers}
          typingUsers={typingUsers}
          users={users}
          selectedUser={selectedUser}
          onUserSelect={handleUserSelect}
        />
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${getRightMargin()}`}>
        {selectedUser && currentChat ? (
          <ChatWindow
            key={refreshKey}
            onlineUsers={onlineUsers}
            typingUsers={typingUsers}
            chat={currentChat}
            selectedUser={selectedUser}
            messages={messages}
            currentUser={user}
            onThreadClick={handleThreadClick}
            onMembersClick={handleMembersClick}
            onSettingsClick={handleSettingsClick}
            fetchUsers={refreshContacts}
            onReactionClick={handleReactionClick}
            users={users}
            onEditMessage={handleEditMessage}
            editingMessage={editingMessage}
            onUpdateMessage={handleEditUpdateMessage}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to Chat
              </h3>
              <p className="text-gray-500 max-w-sm">
                Select a contact from the sidebar to start a conversation
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Thread Panel */}
      {showThread && threadMessage && selectedUser && (
        <div className="fixed right-0 top-0 h-full z-50">
          <ThreadPanel
            originalMessage={threadMessage}
            currentUser={user}
            selectedUser={selectedUser}
            threadReplies={threadReplies}
            onClose={handleCloseThread}
            onSendReply={handleSendThreadReply}
          />
        </div>
      )}

      {/* Members Panel */}
      {showMembersPanel && selectedUser && selectedUser.isgroup && (
        <div className="fixed right-0 top-0 h-full z-50">
          <MembersPanel
            groupId={selectedUser._id}
            currentUser={user}
            onlineUsers={onlineUsers}
            onClose={handleCloseMembersPanel}
            groupDetails={groupDetails}
            loading={groupDetailsLoading}
            error={groupDetailsError}
            onRefresh={() => fetchGroupDetails(selectedUser._id)}
          />
        </div>
      )}

      {/* Settings Panel */}
      {showSettingsPanel && selectedUser && selectedUser.isgroup && (
        <div className="fixed right-0 top-0 h-full z-50">
          <SettingsPanel
            groupId={selectedUser._id}
            currentUser={user}
            selectedUser={selectedUser}
            onlineUsers={onlineUsers}
            onClose={handleCloseSettingsPanel}
            groupDetails={groupDetails}
            onRefreshGroup={() => fetchGroupDetails(selectedUser._id)}
            allUsers={allUsers}
          />
        </div>
      )}

      {/* Modals */}
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        allUsers={allUsers}
      />

      <ExternalContactModal
        isOpen={isExternalContactModalOpen}
        onClose={() => setIsExternalContactModalOpen(false)}
        allUsers={allUsers}
        existingContacts={users}
        onContactAdded={refreshContacts}
      />

      <OrganizationModal
        isOpen={isOrganizationModalOpen}
        onClose={() => setIsOrganizationModalOpen(false)}
        allUsers={allUsers}
        existingContacts={users}
        onContactAdded={refreshContacts}
      />

      {/* Video Menu Dropdown */}
      {showVideoMenu && (
        <div className="absolute top-20 left-6 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 z-50">
          <button
            onClick={() => {
              fetchUsers("chats", "all");
              setShowVideoMenu(false);
            }}
            className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 ${currentFilter === "all" ? "bg-blue-50 text-blue-700" : ""}`}
          >
            <MessageCircle className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">All Chats</span>
          </button>

          <button
            onClick={() => {
              fetchUsers("chats/unread", "unread");
              setShowVideoMenu(false);
            }}
            className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 ${currentFilter === "unread" ? "bg-blue-50 text-blue-700" : ""}`}
          >
            <Mail className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Unread</span>
          </button>

          <button
            onClick={() => {
              fetchUsers("chats/Single", "external");
              setShowVideoMenu(false);
            }}
            className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 ${currentFilter === "external" ? "bg-blue-50 text-blue-700" : ""}`}
          >
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">External Chats</span>
          </button>

          <button
            onClick={() => {
              fetchUsers("chats/Thread", "thread");
              setShowVideoMenu(false);
            }}
            className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 ${currentFilter === "thread" ? "bg-blue-50 text-blue-700" : ""}`}
          >
            <Flag className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Thread</span>
          </button>

          <button
            onClick={() => {
              fetchUsers("chats/Groups", "groups");
              setShowVideoMenu(false);
            }}
            className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 ${currentFilter === "groups" ? "bg-blue-50 text-blue-700" : ""}`}
          >
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Groups</span>
          </button>
        </div>
      )}

      <audio ref={audioRef} src={audio} preload="auto" />
    </div>
  );
}
