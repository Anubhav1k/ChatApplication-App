# Real-Time Chat Application

A modern, full-featured chat application built with React, Express, Socket.IO, and MongoDB.

## Features

- 🔐 **User Authentication** - JWT-based login and registration
- 💬 **Real-time Messaging** - Instant messaging with Socket.IO
- 📁 **File Sharing** - Upload and share files up to 100MB
- 👥 **Online Status** - See who's online and offline
- ⌨️ **Typing Indicators** - Real-time typing notifications
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎨 **Modern UI** - Beautiful, clean interface with animations

## Tech Stack

### Frontend

- React 18 with TypeScript
- React Router 6 for routing
- TailwindCSS 3 for styling
- Radix UI components
- Socket.IO client for real-time features


## Prerequisites

Before running this application, make sure you have:

- Node.js (v18 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd chat-application
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env` and update the values:

   ```bash
   cp .env.example .env
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:8080`

## Usage

1. **Create an Account**

   - Go to the registration page
   - Enter your email, username, and password
   - Click "Create Account"

2. **Login**

   - Use your credentials to log in
   - You'll be redirected to the chat interface

3. **Start Chatting**
   - Select a user from the contact list
   - Start typing to send messages
   - Upload files using the attachment button
   - See real-time typing indicators and online status

## File Structure

```
├── client/                 # React frontend
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── context/          # React contexts
│   └── hooks/            # Custom React hooks
├── shared/               # Shared TypeScript types
└── uploads/            || "http://localhost:5000"  # File upload directory
```

## API Endpoints

### Authentication

- `POST http://localhost:3001/api/auth/register` - Register a new user
- `POST http://localhost:3001/api/auth/login` - Login user

### Chat

- `GET http://localhost:3001/api/users` - Get all users
- `GET http://localhost:3001/api/chat/:userId` - Get or create chat with user
- `GET http://localhost:3001/api/chat/:chatId/messages` - Get chat messages
- `POST http://localhost:3001/api/chat/:chatId/message` - Send a message

### File Upload

- `POST http://localhost:3001/api/upload` - Upload a file
- `GET http://localhost:3001/api/files/:filename` - Serve uploaded files

## Socket.IO Events

### Client to Server

- `join-chat` - Join a chat room
- `leave-chat` - Leave a chat room
- `send-message` - Send a message
- `typing` - Send typing indicator
- `mark-read` - Mark messages as read

### Server to Client

- `new-message` - Receive new message
- `user-online` - User came online
- `user-offline` - User went offline
- `user-typing` - User is typing
- `message-notification` - New message notification

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

