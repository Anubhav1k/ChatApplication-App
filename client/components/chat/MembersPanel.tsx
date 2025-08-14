import { User } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, Crown, Shield, Users, MoreVertical, UserRoundPlus, UserRoundMinus } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import { BaseUrl } from "@/constant";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatLastSeen } from "@/Functions";

interface GroupMember {
  _id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  isOnline: boolean;
  lastSeen: string;
}

interface GroupDetails {
  _id: string;
  participants: GroupMember[];
  type: number;
  groupName: string;
  groupImage?: string;
  groupDescription: string;
  groupAdmin: GroupMember[];
  createdBy: GroupMember;
  settings: {
    groupinfo: number;
    editmembers: number;
    mention: number;
    pin: number;
    cliptop: number;
    approroval: boolean;
  };
  permissions: {
    groupinfo: boolean;
    editmembers: boolean;
    mention: boolean;
    pin: boolean;
    cliptop: boolean;
    approroval: boolean;
  };
}

interface MembersPanelProps {
  groupId: string;
  currentUser: User;
  onlineUsers: Set<string>;
  onClose: () => void;
  groupDetails: GroupDetails | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function MembersPanel({
  groupId,
  currentUser,
  onlineUsers,
  onClose,
  groupDetails,
  loading,
  error,
  onRefresh
}: MembersPanelProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);


  const getInitials = (firstname: string, lastname: string) => {
    return `${firstname[0]}${lastname[0]}`.toUpperCase();
  };


  const isAdmin = (memberId: string) => {
    return groupDetails?.groupAdmin.some(admin => admin._id === memberId);
  };

  const isCreator = (memberId: string) => {
    return groupDetails?.createdBy._id === memberId;
  };

  const canManageMembers = () => {
    return groupDetails?.permissions.editmembers &&
      (isAdmin(currentUser._id) || isCreator(currentUser._id));
  };

  const handleAddAdmin = async (userId: string) => {
    setActionLoading(`add-${userId}`);
    try {
      const response = await fetch(`${BaseUrl}/api/group/admin/add/${groupId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userids: [userId]
        }),
      });

      if (response.ok) {
        onRefresh(); // Refresh group details
      } else {
        const errorText = await response.text();
        console.error("Failed to add admin:", errorText);
        // You can add toast notification here
      }
    } catch (error) {
      console.error("Failed to add admin:", error);
      // You can add toast notification here
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    setActionLoading(`remove-${userId}`);
    try {
      const response = await fetch(`${BaseUrl}/api/group/admin/remove/${groupId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userids: [userId]
        }),
      });

      if (response.ok) {
        onRefresh(); // Refresh group details
      } else {
        const errorText = await response.text();
        console.error("Failed to remove admin:", errorText);
        // You can add toast notification here
      }
    } catch (error) {
      console.error("Failed to remove admin:", error);
      // You can add toast notification here
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="w-96 h-full bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-96 h-full bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <Button onClick={onRefresh} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Group Members</h3>
              <p className="text-sm text-gray-500">
                {groupDetails?.participants.length || 0} members
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Group Info */}
      {groupDetails && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
              {groupDetails.groupImage ? (
                <img
                  src={`${BaseUrl}/${groupDetails.groupImage}`}
                  alt={groupDetails.groupName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                  {getInitials(groupDetails.groupName, "")}
                </div>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{groupDetails.groupName}</h4>
              <p className="text-sm text-gray-500">{groupDetails.groupDescription}</p>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="space-y-3">
            {groupDetails?.participants.map((member) => (
              <div key={member._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full">
                        {getInitials(member.firstname, member.lastname)}
                      </div>
                    </Avatar>
                    {member.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {member.firstname} {member.lastname}
                      </h4>
                      {isCreator(member._id) && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                      {isAdmin(member._id) && !isCreator(member._id) && (
                        <Shield className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">@{member.username}</p>
                    <p className="text-xs text-gray-400">
                      {member.isOnline ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          Online
                        </Badge>
                      ) : (
                        formatLastSeen(member.lastSeen)
                      )}
                    </p>
                  </div>
                </div>

                {/* Member Actions */}
                {canManageMembers() && member._id !== currentUser._id && (
                  <>
                    {!isAdmin(member._id) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAddAdmin(member._id)}
                            disabled={actionLoading === `add-${member._id}`}
                          >
                            <UserRoundPlus className="w-5 h-5 text-green-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Set as group admin</TooltipContent>
                      </Tooltip>

                    )}

                    {isAdmin(member._id) && !isCreator(member._id) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAdmin(member._id)}
                            disabled={actionLoading === `remove-${member._id}`}
                          >
                            <UserRoundMinus className="w-5 h-5 text-red-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove group admin</TooltipContent>
                      </Tooltip>

                    )}
                  </>

                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-center text-sm text-gray-500">
          Created by {groupDetails?.createdBy.firstname} {groupDetails?.createdBy.lastname}
        </div>
      </div>
    </div>
  );
}