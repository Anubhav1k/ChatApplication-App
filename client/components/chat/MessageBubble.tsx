import { Message, User } from "@shared/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Download,
  File,
  Image as ImageIcon,
  MessageSquare,
  MoreHorizontal,
  Reply,
  Video,
  ThumbsUp,
  X,
  MessageSquareQuote,
  Forward,
  Check,
  Send,
  Trash,
  Pencil,
} from "lucide-react";
import axios from "@/context/NetworkServices";
import { Button } from "@/components/ui/button";
import { BaseUrl } from "@/constant";
import { useState, useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import { toast } from "sonner";
import { saveAs } from "file-saver";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
  user: User;
  users: User[];
  selectedUser: User;
  onThreadClick?: (message: Message) => void;
  onReplyClick?: (message: Message) => void;
  onReactionClick?: (messageId: string, reaction: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  editingMessage?: { id: string; content: string } | null;
  onUpdateMessage?: (
    chatId: string,
    messageId: string,
    content: string,
  ) => void;
}

export function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
  user,
  users,
  selectedUser,
  onThreadClick,
  onReplyClick,
  onReactionClick,
  onEditMessage,
  editingMessage,
  onUpdateMessage,
}: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showForwardPopup, setShowForwardPopup] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isForwarding, setIsForwarding] = useState(false);

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);
  // Handle right-click to show context menu
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };
  const messageTime = new Date(message.timestamp);
  const now = new Date();
  const timeDifferenceInMs = now.getTime() - messageTime.getTime();
  const canEdit = timeDifferenceInMs <= 30 * 60 * 1000; // 30 minutes
  const canDownload = message.files.length > 0;
  // Handle closing context menu
  const handleCloseContextMenu = () => {
    setShowContextMenu(false);
  };

  const [selectedMedia, setSelectedMedia] = useState<{
    type: "image" | "video";
    url: string;
    filename: string;
  } | null>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Calculate emoji picker position
  const getEmojiPickerPosition = () => {
    if (!buttonRef.current) return { top: 0, left: 0, openUpward: false };

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const pickerHeight = 400;
    const pickerWidth = 300;

    // Check if there's enough space below
    const spaceBelow = windowHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    const openUpward = spaceBelow < pickerHeight && spaceAbove > pickerHeight;

    // Calculate horizontal position
    let left = buttonRect.left;
    if (left + pickerWidth > windowWidth) {
      left = windowWidth - pickerWidth - 20;
    }

    // Calculate vertical position
    let top = openUpward
      ? buttonRect.top - pickerHeight - 8
      : buttonRect.bottom - 10;

    return { top, left, openUpward };
  };

  const handleForwardMessage = async () => {
    try {
      const response = await axios.post(
        `${BaseUrl}/api/chat/${message.chatId}/message/${message._id}/forward`,
        {
          ForwordedIds: selectedUsers,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = response.data;

      // Reset UI state
      setShowForwardPopup(false);
      setSelectedUsers([]);
      setSearchTerm("");
    } catch (error: any) {
      console.error(
        "Failed to forward message:",
        error?.response?.data?.message || error.message,
      );
    } finally {
      setIsForwarding(false);
      toast.success("forwarded successfully!");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await axios.delete(
        `${BaseUrl}/api/chat/${message.chatId}/message/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );
      // Optionally: refresh messages or update UI here
    } catch (error: any) {
      console.error(
        "Failed to delete message:",
        error?.response?.data?.message || error.message,
      );
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const filteredUsers = (users || []).filter(
    (u) =>
      u._id !== user._id &&
      u?.username?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isSingleEmoji = (text: string): boolean => {
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})$/u;
    return emojiRegex.test(text.trim());
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const onBulkDownload = async (message: Message) => {
    try {
      const response = await axios.get(
        `${BaseUrl}/api/message/download/${message._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          responseType: "blob", // important for binary data
        },
      );

      // Default filename
      let filename = "download.zip";

      // Try to get filename from backend headers
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+?)"?$/i);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]); // handles spaces & URL encoding
        }
      }

      // Remove underscores before file extension & trailing underscores
      const cleanFilename = filename
        .replace(/_+(?=\.[^.]+$)/, "") // remove underscores right before extension
        .replace(/_+$/, ""); // remove underscores at very end

      saveAs(response.data, cleanFilename);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const isImage = (fileType: string) => {
    return fileType?.startsWith("image/");
  };

  const isVideo = (fileType: string) => {
    return fileType?.startsWith("video/");
  };

  const handleEmojiClick = (emojiData: any) => {
    if (onReactionClick && message._id) {
      onReactionClick(message._id, emojiData.emoji);
    }
    setShowEmojiPicker(false);
    setIsHovered(false);
  };

  const handleMediaDownload = async () => {
    if (!selectedMedia) return;
    const { type, url, filename } = selectedMedia;
    const isImage = type === "image";

    try {
      let downloadUrl = url;
      let fileName = filename || `download.${isImage ? "jpg" : "mp4"}`;

      if (isImage) {
        const res = await fetch(url, {
          mode: "cors",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "ngrok-skip-browser-warning": "69420",
          },
        });
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

        const blob = await res.blob();
        if (!blob.size) throw new Error("Empty file.");
        downloadUrl = URL.createObjectURL(blob);
      }

      const link = Object.assign(document.createElement("a"), {
        href: downloadUrl,
        download: fileName,
        style: "display:none",
      });
      document.body.appendChild(link);
      link.click();
      link.remove();

      if (isImage) URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }

    setSelectedMedia(null);
  };

  const renderFileContent = () => {
    const files = message?.files;
    if (!files || files.length === 0) return null;

    const isImageFile = (filename: string) =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);

    const isVideoFile = (filename: string) =>
      /\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)$/i.test(filename);
    // Multi-image grid layout
    if (files.length > 1) {
      const images = files.filter((file: any) =>
        isImageFile(file.filename || file.url),
      );
      const videos = files.filter((file: any) =>
        isVideoFile(file.filename || file.url),
      );
      const otherFiles = files.filter(
        (file: any) =>
          !isImageFile(file.filename || file.url) &&
          !isVideoFile(file.filename || file.url),
      );

      return (
        <div className="mt-2 space-y-2">
          {/* Images Grid */}
          {images.length > 0 && (
            <div
              className={`grid gap-1 ${
                images.length === 2
                  ? "grid-cols-2"
                  : images.length === 3
                    ? "grid-cols-3"
                    : images.length >= 4
                      ? "grid-cols-2"
                      : "grid-cols-1"
              }`}
            >
              {images.slice(0, 4).map((file: any, index: any) => {
                const fileUrl = BaseUrl + "/" + file.url;
                const thumUrl = BaseUrl + "/" + file.thumbnail;

                return (
                  <div key={index} className="relative">
                    <img
                      src={thumUrl}
                      alt={file.filename}
                      className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity w-full h-32 object-cover"
                      onClick={() =>
                        setSelectedMedia({
                          type: "image",
                          url: fileUrl,
                          filename: file.filename || file.name || "Image",
                        })
                      }
                    />
                    {/* Show +N for more than 4 images */}
                    {index === 3 && images.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        +{images.length - 4}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Videos */}
          {videos.map((file: any, index: any) => {
            const fileUrl = BaseUrl + "/" + file.url;
            return (
              <div key={`video-${index}`}>
                <video
                  controls
                  className="rounded-lg max-w-full"
                  preload="metadata"
                  onClick={() =>
                    setSelectedMedia({
                      type: "video",
                      url: fileUrl,
                      filename: file.filename,
                    })
                  }
                >
                  <source src={fileUrl} type={file.mimetype || "video/mp4"} />
                  Your browser does not support the video tag.
                </video>
              </div>
            );
          })}

          {/* Other Files */}
          {otherFiles.map((file: any, index: any) => {
            const fileUrl = BaseUrl + "/" + file.url;
            return (
              <div
                key={`file-${index}`}
                className="p-3 bg-gray-50 rounded-lg border max-w-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <File className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.filename}
                    </p>
                    {file.size && (
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => window.open(fileUrl, "_blank")}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Single file display (existing logic)
    return (
      <div className="mt-2 space-y-2">
        {files.map((file: any, index: any) => {
          const fileUrl = BaseUrl + "/" + file.url;
          const thumUrl = BaseUrl + "/" + file.thumbnail;

          if (isImageFile(file.thumbnail)) {
            return (
              <div key={index}>
                <img
                  src={thumUrl}
                  alt={file.filename}
                  className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-w-full"
                  onClick={() =>
                    setSelectedMedia({
                      type: "image",
                      url: fileUrl,
                      filename: file.filename,
                    })
                  }
                />
              </div>
            );
          } else if (isVideoFile(file.url)) {
            return (
              <div key={index}>
                <video
                  controls
                  className="rounded-lg max-w-full"
                  preload="metadata"
                  onClick={() =>
                    setSelectedMedia({
                      type: "video",
                      url: fileUrl,
                      filename: file.filename,
                    })
                  }
                >
                  <source src={fileUrl} type={file.mimetype || "video/mp4"} />
                  Your browser does not support the video tag.
                </video>
              </div>
            );
          } else {
            return (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg border max-w-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <File className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.filename}
                    </p>
                    {file.size && (
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => window.open(fileUrl, "_blank")}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  const renderThreadReplies = () => {
    if (message.isReply) return null;

    const replies = message?.threads?.replys || [];

    if (replies.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {replies.map((reply: any) => (
          <div
            key={reply._id}
            className={cn(
              "flex items-center space-x-2 p-2 rounded-lg border-l-2",
              isOwnMessage
                ? "bg-blue-50 border-blue-200"
                : "bg-gray-50 border-gray-200",
            )}
          >
            <Avatar className="h-5 w-5">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-900">
                  {user.username}
                </span>
                <p className="text-xs text-gray-700 break-words">
                  {reply.content}
                </p>
              </div>
            </div>
          </div>
        ))}

        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-gray-600 bg-gray-100"
          onClick={() => onThreadClick?.(message)}
        >
          <Reply className="w-3 h-3 mr-1" />
          Reply
        </Button>
      </div>
    );
  };

  const renderOriginalMessage = () => {
    if (!message.isReply) return null;
    const isImageFile = (filename: string) =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);

    const isVideoFile = (filename: string) =>
      /\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)$/i.test(filename);

    return (
      <div
        className={cn(
          "p-2 mb-2 rounded-lg border-l-4 border-gray-300 bg-gray-100",
          isOwnMessage ? "border-blue-500" : "border-gray-500",
        )}
      >
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="font-medium">
            {message?.replyTo?.senderId?.username}
          </span>
          <span>{formatTime(message.timestamp)}</span>
        </div>
        <p className="text-sm text-gray-900 mt-1 break-words">
          {message.replyTo.content}
        </p>
        {message.files?.length > 0 && (
          <div className="mt-1">
            {message.files.map((file: any, index: any) => {
              const fileUrl = BaseUrl + "/" + file.url;
              if (isImageFile(file.filename)) {
                return (
                  <img
                    key={index}
                    src={fileUrl}
                    alt={file.filename}
                    className="rounded-lg max-w-[100px] cursor-pointer mt-1"
                    onClick={() => window.open(fileUrl, "_blank")}
                  />
                );
              } else if (isVideoFile(file.url)) {
                return (
                  <video
                    key={index}
                    controls
                    className="rounded-lg max-w-[100px] mt-1"
                    preload="metadata"
                  >
                    <source src={fileUrl} type={file.mimetype || "video/mp4"} />
                    Your browser does not support the video tag.
                  </video>
                );
              } else {
                return (
                  <div
                    key={index}
                    className="flex items-center space-x-2 text-xs text-gray-500 mt-1"
                  >
                    <File className="w-4 h-4" />
                    <span>{file.filename}</span>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    );
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const latestUserReactions = new Map();

    message.reactions.forEach((reactionObj: any) => {
      reactionObj.users?.forEach((user: any) => {
        latestUserReactions.set(user._id, {
          reaction: reactionObj.reaction,
          user: user,
        });
      });
    });

    const groupedReactions = new Map();
    latestUserReactions.forEach((reactionData) => {
      const emoji = reactionData.reaction;
      if (!groupedReactions.has(emoji)) {
        groupedReactions.set(emoji, []);
      }
      groupedReactions.get(emoji).push(reactionData.user);
    });

    const reactionsToDisplay = Array.from(groupedReactions.entries()).map(
      ([emoji, users]) => ({
        reaction: emoji,
        users: users,
      }),
    );

    if (reactionsToDisplay.length === 0) return null;

    const hasUserReacted = (emoji: string, currentUserId: string) => {
      const userReaction = latestUserReactions.get(currentUserId);
      return userReaction && userReaction.reaction === emoji;
    };

    return (
      <div
        className={cn(
          "flex flex-wrap gap-1 mt-1 px-2",
          isOwnMessage ? "justify-end" : "justify-start",
          !showAvatar && !isOwnMessage && "ml-10",
        )}
      >
        {reactionsToDisplay.map((reaction: any, index: number) => {
          const currentUserId = user._id;
          const userHasReacted = hasUserReacted(
            reaction.reaction,
            currentUserId,
          );

          return (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 px-2 py-1 border rounded-full text-xs cursor-pointer transition-colors shadow-sm",
                userHasReacted
                  ? "bg-blue-100 border-blue-300 hover:bg-blue-200"
                  : "bg-white border-gray-200 hover:bg-gray-50",
              )}
              onClick={() => onReactionClick?.(message._id, reaction.reaction)}
            >
              <span className="text-sm">{reaction.reaction}</span>
              <span className="text-gray-600 font-medium">
                {reaction.users?.map((user: any, i: number) => (
                  <span key={user._id}>
                    {user.username}
                    {i < reaction.users.length - 1 && ", "}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div
        className={cn(
          "flex items-end space-x-2  relative group w-full",
          isOwnMessage ? "ml-auto flex-row-reverse space-x-reverse" : "",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showAvatar && !isOwnMessage && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
              {getInitials(user.username)}
            </AvatarFallback>
          </Avatar>
        )}

        <div
          className="flex-1 relative max-w-md "
          onMouseLeave={handleCloseContextMenu}
          onContextMenu={handleRightClick}
        >
          <div
            className={cn(
              "relative",
              !isSingleEmoji(message.content) &&
                (isOwnMessage
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-2xl"
                  : "bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl"),
              !showAvatar && !isOwnMessage && "ml-10",
            )}
            style={{ maxWidth: "inherit" }}
          >
            {renderOriginalMessage()}

            {(!message.files?.[0] ||
              (!/\.(jpg|jpeg|png|gif|webp)$/i.test(message.files[0].filename) &&
                !/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)$/i.test(
                  message.files[0].filename,
                ))) &&
              (isSingleEmoji(message.content) ? (
                <div className={isOwnMessage ? "flex justify-end" : ""}>
                  <span className="text-[3rem] leading-none block">
                    {message.content}
                  </span>
                </div>
              ) : (
                // <div className="flex align-items-center">
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}{" "}
                  {message?.isEdited === true ? <span>(Editted)</span> : ""}
                </p>
                // </div>
              ))}

            {renderFileContent()}

            <div
              className={
                isOwnMessage && isSingleEmoji(message.content)
                  ? "flex justify-end"
                  : ""
              }
            >
              <p
                className={cn(
                  "text-xs mt-1",
                  isOwnMessage ? "text-blue-100" : "text-gray-500",
                )}
              >
                {formatTime(message.timestamp)}
              </p>
            </div>

            {renderThreadReplies()}

            {/* Hover Actions */}
            {isHovered && (
              <div
                className={cn(
                  "absolute top-0 flex flex-col items-start space-y-2 z-10",
                  isOwnMessage
                    ? "-left-20 transform -translate-y-2"
                    : "-right-20 transform -translate-y-2",
                )}
              >
                {selectedUser.type === 1 ? (
                  ""
                ) : (
                  <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1">
                    <Button
                      ref={buttonRef}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      title="Add reaction"
                      onMouseEnter={() => setShowEmojiPicker(true)}
                      onMouseLeave={() => setShowEmojiPicker(false)}
                    >
                      <ThumbsUp className="w-4 h-4 text-gray-600" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      onClick={() => onThreadClick?.(message)}
                      title="Start thread"
                    >
                      <MessageSquareQuote className="w-4 h-4 text-gray-600" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {showContextMenu && (
              <div
                ref={contextMenuRef}
                className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] p-2"
                style={{
                  top: `${contextMenuPosition.y}px`,
                  left: `${contextMenuPosition.x}px`,
                }}
              >
                <div className="flex flex-col space-y-1">
                  {canDownload && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full p-2 hover:bg-gray-100 flex items-center justify-start text-gray-600"
                      onClick={() => {
                        onBulkDownload?.(message);
                        setShowContextMenu(false);
                      }}
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-gray-600 mr-1" />
                      Download
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full p-2 hover:bg-gray-100 flex items-center justify-start text-gray-600"
                    onClick={() => {
                      onReplyClick?.(message);
                      setShowContextMenu(false);
                    }}
                    title="Reply"
                  >
                    <Reply className="w-4 h-4 text-gray-600 mr-1" />
                    Reply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-full p-2 hover:bg-gray-100 flex items-center justify-start text-gray-600"
                    onClick={() => {
                      setShowForwardPopup(true);
                      setShowContextMenu(false);
                    }}
                    title="Forward"
                  >
                    <Forward className="w-4 h-4 text-gray-600 mr-1" />
                    Forward
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full p-2 hover:bg-gray-100 flex items-center justify-start text-gray-600"
                      onClick={() => {
                        handleDeleteMessage(message._id);
                        setShowContextMenu(false);
                      }}
                      title="Delete"
                    >
                      <Trash className="w-4 h-4 text-gray-600 mr-1" />
                      Delete
                    </Button>
                  )}

                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full p-2 hover:bg-gray-100 flex items-center justify-start text-gray-600"
                      onClick={() => {
                        onEditMessage?.(message._id, message.content);
                        setShowContextMenu(false);
                      }}
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4 text-gray-600 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {renderReactions()}
        </div>
      </div>

      {/* Emoji Picker Portal - Positioned outside the message bubble */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="fixed z-[9999]"
          onMouseEnter={() => {
            setShowEmojiPicker(true);
            setIsHovered(true);
          }}
          onMouseLeave={() => {
            setShowEmojiPicker(false);
            setIsHovered(false);
          }}
          style={{
            top: `${getEmojiPickerPosition().top}px`,
            left: `${getEmojiPickerPosition().left}px`,
          }}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={300}
            height={400}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl max-w-5xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media Content */}
            <div className="p-4 flex items-center justify-center bg-gray-50">
              {selectedMedia.type === "image" ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.filename}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
                />
              ) : (
                <video
                  controls
                  className="max-w-full max-h-[60vh] rounded-lg shadow-md"
                  autoPlay
                >
                  <source src={selectedMedia.url} />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>

            {/* Footer */}
            <div className="bg-white px-6 py-4 border-t flex items-center justify-end">
              <div className="flex gap-3">
                <Button
                  onClick={handleMediaDownload}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => setSelectedMedia(null)}
                  variant="outline"
                  className="px-4 py-2"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showForwardPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl w-96 max-h-[500px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Forward Message</h3>
              <button
                onClick={() => {
                  setShowForwardPopup(false);
                  setSelectedUsers([]);
                  setSearchTerm("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Selected Users Count */}
            {selectedUsers.length > 0 && (
              <div className="px-4 py-2 bg-blue-50 text-sm text-blue-700">
                {selectedUsers.length} user{selectedUsers.length > 1 ? "s" : ""}{" "}
                selected
              </div>
            )}

            {/* Users List */}
            <div className="flex-1 overflow-y-auto max-h-64">
              {filteredUsers.map((u) => (
                <div
                  key={u._id}
                  className={cn(
                    "flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b",
                    selectedUsers.includes(u._id) && "bg-blue-50",
                  )}
                  onClick={() => toggleUserSelection(u._id)}
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                        {u.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {selectedUsers.includes(u._id) && (
                      <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {u.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {u.email || "No email"}
                    </p>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No users found
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForwardPopup(false);
                  setSelectedUsers([]);
                  setSearchTerm("");
                }}
                disabled={isForwarding}
              >
                Cancel
              </Button>
              <Button
                onClick={handleForwardMessage}
                disabled={selectedUsers.length === 0 || isForwarding}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isForwarding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Forwarding...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Forward ({selectedUsers.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface UploadProgressMessageProps {
  entry: {
    id: string;
    fileName?: string;
    progress: number;
    status: "Uploading" | "Merging" | "Scanning" | "Uploaded" | "Error";
    error?: string;
  };
  onCancel: (id: string) => void;
}

export const UploadProgressMessage: React.FC<UploadProgressMessageProps> = ({
  entry,
  onCancel,
}) => {
  const { fileName = "File", progress, status, error } = entry;

  const getStatusLabel = () => {
    switch (status) {
      case "Uploading":
        return "Uploading...";
      case "Merging":
        return "Merging chunks...";
      case "Scanning":
        return "Scanning file...";
      case "Uploaded":
        return "Upload Complete";
      case "Error":
        return "Upload Failed";
      default:
        return status;
    }
  };
  const isInProgress =
    status === "Uploading" || status === "Merging" || status === "Scanning";

  return (
    <div className="flex items-end space-x-2 relative group w-full ml-auto flex-row-reverse space-x-reverse">
      <div className="flex items-start gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border w-full max-w-md">
        <div className="relative shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-semibold text-sm uppercase">
          {fileName?.[0] || "?"}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-800 truncate">
            {fileName}
          </div>
          <div
            className={`text-xs mt-0.5 ${
              status === "Error"
                ? "text-red-500"
                : status === "Uploaded"
                  ? "text-green-600"
                  : "text-gray-500"
            }`}
          >
            {getStatusLabel()}
          </div>
          {isInProgress && (
            <div className="mt-1 w-full bg-gray-200 h-1.5 rounded overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-200 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {status === "Error" && (
            <div className="text-xs text-red-500 mt-1">
              {error || "An error occurred"}
            </div>
          )}
        </div>
        {isInProgress && (
          <button
            onClick={() => onCancel(entry.id)}
            className="ml-2 text-gray-400 hover:text-red-500"
            aria-label="Cancel upload"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
