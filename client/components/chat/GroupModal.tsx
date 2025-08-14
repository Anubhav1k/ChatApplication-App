import { useState, useEffect, ChangeEvent } from "react";
import { User } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Users, Globe, Shield, HelpCircle, Camera, MessageCircle } from "lucide-react";
import { BaseUrl } from "@/constant";

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  allUsers: User[];
}

export const GroupModal = ({ isOpen, onClose, allUsers }: GroupModalProps) => {
  const [groupType, setGroupType] = useState<'Chat' | 'Topic' | 'Secure'>('Chat');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (memberSearch.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      setFilteredUsers(
        allUsers.filter(u =>
          u.username.toLowerCase().includes(memberSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(memberSearch.toLowerCase())
        )
      );
    }
  }, [memberSearch, allUsers]);

  useEffect(() => {
    // Clean up preview URL when component unmounts or file changes
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;

    try {
      const formData = new FormData();
      formData.append('groupName', groupName);
      // formData.append('type', groupType);
      formData.append('groupDescription', groupDescription);
      selectedMembers.forEach(member => {
        formData.append('userIds', member._id);
      });
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch(`${BaseUrl}/api/create/group`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
        body: formData
      });

      if (response.ok) {
        const newGroup = await response.json();
        handleClose();
      } else {
        console.error('Failed to create group:', await response.text());
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const toggleMemberSelection = (user: User) => {
    setSelectedMembers(prev => {
      const isSelected = prev.find(m => m._id === user._id);
      if (isSelected) {
        return prev.filter(m => m._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleClose = () => {
    setGroupName('');
    setGroupDescription('');
    setGroupType('Chat');
    setSelectedMembers([]);
    setMemberSearch('');
    setFile(null);
    setPreviewUrl(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">New Group</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Group Type */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700">Group type</span>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="groupType"
                  value="Chat"
                  checked={groupType === 'Chat'}
                  onChange={(e) => setGroupType(e.target.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <MessageCircle className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Chat</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="groupType"
                  value="Topic"
                  checked={groupType === 'Topic'}
                  onChange={(e) => setGroupType(e.target.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <Globe className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Topic</span>
                <HelpCircle className="w-3 h-3 text-gray-400" />
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="groupType"
                  value="Secure"
                  checked={groupType === 'Secure'}
                  onChange={(e) => setGroupType(e.target.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <Shield className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Secure</span>
                <HelpCircle className="w-3 h-3 text-gray-400" />
              </label>
            </div>
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group name</label>
            <Input
              placeholder="Set group name (required)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Group Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group description</label>
            <Textarea
              placeholder="Add a group description (optional)"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="w-full min-h-[100px]"
            />
          </div>

          {/* Group Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group photo</label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt="Group preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="group-photo-upload"
                />
                <label
                  htmlFor="group-photo-upload"
                  className="text-blue-600 text-sm hover:underline cursor-pointer"
                >
                  {file ? 'Change photo' : 'Upload photo'}
                </label>
                {file && (
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Members Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700">Members</span>
              <HelpCircle className="w-3 h-3 text-gray-400" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search contacts..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>

              <div className="border rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-2">
                  Selected: {selectedMembers.length} members
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredUsers.map((u) => (
                    <div
                      key={u._id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${
                        selectedMembers.find(m => m._id === u._id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleMemberSelection(u)}
                    >
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                        {u.username?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{u.username}</div>
                        <div className="text-gray-500 text-xs truncate">{u.email}</div>
                      </div>
                      {selectedMembers.find(m => m._id === u._id) && (
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            disabled={!groupName.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create (Ctrl+Enter)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};