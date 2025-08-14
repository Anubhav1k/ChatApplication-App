export interface User {
  _id: string;
  id: string;
  email: string;
  username: string;
  chatname: string;
  count: number;
  isOnline: boolean;
  lastSeen: Date;
  avatar?: string;
  firstname?: string;
  isAllowed: boolean;
  isRequested: boolean;
  isgroup: boolean;
  type: number;
  groupImage: string;

}
export interface user {
  firstname: string
  id: string
  lastname: string
  username: string
  _id: string
}
export interface Message {
  _id: string;
  isEdited: boolean;
  userId?: string;
  chatId: string;
  senderId: {
    id: string;
    firstname?: string;
    lastname?: string;
    username: string;
  };
  receiverId: string;
  content: string;
  type: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: Date;
  readBy: string[];
  reactions: any;
  replyTo: {
    id: string;
    senderId: {
      username: string
    };
    username: string;
    content: string;
    type: number;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  };
  createdAt: Date;
  files?: {
    url: string;
    filename: string;
    size: number;
    type: string;
  }[];
  isReply?: boolean;
  threads?: {
    replys: Message[];

  },
  createdBy?: user;
  ActionId?: user[];
  gmtype?: number;
}
export interface Chat {
  _id: string;
  participants: string[];
  lastMessage?: Message;
  messageId?: Message;
  updatedAt: Date;
  likes: {
    userId: string;
  }
}

export interface AuthResponse {
  accessToken: string;
  accessexpiry: string;
  refreshToken: string;
  refreshexpiry: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
  };
}

export interface RegisterRequest {
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  password: string;
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
  };
}

export interface TypingEvent {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

export interface FileUploadResponse {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}
