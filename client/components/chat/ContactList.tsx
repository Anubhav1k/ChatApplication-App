import { User } from "@shared/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { formatLastSeen } from "@/Functions";
import { BaseUrl } from "@/constant";

interface ContactListProps {
  onlineUsers: Set<string>;
  typingUsers: Record<string, { istyping: boolean }>;
  users: User[];
  selectedUser: User | null;
  onUserSelect: (user: User) => void;
}

export function ContactList({
  onlineUsers,
  typingUsers,
  users,
  selectedUser,
  onUserSelect,
}: ContactListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.chatname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getInitials = (chatname?: string) => {
    if (!chatname) return "NA";

    return chatname
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2" style={{ height: '80vh'}}>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? "No contacts found" : "No contacts available"}
            </div>
          ) : (
            filteredUsers.map((user) => {
              return (
                <button
                  key={user._id}
                  onClick={() => onUserSelect(user)}
                  className={cn(
                    "w-full p-3 rounded-lg text-left hover:bg-gray-50 transition-colors",
                    selectedUser?._id === user._id &&
                      "bg-blue-50 border border-blue-200",
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <img
                          src={`${BaseUrl}/${user.groupImage}`}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                          alt="Group"
                          className="..."
                        />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                          {getInitials(user.chatname)}
                        </AvatarFallback>
                      </Avatar>
                      {onlineUsers?.has(user.id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.chatname}
                        </p>
                        {!user.isgroup && onlineUsers?.has(user.id) ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 text-xs"
                          >
                            Online
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {formatLastSeen(user.lastSeen)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {typingUsers?.[user._id]?.istyping ? (
                          <span className="text-blue-500">Typing...</span>
                        ) : (
                          user.email
                        )}
                      </p>
                    </div>
                    {user.count > 0 && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {user.count}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
