import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Image as ImageIcon, Smile, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseUrl } from "@/constant";
import { User } from "@shared/types";
import EmojiPicker from "emoji-picker-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface MessageInputProps {
  onSendMessage: (content: string, type?: string, fileData?: any) => void;
  onTyping: (isTyping: boolean) => void;
  selectedUser: User;
  disabled: boolean;
  clearReply?: () => void;
  replyTo?: { content: string; userId: string; _id: string };
  UploadProgress?: number;
  UploadProgressStep?: string;
  droppedFile?: File[] | null;
  clearDroppedFile?: () => void;
  editingMessage?: { id: string; content: string } | null;
  onUpdateMessage?: (chatId: string, messageId: string, content: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  users?: User[];
}

interface FilePreview {
  file: File;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  id: string;
}

export function MessageInput({
  onSendMessage,
  onTyping,
  disabled,
  selectedUser,
  droppedFile,
  replyTo,
  clearReply,
  editingMessage,
  onUpdateMessage,
  onEditMessage,
  UploadProgress,
  clearDroppedFile,
  UploadProgressStep,
  users,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [filePreview, setFilePreview] = useState<FilePreview[]>([]);
  const [showFilePreview, setShowFilePreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  const [showMentionBox, setShowMentionBox] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [filteredMentionUsers, setFilteredMentionUsers] = useState<User[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  const handleMentionSelect = (user: User) => {
    const beforeAt = message.substring(0, message.lastIndexOf('@'));
    const afterQuery = message.substring(message.lastIndexOf('@') + mentionQuery.length + 1);
    const newMessage = `${beforeAt}@${user.username} ${afterQuery}`;
    setMessage(newMessage);
    setShowMentionBox(false);
    setMentionQuery("");
    textareaRef.current?.focus();
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
    onTyping(true);
  };

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

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isUploading) {
      if (editingMessage && onUpdateMessage) {
        // Pass the chat ID from selectedUser
        onUpdateMessage(selectedUser._id, editingMessage.id, message.trim());
      } else {
        onSendMessage(message.trim());
      }
      setMessage("");
      setShowEmojiPicker(false);
      onTyping(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.overflowY = "hidden";
      }
      if (replyTo) {
        clearReply?.();
      }
    }
  };

  // Handle input changes and typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    onTyping(value.length > 0);

    // Check for @ mention
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1) {
      const textAfterAt = value.substring(atIndex + 1);
      const spaceIndex = textAfterAt.indexOf(' ');
      const query = spaceIndex === -1 ? textAfterAt : textAfterAt.substring(0, spaceIndex);

      if (spaceIndex === -1) { // Still typing after @
        setMentionQuery(query);
        const filtered = (users || []).filter(user =>
          user.username.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        setFilteredMentionUsers(filtered);
        setShowMentionBox(filtered.length > 0);
        setSelectedMentionIndex(0);
      } else {
        setShowMentionBox(false);
      }
    } else {
      setShowMentionBox(false);
    }

    // Existing textarea height logic
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const lineHeight = 20;
      const maxHeight = lineHeight * 6;
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
    }
  };

  useEffect(() => {
    if (editingMessage && textareaRef.current) {
      setMessage(editingMessage.content);
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 20 * 6)}px`;
      textareaRef.current.focus();
    }
  }, [editingMessage]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Handle file selection and show preview
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newPreviews: FilePreview[] = files.map((file, index) => ({
        file,
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        id: `file-${Date.now()}-${index}`
      }));
      setFilePreview(prev => [...prev, ...newPreviews]);
      setShowFilePreview(true);
    }
    e.target.value = "";
  };

  // Handle image selection and show preview
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newPreviews: FilePreview[] = files.map((file, index) => ({
        file,
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        id: `image-${Date.now()}-${index}`
      }));
      setFilePreview(prev => [...prev, ...newPreviews]);
      setShowFilePreview(true);
    }
    e.target.value = "";
  };

  // Remove individual file from preview
  const removeFileFromPreview = (fileId: string) => {
    setFilePreview(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.fileUrl);
      }
      const updatedFiles = prev.filter(f => f.id !== fileId);
      if (updatedFiles.length === 0) {
        setShowFilePreview(false);
      }
      return updatedFiles;
    });
  };

  // Send the files
const handleSendFile = async () => {
  if (filePreview.length === 0) return;

  setIsUploading(true);

  try {
    // Collect all files from preview
    const files = filePreview.map(preview => preview.file);
    
    // Determine message type and content based on files
    let messageType = "0";
    let messageContent = "";
    
    const allImages = files.every(file => file.type.startsWith("image/"));
    const allVideos = files.every(file => file.type.startsWith("video/"));
    
    if (allImages && files.length === 1) {
      messageType = "1";
      messageContent = "📷 Image";
    } else if (allImages && files.length > 1) {
      messageType = "1";
      messageContent = `📷 ${files.length} Images`;
    } else if (allVideos && files.length === 1) {
      messageType = "2";
      messageContent = "🎥 Video";
    } else if (allVideos && files.length > 1) {
      messageType = "2";
      messageContent = `🎥 ${files.length} Videos`;
    } else if (files.length === 1) {
      messageType = "0";
      messageContent = `📎 ${files[0].name}`;
    } else {
      messageType = "0";
      messageContent = `📎 ${files.length} files`;
    }

    // Create fileData object with files array
    const fileData = {
      files: files, // Pass array of files instead of single file
    };

    // Call onSendMessage with multiple files
    onSendMessage(messageContent, messageType, fileData);

    // Clean up preview
    filePreview.forEach(preview => URL.revokeObjectURL(preview.fileUrl));
    setShowFilePreview(false);
    setFilePreview([]);
  } catch (err) {
    console.error("Error sending files:", err);
  } finally {
    setIsUploading(false);
  }
};


  // Cancel file upload
  const handleCancelFile = () => {
    filePreview.forEach(preview => URL.revokeObjectURL(preview.fileUrl));
    setFilePreview([]);
    setShowFilePreview(false);
  };

  useEffect(() => {
    if (droppedFile && droppedFile.length > 0) {
      const newPreviews: FilePreview[] = droppedFile.map((file, index) => ({
        file,
        fileName: file.name,
        fileSize: file.size,
        fileUrl: URL.createObjectURL(file),
        fileType: file.type,
        id: `dropped-${Date.now()}-${index}`
      }));

      setFilePreview(prev => [...prev, ...newPreviews]);
      setShowFilePreview(true);
      clearDroppedFile?.();
    }
  }, [droppedFile, clearDroppedFile]);

  return (
    <div className="p-4 border-t border-gray-200 bg-white relative">
      {/* File Preview Modal */}
      <Dialog open={showFilePreview && filePreview.length > 0} onOpenChange={setShowFilePreview}>
        <DialogContent className="">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>
                Send to{" "}
                {selectedUser.isgroup === true
                  ? selectedUser?.chatname
                  : selectedUser?.firstname || "User"}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="mb-4 max-h-64 overflow-y-auto">
            {filePreview.map((preview) => (
              <div key={preview.id} className="mb-3 relative">
                {/* Remove button */}
                <button
                  onClick={() => removeFileFromPreview(preview.id)}
                  className="absolute top-1 right-1 z-10 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>

                {preview.fileType.startsWith("image/") ? (
                  <div>
                    <img
                      src={preview.fileUrl}
                      alt={preview.fileName}
                      className="max-w-full max-h-32 object-contain rounded-lg mx-auto"
                    />
                    <div className="mt-1 text-center">
                      <p className="text-sm text-gray-600 truncate">{preview.fileName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(preview.fileSize)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-gray-200 rounded">
                      <Paperclip className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 truncate">{preview.fileName}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(preview.fileSize)}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <DialogFooter className="flex space-x-3">
            <Button
              onClick={handleCancelFile}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>

            <Button
              onClick={handleSendFile}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  {UploadProgress}
                  <br />
                  {UploadProgressStep}
                </>
              ) : (
                `Send ${filePreview.length} file${filePreview.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedUser?.isAllowed === true ? (
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1">
            {/* Attachment and emoji buttons */}
            {selectedUser.type === 1 ? (
              ""
            ) : (
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                  multiple
                />
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  className="hidden"
                  accept="image/*"
                  multiple
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  disabled={isUploading}
                >
                  <Smile className="h-4 w-4" />
                </Button>

                {/* Show selected files count */}
                {filePreview.length > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-blue-600">
                    <span>{filePreview.length} file{filePreview.length !== 1 ? 's' : ''} selected</span>
                    <button
                      onClick={() => setShowFilePreview(true)}
                      className="underline hover:text-blue-800"
                    >
                      View
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Emoji picker */}
            {showEmojiPicker && !isUploading && (
              <div ref={emojiPickerRef} className="absolute bottom-24 z-50">
                <EmojiPicker onEmojiClick={handleEmojiClick} height={300} />
              </div>
            )}

            {/* Reply section (shows which message is being replied to) */}
            {replyTo && (
              <div className="p-2 bg-blue-50 border-l-4 border-blue-500 mb-2 rounded text-sm text-gray-800 flex justify-between items-center">
                <div>
                  Replying to:{" "}
                  <span className="font-medium">{replyTo.content}</span>
                </div>
                <button
                  onClick={clearReply}
                  className="text-xs text-blue-600 underline ml-2"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Message input and send button */}
            <div className="flex items-center space-x-2">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                placeholder={
                  isUploading
                    ? "Uploading..."
                    : editingMessage
                      ? "Edit your message..."
                      : "Type a message..."
                }
                disabled={disabled || isUploading}
                className={cn(
                  "flex-1 resize-none rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500",
                  disabled || isUploading ? "bg-gray-100" : "bg-white"
                )}
                onKeyDown={(e) => {
                  if (showMentionBox && filteredMentionUsers.length > 0) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setSelectedMentionIndex(prev =>
                        prev < filteredMentionUsers.length - 1 ? prev + 1 : 0
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setSelectedMentionIndex(prev =>
                        prev > 0 ? prev - 1 : filteredMentionUsers.length - 1
                      );
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      handleMentionSelect(filteredMentionUsers[selectedMentionIndex]);
                      return;
                    } else if (e.key === "Escape") {
                      setShowMentionBox(false);
                      return;
                    }
                  }

                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                rows={1}
              />

              <Button
                type="submit"
                size="sm"
                disabled={!message.trim() || disabled || isUploading}
                className={cn(
                  "h-10 w-10 p-0",
                  message.trim()
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    : "bg-gray-300",
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>

      ) : (
        <p className="text-center text-sm text-gray-500">
          Sorry, you are not allowed to send messages to this user.
        </p>
      )}
      {showMentionBox && filteredMentionUsers.length > 0 && (
        <div className="absolute bottom-20 left-4 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-64 z-50 max-h-40 overflow-y-auto">
          {filteredMentionUsers.map((user, index) => (
            <div
              key={user._id}
              className={`px-4 py-2 cursor-pointer flex items-center space-x-2 ${index === selectedMentionIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              onClick={() => handleMentionSelect(user)}
            >
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium">{user.username}</div>
                <div className="text-xs text-gray-500">{user.firstname || user.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}