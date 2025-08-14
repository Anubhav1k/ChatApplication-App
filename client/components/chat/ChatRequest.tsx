import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { User } from "@shared/types";
import { BaseUrl } from "@/constant";

interface ChatRequestProps {
  selectedUser: User;
  chatId: string;
  fetchUsers?: () => void;
  onApproved?: () => void;
}

export function ChatRequest({ selectedUser, chatId, onApproved ,fetchUsers}: ChatRequestProps) {

    
  const handleApproval = async (approve: boolean) => {
    try {
      const response = await fetch(`${BaseUrl}/api/chat/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
        body: JSON.stringify({ chatId, approve }),
      });

      if (!response.ok) throw new Error("Failed to process chat request");
      onApproved?.();
    } catch (error) {
      console.error("Chat request error:", error);
    }
    selectedUser.isAllowed = true; 
    fetchUsers(); 
  };

  const renderAlert = (title: string, description: React.ReactNode) => (
    <Alert variant="default" className="mb-6 bg-gray-100 border border-gray-200">
      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
      <div className="flex-1">
        <AlertTitle className="text-sm font-medium">{title}</AlertTitle>
        <AlertDescription className="text-sm text-gray-600 mt-1">
          {description}
        </AlertDescription>
      </div>
    </Alert>
  );

  return (
    <div className="flex items-center justify-center h-96">
      <div className="w-full max-w-xl">
        {!selectedUser?.isRequested ? (
          <>
            {renderAlert(
              "You haven’t communicated with this person before",
              <>
                Messages from unknown or unexpected people could be spam or phishing attempts.
                Never share your account information or authorize sign-in requests over chat.
                <br />
                <span className="text-gray-500 mt-2 block">
                  Note: This person is not sharing their email in Teams. To be safe, preview their messages.
                </span>
              </>
            )}

            <div className="flex justify-center space-x-4 mb-4">
              <Button
                variant="outline"
                className="bg-white text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => handleApproval(false)}
              >
                Block
              </Button>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => handleApproval(true)}
              >
                Accept
              </Button>
            </div>
          </>
        ) : (
          renderAlert(
            "Your chat request is pending",
            <>
              You’ve sent a request to this person but they haven’t accepted it yet.
              Please wait until they approve your chat request.
              <br />
              <span className="text-gray-500 mt-2 block">
                Note: Until approved, you can’t send messages in this conversation.
              </span>
            </>
          )
        )}
      </div>
    </div>
  );
}
