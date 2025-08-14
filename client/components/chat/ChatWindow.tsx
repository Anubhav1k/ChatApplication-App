import { useState, useRef, useEffect } from "react";
import { User, Message, Chat } from "@shared/types";
import { useSocket } from "@/context/SocketContext";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Video,
  MoreVertical,
  MessageCircle,
  Lock,
  UsersRound,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BaseUrl } from "@/constant";
import { formatLastSeen } from "@/Functions";
import axios, { all } from "axios"; // Added axios import
import { AvatarFallback } from "@radix-ui/react-avatar";
import { MessageBubble } from "./MessageBubble";
import { useUpload } from "@/context/UploadContext";

const CHUNK_SIZE = 50 * 1024 * 1024;
const CONCURRENCY_LIMIT = 5;

interface ChatWindowProps {
  onlineUsers: Set<string>;
  typingUsers: Record<string, { istyping: boolean }>;
  chat: Chat;
  selectedUser: User;
  fetchUsers?: () => void;
  messages: Message[];
  currentUser: User;
  onThreadClick?: (message: Message) => void;
  onMembersClick?: (groupId: string) => void;
  users: User[];
  onSettingsClick?: (groupId: string) => void;
  onReactionClick?: (messageId: string, reaction: string) => void;
  showMembers?: boolean;
  threadMessage?: Message; // Added threadMessage prop for thread context
  editingMessage?: { id: string; content: string } | null;
  onUpdateMessage?: (chatId: string, messageId: string, content: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
}

export function ChatWindow({
  onlineUsers,
  typingUsers,
  chat,
  selectedUser,
  messages,
  users,
  currentUser,
  onThreadClick,
  fetchUsers,
  onMembersClick,
  onSettingsClick,
  onReactionClick,
  showMembers,
  onEditMessage,
  editingMessage,
  onUpdateMessage,

  threadMessage, // Added threadMessage prop
}: ChatWindowProps) {
  const { sendMessage, setTyping } = useSocket();
  const { handleSendMessage: AddInBackGround } = useUpload();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showUserCard, setShowUserCard] = useState(false);
  const [UploadProgress, setUploadProgress] = useState(0);
  const [droppedFile, setDroppedFile] = useState<File[] | null>(null);

  const [showFilePreview, setShowFilePreview] = useState(false);

