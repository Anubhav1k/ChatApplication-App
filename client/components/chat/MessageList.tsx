import { useEffect, useRef, Fragment } from "react";
import { Message, User } from "@shared/types";
import { MessageBubble, UploadProgressMessage } from "./MessageBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatRequest } from "./ChatRequest";
import { GetcenterText, GroupMessageType, MessageType } from "@/constant";
import { useUpload } from "@/context/UploadContext";

interface MessageListProps {
  typingUsers: Record<string, { istyping: boolean }>;
  messages: Message[];
  currentUser: User;
  fetchUsers?: () => void;
  selectedUser: User;
  users: User[]; // List of all users for the chat
  chatId: string;
  onThreadClick?: (message: Message) => void;
  onReplyClick?: (message: Message) => void;
  onReactionClick?: (messageId: string, reaction: string) => void;
  editingMessage?: { id: string; content: string } | null;
  onUpdateMessage?: (chatId: string, messageId: string, content: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
}

// Utility: Normalize thread reply to message format
const normalizeThreadReply = (reply: any): Message => {
  return {
    _id: reply._id,
    chatId: reply.messageId || "",
    senderId: {
      id: reply.userId._id,
      username: reply.userId.username,
    },
    receiverId: "", // Thread replies don't have receiverId
    content: reply.reply,
    timestamp: new Date(reply.createdAt),
    createdAt: new Date(reply.createdAt),
    type: MessageType.Message,
    readBy: [],
    replyTo: undefined,
    // Add any other fields that might be missing
    reactions: reply.reactions || [],
    isEdited: !!reply.isEdited, // Add isEdited property, default to false if not present
  };
};

// Utility: Group messages by date
const groupMessagesByDate = (messages: Message[] = []) => {
  return messages.reduce(
    (groups, message) => {
      // Handle both regular messages and normalized thread replies
      const timestamp = message.timestamp || message.createdAt;
      const date = new Date(timestamp).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
      return groups;
    },
    {} as Record<string, Message[]>,
  );
};

// Utility: Format date to "Today", "Yesterday", or full format
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (dateString === today) return "Today";
  if (dateString === yesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function MessageList({
  typingUsers,
  messages,
  currentUser,
  selectedUser,
  chatId,
  fetchUsers,
  users,
  onThreadClick,
  onReplyClick,
  onReactionClick,
  editingMessage,
  onUpdateMessage,
  onEditMessage,
}: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { processingHistory, cancelUpload } = useUpload();
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Process messages - normalize thread replies if needed
  const processedMessages = messages.map((message) => {
    // Check if this is a thread reply format (has userId instead of senderId)
    if (message.userId && !message.senderId) {
      return normalizeThreadReply(message);
    }
    return message;
  });
  const groupedMessages = groupMessagesByDate(processedMessages);
  const isUserAllowed = selectedUser?.isAllowed;

  if (!isUserAllowed) {
    return (
      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <ChatRequest
          selectedUser={selectedUser}
          chatId={chatId}
          fetchUsers={fetchUsers}
        />
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4 " ref={scrollAreaRef}>
      <div
        className="py-4 space-y-4"
        style={
          selectedUser.type === 1
            ? { height: "calc(100vh - 38rem)" }
            : { height: "calc(100vh - 20rem)" }
        }
      >
        {Object.keys(groupedMessages).length === 0 ? (
          <NoMessages username={selectedUser?.username} />
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <Fragment key={date}>
              <DateSeparator date={formatDate(date)} />
              <div className="space-y-3">
                {dateMessages.map((message, index) => {
                  const isOwnMessage = message.senderId.id === currentUser._id;
                  const showAvatar =
                    index === dateMessages.length - 1 ||
                    dateMessages[index + 1]?.senderId?.id !==
                      message.senderId.id;

                  if (message.type === MessageType.center) {
                    return (
                      <CenterMessage key={message._id} message={message} />
                    );
                  }

                  return (
                    <MessageBubble
                      key={message._id}
                      message={message}
                      selectedUser={selectedUser}
                      isOwnMessage={isOwnMessage}
                      showAvatar={showAvatar}
                      user={isOwnMessage ? currentUser : selectedUser}
                      onThreadClick={onThreadClick}
                      onReplyClick={onReplyClick}
                      onReactionClick={onReactionClick}
                      users={users} // Pass allUsers prop
                      editingMessage={editingMessage}
                      onUpdateMessage={onUpdateMessage}
                      onEditMessage={onEditMessage}
                    />
                  );
                })}

                {typingUsers?.[selectedUser._id]?.istyping && (
                  <MessageBubble
                    key="typing-indicator"
                    message={{
                      _id: "typing-indicator",
                      chatId: "",
                      senderId: {
                        id: currentUser._id,
                        username: currentUser.username,
                      },
                      receiverId: selectedUser._id,
                      content: "Typing...",
                      timestamp: new Date(),
                      createdAt: new Date(),
                      type: MessageType.Message,
                      readBy: [],
                      replyTo: undefined,
                      isEdited: false,
                      reactions: [],
                    }}
                    isOwnMessage={false}
                    showAvatar={false}
                    user={selectedUser}
                    users={users}
                    selectedUser={selectedUser}
                  />
                )}
              </div>
            </Fragment>
          ))
        )}
        {processingHistory
          .filter((item) => item.chatId === chatId)
          .map((entry) => (
            <UploadProgressMessage
              key={entry.id}
              entry={entry}
              onCancel={(id) => cancelUpload(id)} // You define this
            />
          ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

// 🧩 Subcomponents

const NoMessages = ({ username }: { username: string }) => (
  <div className="flex items-center justify-center h-full text-gray-500">
    <div className="text-center">
      <p className="text-lg font-medium mb-2">No messages yet</p>
      <p className="text-sm">Start a conversation with {username}</p>
    </div>
  </div>
);

const DateSeparator = ({ date }: { date: string }) => (
  <div className="flex items-center justify-center my-6">
    <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
      {date}
    </div>
  </div>
);

const CenterMessage = ({ message }: { message: Message }) => {
  const texts = GetcenterText(message.gmtype);
  return (
    <div className="flex justify-center text-sm">
      <span>
        <span className="text-blue-500">
          {`${message.createdBy.firstname} ${message.createdBy.lastname}`}
        </span>
        {` ${texts.first} `}
        {message.gmtype !== GroupMessageType.leave &&
          message.ActionId?.map((user, index) => (
            <span
              key={user._id || index}
              id={`action-user-${index}`}
              className="text-blue-500 inline"
            >
              {`${user.firstname} ${user.lastname}`}
              {index < message.ActionId.length - 1 ? ", " : ""}
            </span>
          ))}
        {` ${texts.second}`}
      </span>
    </div>
  );
};
