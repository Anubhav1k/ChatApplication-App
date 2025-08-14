import React, { useEffect, useRef, useState } from "react";
import {
  Lock,
  MessageCircle,
  MoreVertical,
  Phone,
  Video,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { useSocket } from "@/context/SocketContext";
import { formatLastSeen } from "@/Functions";
import { User } from "@shared/types";
import { BaseUrl } from "@/constant";

const getInitials = (username: string = ""): string => {
  return username
    .trim()
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const ContactDetailModel = ({ id }: { id: string }) => {
  const userCardRef = useRef<HTMLDivElement>(null);
  const { onlineUsers } = useSocket();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async (userId: string, signal: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BaseUrl}/api/user/${userId}`, {
        signal,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await response.json();
      setSelectedUser(userData.data || null);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Fetch error:", err);
        setError("Failed to load user details.");
        setSelectedUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    if (id) {
      fetchUserProfile(id, controller.signal);
    }

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div
        ref={userCardRef}
        className="absolute top-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 w-[455px]"
      >
        <p className="text-sm text-gray-500">Loading user...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        ref={userCardRef}
        className="absolute top-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 w-[455px]"
      >
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!selectedUser) return null;

  return (
    <div
      ref={userCardRef}
      className="absolute top-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 w-[455px]"
    >
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center overflow-hidden">
            {selectedUser.avatar ? (
              <img
                src={selectedUser.avatar}
                alt={`${selectedUser.chatname}'s avatar`}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full">
               {selectedUser.chatname?.charAt(0).toUpperCase()}

              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {selectedUser.chatname}
            </h3>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-blue-600 text-sm">
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
  );
};

export default ContactDetailModel;
