import { useState, useRef, useEffect } from "react";
import { User } from "@shared/types";
import {
  X,
  Search,
  Plus,
  Minus,
  MoreVertical,
  QrCode,
  RotateCw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseUrl } from "@/constant";
import axios from "@/context/NetworkServices";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MemberPermission } from "./MemberPermission";

// Add interfaces for group management
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

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMembers: (userIds: string[]) => void;
  allUsers: User[];
  existingMembers: GroupMember[];
}

interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRemoveMembers: (userIds: string[]) => void;
  groupMembers: GroupMember[];
  currentUserId: string;
}

// Add Member Modal Component
function AddMemberModal({
  isOpen,
  onClose,
  onAddMembers,
  allUsers,
  existingMembers,
}: AddMemberModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const existingMemberIds = existingMembers.map((member) => member._id);
  const availableUsers = allUsers.filter(
    (user) => !existingMemberIds.includes(user._id),
  );




  const filteredUsers = availableUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleConfirm = () => {
    if (selectedUsers.length > 0) {
      onAddMembers(selectedUsers);
      setSelectedUsers([]);
      setSearchTerm("");
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedUsers([]);
    setSearchTerm("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Add Members</DialogTitle>

          </div>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <p className="text-sm text-gray-600 mb-2">
          Selected: {selectedUsers.length} members
        </p>

        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {filteredUsers.map((user) => (
            <label
              key={user._id}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedUsers.includes(user._id)}
                onChange={() => handleUserToggle(user._id)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {user.username.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{user.username}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
            </label>
          ))}
          {filteredUsers.length === 0 && (
            <div className="text-center py-4 text-gray-500">No users found</div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button onClick={handleCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedUsers.length === 0}
            className="flex-1"
          >
            Add Members
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  );
}

function RemoveMemberModal({
  isOpen,
  onClose,
  onRemoveMembers,
  groupMembers,
  currentUserId,
}: RemoveMemberModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const removableMembers = groupMembers.filter(
    (member) => member._id !== currentUserId,
  );


  const filteredMembers = removableMembers.filter(
    (member) =>
      member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleConfirm = () => {
    if (selectedUsers.length > 0) {
      onRemoveMembers(selectedUsers);
      setSelectedUsers([]);
      setSearchTerm("");
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedUsers([]);
    setSearchTerm("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Remove Members</DialogTitle>

          </div>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <p className="text-sm text-gray-600 mb-2">
          Selected: {selectedUsers.length} members
        </p>

        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {filteredMembers.map((member) => (
            <label
              key={member._id}
              className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedUsers.includes(member._id)}
                onChange={() => handleUserToggle(member._id)}
                className="w-4 h-4 text-red-600 rounded border-gray-300"
              />
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {member.username.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{member.username}</div>
                <div className="text-xs text-gray-500">{member.email}</div>
              </div>
            </label>
          ))}
          {filteredMembers.length === 0 && (
            <div className="text-center py-4 text-gray-500">No members to remove</div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button onClick={handleCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedUsers.length === 0}
            variant="destructive"
            className="flex-1"
          >
            Remove Members
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  );
}

interface SettingsPanelProps {
  groupId: string;
  currentUser: User;
  selectedUser: User;
  onlineUsers: Set<string>;
  onClose: () => void;
  allUsers?: User[];
  groupDetails?: GroupDetails | null;
  onRefreshGroup?: () => void;
}

export function SettingsPanel({
  groupId,
  currentUser,
  selectedUser,
  onlineUsers,
  onClose,
  allUsers,
  groupDetails,
  onRefreshGroup,
}: SettingsPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [myAlias, setMyAlias] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };


  const handleAddMembers = async (userIds: string[]) => {
    try {
      const response = await axios.post(
        `${BaseUrl}/api/group/member/${groupId}`,
        {
          userids: userIds,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );


      // Refresh group details
      if (onRefreshGroup) {
        onRefreshGroup();
      }
    } catch (error: any) {
      console.error(
        "Failed to add members:",
        error?.response?.data?.message || error.message
      );
    }
  };

  const handleRemoveMembers = async (userIds: string[]) => {
    try {
      const response = await axios.post(
        `${BaseUrl}/api/group/leave/${groupId}`,
        {
          userids: userIds,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );


      // Refresh group details
      if (onRefreshGroup) {
        onRefreshGroup();
      }
    } catch (error: any) {
      console.error(
        "Failed to remove members:",
        error?.response?.data?.message || error.message
      );
    }
  };


  const handleLeaveGroup = async () => {
    try {
      const response = await axios.post(
        `${BaseUrl}/api/group/leave/${groupId}`,
        {
          userids: [currentUser.id],
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      onClose();
    } catch (error: any) {
      console.error(
        "Failed to leave group:",
        error?.response?.data?.message || error.message
      );
    }
  };

  const handleClearChatHistory = () => {
    console.log("Clear chat history clicked");
  };

  const members = groupDetails?.participants || [];

  const handleclick = () => {
    alert("Group settings clicked");
    // Implement your group settings logic here   
  }

  return (
    <>
      <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Group Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <span className="text-pink-600 font-medium text-sm">
                {getInitials(selectedUser.chatname)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                {selectedUser.chatname}
              </h3>
            </div>
            <div className="flex gap-1">
              <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-sm"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-sm"></div>
                </div>
              </button>
              <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                <QrCode className="w-4 h-4 text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Members Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Members</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {members.length}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2 mb-4">
                {members.map((member) => (
                  <div
                    key={member._id}
                    className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center relative"
                  >
                    <span className="text-white text-xs font-medium">
                      {getInitials(member.username)}
                    </span>
                    {onlineUsers.has(member._id) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => setShowRemoveModal(true)}
                  className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Minus className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1 mb-6">
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors text-sm">
                <span className="text-gray-900">Bots</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors text-sm">
                <span className="text-gray-900">Chat Menu</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors text-sm" onClick={() => setShowGroupSettings(true)}>
                <span className="text-gray-900">Group Settings</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* My Alias */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">My Alias</h3>
              <input
                type="text"
                placeholder="Enter my alias"
                value={myAlias}
                onChange={(e) => setMyAlias(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Labels */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Labels</h3>
                <button className="text-sm text-gray-500 hover:text-blue-600 transition-colors text-sm">
                  Add Label <ChevronRight className="w-3 h-3 inline ml-1" />
                </button>
              </div>

            </div>

            {/* Translation Assistant */}
            <div className="mb-6">
              <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors text-sm">
                <span className="text-gray-900">Translation Assistant</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Clear Chat History */}
            <div className="mb-6">
              <div
                onClick={handleClearChatHistory}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors text-sm"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-3 h-3 border border-gray-400 rounded"></div>
                </div>
                <span className="text-gray-900">Clear All Chat History</span>
              </div>
            </div>

            {/* Leave Group */}
            <div className="mb-4">
              <button
                onClick={() => setShowLeaveDialog(true)}
                className="w-full px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                Leave Group
              </button>


            </div>
          </div>
        </div>
      </div>
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to leave this group?</DialogTitle>
          </DialogHeader>

          <div className="text-sm text-gray-500">
            You will no longer have access to this chat once you leave.
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowLeaveDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleLeaveGroup();
                setShowLeaveDialog(false);
              }}
              className="flex-1"
            >
              Leave Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddMembers={handleAddMembers}
        allUsers={allUsers}
        existingMembers={members}
      />

      {/* Remove Member Modal */}
      <RemoveMemberModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onRemoveMembers={handleRemoveMembers}
        groupMembers={members}
        currentUserId={currentUser.id}
      />

      {/* Group Settings Panel */}
      {showGroupSettings && (
        <div className="fixed right-0 top-0 h-full z-50">
          <MemberPermission
            groupId={groupId}
            onClose={() => setShowGroupSettings(false)}
            initialSettings={groupDetails?.settings}
            onSettingsUpdate={(settings) => {
              if (onRefreshGroup) {
                onRefreshGroup();
              }
            }}

            
          />
        </div>
      )}


    </>
  );
}