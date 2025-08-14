import { useState } from "react";
import { Message, User } from "@shared/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  Send,
  Paperclip,
  Smile,
  AtSign,
  Hash,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  Code,
} from "lucide-react";
import {
  Download,
  File,
  Image as ImageIcon,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { BaseUrl } from "@/constant";

interface ThreadPanelProps {
  originalMessage: Message;
  currentUser: User;
  selectedUser: User;
  threadReplies: Message[];
  onClose: () => void;
  onSendReply?: (content: string) => void;
}

export function ThreadPanel({
  originalMessage,
  currentUser,
  selectedUser,
  threadReplies,
  onClose,
  onSendReply,
}: ThreadPanelProps) {
  const [replyContent, setReplyContent] = useState("");

  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (timestamp: Date) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSendReply = () => {
    if (replyContent.trim()) {
      onSendReply?.(replyContent);
      setReplyContent("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Thread Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Thread</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Original Message */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={selectedUser.avatar} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
              {getInitials(selectedUser.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-gray-900 text-sm">
                {selectedUser.username}
              </span>
              <span className="text-xs text-gray-500">
                {formatTime(originalMessage.timestamp)}
              </span>
            </div>

            {/* Show content if it's not an image file */}
            {(!originalMessage.files?.[0] ||
              !/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv|webm|flv|wmv|m4v)$/i.test(
                originalMessage.files[0].filename,
              )) && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {originalMessage.content}
              </p>
            )}

            {/* Show image preview if present */}
            {originalMessage.files?.map((file: any, index: any) => {
              const filePath = file.url || file.filename || "";
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filePath);
              const isVideo = /\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v)$/i.test(
                filePath,
              );
              const fileUrl = `${BaseUrl}/${file.url}`;

              if (isImage) {
                return (
                  <div key={index} className="mt-2">
                    <img
                      src={fileUrl}
                      alt={file.filename || "image"}
                      className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(fileUrl, "_blank")}
                    />
                  </div>
                );
              } else if (isVideo) {
                return (
                  <div key={index} className="mt-2">
                    <video
                      controls
                      className="max-w-xs rounded-lg"
                      preload="metadata"
                    >
                      <source
                        src={fileUrl}
                        type={file.mimetype || "video/mp4"}
                      />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                );
              } else {
                return (
                  <div
                    key={index}
                    className="mt-2 p-3 bg-gray-100 rounded-lg border max-w-xs"
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
                            {Math.round(file.size / 1024)} KB
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
        </div>
      </div>

      {/* Thread Replies */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {threadReplies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No replies yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Start a thread to reply to this message
            </p>
          </div>
        ) : (
          threadReplies.map((reply: any) => {
            return (
              <div key={reply._id} className="flex items-start space-x-3">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                    {getInitials(currentUser.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">
                      {currentUser.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(reply.updatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {reply.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <Avatar className="h-6 w-6">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
              {getInitials(currentUser.username)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-gray-700">
            Reply to thread
          </span>
        </div>

        <div className="relative">
          <Input
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Reply in thread..."
            className="pr-12 min-h-[40px] resize-none"
          />
          <Button
            onClick={handleSendReply}
            disabled={!replyContent.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Formatting Options */}
        <div className="flex items-center space-x-1 mt-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Paperclip className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Italic className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Underline className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Link className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Code className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <AtSign className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Smile className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
