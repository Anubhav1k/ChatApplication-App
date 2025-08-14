import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users, UsersRound, UserRoundPlus } from "lucide-react";

interface AddMenuDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewGroup: () => void;
  onAddExternalContact: () => void;
  onOrganizationmember: () => void;
}

export const AddMenuDropdown = ({
  isOpen,
  onToggle,
  onNewGroup,
  onAddExternalContact,
  onOrganizationmember,
}: AddMenuDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onToggle();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div className=" relative flex justify-end" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="w-5 h-5 p-0 rounded-full hover:bg-gray-100"
      >
        <Plus className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute top-8 -right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 w-60">
          <div
            className="text-sm text-gray-700 hover:bg-gray-50 px-3 py-2 rounded w-full text-left cursor-pointer flex items-center gap-2"
            onClick={() => {
              onToggle();
              onNewGroup();
            }}
          >
            <Users className="w-4 h-4" />
            New Group
          </div>

          <div className="text-sm text-gray-700 hover:bg-gray-50 px-3 py-2 rounded w-full text-left cursor-pointer flex items-center gap-2"
             onClick={() => {
              onToggle();
              onOrganizationmember();
            }}
          >
            <UsersRound className="w-4 h-4" />
            Add Organization Member
          </div>

          <div
            className="text-sm text-gray-700 hover:bg-gray-50 px-3 py-2 rounded w-full text-left cursor-pointer flex items-center gap-2"
            onClick={() => {
              onToggle();
              onAddExternalContact();
            }}
          >
            <UserRoundPlus className="w-4 h-4" />
            Add External Contact
          </div>
        </div>
      )}
    </div>
  );
};
