import { useState, useEffect } from "react";
import { User } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { BaseUrl } from "@/constant";

interface OrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  allUsers: User[];
  existingContacts: User[];
  onContactAdded: () => void;
}

export const OrganizationModal = ({
  isOpen,
  onClose,
  allUsers,
  existingContacts,
  onContactAdded,
}: OrganizationModalProps) => {
  const [emailSearch, setEmailSearch] = useState("");
  const [filteredEmails, setFilteredEmails] = useState<User[]>([]);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);

  useEffect(() => {
    if (emailSearch.trim().length >= 2) {
      const filtered = allUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(emailSearch.toLowerCase()) &&
          !existingContacts.some(
            (existingUser) => existingUser._id === user._id,
          ),
      );
      setFilteredEmails(filtered);
    } else {
      setFilteredEmails([]);
    }
  }, [emailSearch, allUsers, existingContacts]);

  const handleAddExternalContact = async () => {
    if (!selectedContact) return;

    try {
      const response = await fetch(`${BaseUrl}/api/create/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
        body: JSON.stringify({
          userId: selectedContact._id,
        }),
      });

      if (response.ok) {
        handleClose();
        onContactAdded();
      } else {
        console.error("Failed to add external contact:", await response.text());
      }
    } catch (error) {
      console.error("Failed to add external contact:", error);
    }
  };

  const handleClose = () => {
    setEmailSearch("");
    setFilteredEmails([]);
    setSelectedContact(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
           Add Organization Member

          </h2>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
          Members refer to people who work at your department, company, or organization.
          </p>

          <div className="flex border-b">
            <button className="px-4 py-2 text-sm font-medium border-b-2 border-blue-500 text-blue-600">
              Email
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Enter email address"
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {emailSearch.length >= 2 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredEmails.length > 0 ? (
                filteredEmails.map((user) => (
                  <div
                    key={user._id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                      selectedContact?._id === user._id
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedContact(user)}
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {user.username}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    {selectedContact?._id === user._id && (
                      <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No contacts found
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddExternalContact}
            disabled={!selectedContact}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