  const [UploadProgressStep, setUploadProgressStep] =
    useState("Uploading File");
  const getInitials = (username: string) => {
    return username
    // .split(" ")
    // .map((n) => n[0])
    // .join("")
    // .toUpperCase()
    // .slice(0, 2);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files;
    if (file) {
      setDroppedFile(Array.from(file));
    }
  };
  const userCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userCardRef.current &&
        !userCardRef.current.contains(event.target as Node)
      ) {
        setShowUserCard(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSendMessage = async (
    content: string,
    type: string = "0",
    fileData?: {
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      file?: File;
    },
  ) => {
    try {
      // Check if selectedUser.type === 1 for thread message

      // Original logic for regular messages
      // const file = fileData?.file;
      // let uploadedFileName = "";
      // let fileId = "";
      // setUploadProgressStep("Uploading File");

      // if (file) {
      //   const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      //   fileId = `${file.name}-${Date.now()}`; // unique identifier

      //   let uploadedBytes = 0;
      //   setUploadProgress(0);

      //   const uploadChunk = (index: number): Promise<void> => {
      //     const start = index * CHUNK_SIZE;
      //     const end = Math.min(file.size, start + CHUNK_SIZE);
      //     const chunk = file.slice(start, end);

      //     const chunkForm = new FormData();
      //     chunkForm.append("fileName", file.name);
      //     chunkForm.append("fileId", fileId);
      //     chunkForm.append("chunkIndex", index.toString());
      //     chunkForm.append("totalChunks", totalChunks.toString());
      //     chunkForm.append("chunk", chunk);

      //     return fetch(`${BaseUrl}/api/upload/chunk`, {
      //       method: "POST",
      //       headers: {
      //         Authorization: `Bearer ${localStorage.getItem("token")}`,
      //         "ngrok-skip-browser-warning": "69420",
      //       },
      //       body: chunkForm,
      //     }).then((res) => {
      //       if (!res.ok) {
      //         throw new Error(`Chunk ${index} upload failed`);
      //       }

      //       uploadedBytes += chunk.size;
      //       const chunkUploadPercent = (uploadedBytes / file.size) * 80;
      //       setUploadProgress(Math.round(chunkUploadPercent));
      //     });
      //   };

      //   for (let i = 0; i < totalChunks; i += CONCURRENCY_LIMIT) {
      //     const batch = [];
      //     for (let j = i; j < i + CONCURRENCY_LIMIT && j < totalChunks; j++) {
      //       batch.push(uploadChunk(j));
      //     }
      //     await Promise.all(batch); // wait for this batch to finish
      //   }

      //   // Merging Phase
      //   setUploadProgressStep("Merging File");
      //   setUploadProgress(85);
      //   const mergeRes = await fetch(`${BaseUrl}/api/upload/merge`, {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${localStorage.getItem("token")}`,
      //       "ngrok-skip-browser-warning": "69420",
      //     },
      //     body: JSON.stringify({ fileId, fileName: file.name }),
      //   });

      //   if (!mergeRes.ok) throw new Error("File merge failed");

      //   const { finalFileName } = await mergeRes.json();
      //   uploadedFileName = finalFileName;
      //   setUploadProgress(90);
      // }

      // // Scanning Phase
      // setUploadProgressStep("Scanning File");
      // setUploadProgress(95);
      // await new Promise((res) => setTimeout(res, 500)); // simulate scanning

      // // Send message after full upload
      // const formData = new FormData();
      // formData.append("content", content);
      // formData.append("type", type);
      // if (replyTo) {
      //   formData.append("isReply", "true");
      //   formData.append("messageId", replyTo._id);
      // }
      // if (uploadedFileName) {
      //   formData.append("fileName", uploadedFileName);
      //   formData.append("fileId", fileId);
      // }

      // const response = await fetch(
      //   `${BaseUrl}/api/chat/${chat._id}/message/chunks`,
      //   {
      //     method: "POST",
      //     headers: {
      //       Authorization: `Bearer ${localStorage.getItem("token")}`,
      //       "ngrok-skip-browser-warning": "69420",
      //     },
      //     body: formData,
      //   },
      // );

      // if (!response.ok) throw new Error("Message send failed");

      // const savedMessage = await response.json();
      // setUploadProgressStep("File Uploaded");
      // setUploadProgress(100);

      // sendMessage({
      //   chatId: chat._id,
      //   receiverId: selectedUser._id,
      //   content,
      //   type,
      //   fileName: uploadedFileName,
      //   isReply: !!replyTo,
      //   messageId: replyTo?._id,
      // });

      // setUploadProgress(0);
      // setReplyTo(null);

      await AddInBackGround(
        chat._id,
        selectedUser._id,
        content,
        type,
        fileData,
        replyTo?._id ? { _id: replyTo._id } : undefined
      );
    } catch (error) {
      console.error("handleSendMessage error:", error);
    }
  };

  const handleTyping = (typing: boolean) => {
    setIsTyping(typing);
    setTyping(chat._id, typing);

    if (typing) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setTyping(chat._id, false);
      }, 2000);
    }
  };

  const handleReplyClick = (message: Message) => {
    setReplyTo(message);
  };

  const handleMembersClick = () => {
    if (selectedUser.isgroup && onMembersClick) {
      onMembersClick(selectedUser._id);
    }
  };

  const handleSettingMembersClick = () => {
    if (selectedUser.isgroup && onSettingsClick) {
      onSettingsClick(selectedUser._id);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`flex-1 flex flex-col bg-white ${showMembers ? "mr-96" : ""}`}
    >
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar
                className="h-10 w-10 cursor-pointer"
                onClick={() =>
                  selectedUser.isgroup
                    ? handleSettingMembersClick()
                    : setShowUserCard(true)
                }
              >
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.chatname}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full">
                    {selectedUser.chatname?.charAt(0).toUpperCase()}
                  </div>
                )}
              </Avatar>
              {onlineUsers?.has(selectedUser.id) && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
              {showUserCard && selectedUser.isgroup === false && (
                <div
                  ref={userCardRef}
                  className="absolute top-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10"
                  style={{ width: "455px" }}
                >
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center overflow-hidden">
                        {selectedUser.avatar ? (
                          <img
                            src={selectedUser.avatar}
                            alt={selectedUser.chatname}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full">
                            {getInitials(selectedUser.chatname)}
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedUser.chatname}
                        </h3>
                        {/* <p className="text-sm text-gray-500">Student</p> */}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 text-sm"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>Share</DropdownMenuItem>
                          <DropdownMenuItem>Block</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                          <DropdownMenuItem>Report</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 bg-gray-100 p-2 rounded">
                      <MessageCircle className="w-4 h-4" /> Message
                    </button>
                    <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 bg-gray-100 p-2 rounded">
                      <Phone className="w-4 h-4" /> Voice Call
                    </button>
                    <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 bg-gray-100 p-2 rounded">
                      <Video className="w-4 h-4" /> Video Call
                    </button>
                    <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 bg-gray-100 p-2 rounded">
                      <Lock className="w-4 h-4" /> Secure
                    </button>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm text-gray-500">Alias and Notes</p>
                    <p className="text-sm text-gray-500">
                      {onlineUsers?.has(selectedUser.id)
                        ? "Online"
                        : formatLastSeen(selectedUser.lastSeen)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <div className="flex gap-2 items-center">
                <h3 className="font-semibold text-gray-900">
                  {selectedUser.chatname}
                </h3>
                {selectedUser.isgroup && (
                  <div
                    className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                    onClick={handleMembersClick}
                  >
                    <Users className="w-4 h-4 text-gray-600" />
                    {/* <span className="text-xs text-gray-700">
                         {selectedUser.members?.length || 0} members
                       </span> */}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {onlineUsers?.has(selectedUser.id) ? (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800 text-xs px-2 py-0"
                  >
                    {typingUsers?.[selectedUser._id]?.istyping ? (
                      <span className="text-blue-500">Typing...</span>
                    ) : (
                      "Online"
                    )}
                  </Badge>
                ) : (
                  formatLastSeen(selectedUser.lastSeen)
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {selectedUser.type === 1 ? (
        <div className="">
          <div className="flex items-center space-x-2 p-2 bg-blue-50 border-blue-200">
            {(() => {
              if (chat.messageId?._id) {
                return (
                  <MessageBubble
                    key={chat.messageId?._id}
                    message={chat?.messageId}
                    selectedUser={selectedUser}
                    isOwnMessage={false}
                    showAvatar={true}
                    user={users.find(u => u.id === chat.messageId?.createdBy?.id) || currentUser}
                    onThreadClick={onThreadClick}
                    onReplyClick={() => { }}
                    onReactionClick={onReactionClick}
                    editingMessage={editingMessage}
                    onUpdateMessage={onUpdateMessage}
                    onEditMessage={onEditMessage}
                    users={users}
                  />
                );
              }
            })()}
          </div>
        </div>
      ) : (
        ""
      )}

      {/* Messages */}
      <MessageList
        typingUsers={typingUsers}
        messages={messages}
        currentUser={currentUser}
        selectedUser={selectedUser}
        chatId={chat._id}
        onThreadClick={onThreadClick}
        onReplyClick={handleReplyClick}
        fetchUsers={fetchUsers}
        onReactionClick={onReactionClick}
        users={users} // Pass allUsers prop
        editingMessage={editingMessage}
        onUpdateMessage={onUpdateMessage}
        onEditMessage={onEditMessage}
      />

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        UploadProgress={UploadProgress}
        UploadProgressStep={UploadProgressStep}
        selectedUser={selectedUser}
        disabled={false}
        replyTo={
          replyTo
            ? {
              content: replyTo.content,
              userId: replyTo.senderId.id,
              _id: replyTo._id,
            }
            : undefined
        }
        droppedFile={droppedFile}
        clearReply={() => setReplyTo(null)}
        clearDroppedFile={() => setDroppedFile(null)}
        editingMessage={editingMessage}
        onUpdateMessage={onUpdateMessage}
        onEditMessage={onEditMessage}
      users={users} 
      />
    </div>
  );
}
