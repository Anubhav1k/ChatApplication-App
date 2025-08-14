import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { BaseUrl, SocketUrl } from "@/constant";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Set<string>;
  typingUsers: Record<
    string,
    { istyping: boolean; chatId: string; userId: string }
  >;
  sendMessage: (data: any) => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  setTyping: (chatId: string, isTyping: boolean) => void;
  markAsRead: (messageIds: string[]) => void;
  SeenMessage: (chatId: string, userId: string) => void;
  updateChat: number;
  UnseenMessage: number;
  UnseenNotification: number;
  ApprvedRequest: string[];
  RejectRequest: string[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<
    Record<string, { istyping: boolean; chatId: string; userId: string }>
  >({});
  const [updateChat, setupdateChat] = useState<number>(0);
  const [UnseenMessage, setSeenMessage] = useState<number>(0);
  const [UnseenNotification, setUnseenNotification] = useState<number>(0);
  const [ApprvedRequest, setApprovedRequest] = useState<string[]>([]);
  const [RejectRequest, setRejectRequest] = useState<string[]>([]);

  useEffect(() => {
    if (token && user) {
      const newSocket = io(SocketUrl, {
        path: "/api/socket.io",
        auth: { token },
      });

      newSocket.on("connect", () => {
        console.log("Connected to server");
      });

      newSocket.on("getOnlineUsers", (userId: string[]) => {
        setOnlineUsers((prev) => new Set(userId));
      });

      newSocket.on("user-offline", (userId: string) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(userId);
          return updated;
        });
      });

      newSocket.on(
        "typing",
        (data: { userId: string; chatId: string; isTyping: boolean }) => {
          setTypingUsers((prev) => ({
            ...prev,
            [data.chatId]: {
              ...data,
              istyping: data.isTyping,
            },
          }));
          // Clear typing after 3 seconds if still typing
          if (data.isTyping) {
            setTimeout(() => {
              setTypingUsers((prev) => ({
                ...prev,
                [data.chatId]: {
                  ...data,
                  istyping: false,
                },
              }));
            }, 3000);
          }
        },
      );

      newSocket.on("notificationcount", (data) => {
        setUnseenNotification(data.count);
      });

      newSocket.on("unreadcount", (data) => {
        setSeenMessage(data.count);
      });

      newSocket.on("create", () => {
        setupdateChat(updateChat + 1);
      });
      newSocket.on("updatechat", () => {
        setupdateChat(updateChat + 1);
      });

      newSocket.on("acceptRequest", (data) => {
        if (data?.type === "ChatRequestApproved") {
          setApprovedRequest([...ApprvedRequest, data?.chatId]);
        }

        if (data?.type === "ChatRequestRejected") {
          setRejectRequest([...RejectRequest, data?.chatId]);
        }
        setupdateChat(updateChat + 1);
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from server");
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token, user]);

  const sendMessage = (data: any) => {
    if (socket) {
      socket.emit("send-message", data);
    }
  };

  const joinChat = (chatId: string) => {
    if (socket) {
      socket.emit("join-chat", chatId);
    }
  };

  const leaveChat = (chatId: string) => {
    if (socket) {
      socket.emit("leave-chat", chatId);
    }
  };

  const setTyping = (chatId: string, isTyping: boolean) => {
    if (socket) {
      socket.emit("typing", { chatId, isTyping });
    }
  };

  const SeenMessage = (chatId: string, userId: string) => {
    if (socket) {
      socket.emit("seen", { chatId, userId });
    }
  };

  const markAsRead = (messageIds: string[]) => {
    if (socket) {
      socket.emit("mark-read", { messageIds });
    }
  };

  const value = {
    socket,
    onlineUsers,
    typingUsers,
    sendMessage,
    joinChat,
    leaveChat,
    setTyping,
    markAsRead,
    SeenMessage,
    updateChat,
    UnseenMessage,
    UnseenNotification,
    RejectRequest,
    ApprvedRequest,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
