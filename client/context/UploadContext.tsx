import { BaseUrl } from "@/constant";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

const CHUNK_SIZE = 5 * 1024 * 1024; // 1MB
const CONCURRENCY_LIMIT = 3;

type FileData = {
  file?: File;
  files?: File[];
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
};

type ProcessingEntry = {
  id: string; // message ID
  chatId: string;
  status: "Uploading" | "Merging" | "Scanning" | "Uploaded" | "Error";
  progress: number;
  fileName?: string;
  error?: string;
  step?: string;
};

interface UploadContextType {
  processingHistory: ProcessingEntry[];
  handleSendMessage: (
    chatId: string,
    receiverId: string,
    content: string,
    type?: string,
    fileData?: FileData,
    replyTo?: { _id: string },
  ) => Promise<void>;
  cancelUpload: (messageId: string) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [processingHistory, setProcessingHistory] = useState<ProcessingEntry[]>(
    [],
  );

  // Ref to always hold latest state
  const historyRef = useRef<ProcessingEntry[]>([]);
  useEffect(() => {
    historyRef.current = processingHistory;
  }, [processingHistory]);

  const addHistoryEntry = (entry: ProcessingEntry) => {
    setProcessingHistory((prev) => [...prev, entry]);
  };

  const updateHistory = (id: string, updates: Partial<ProcessingEntry>) => {
    setProcessingHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const cancelUpload = (messageId: string) => {
    setProcessingHistory((prev) =>
      prev.filter((entry) => entry.id !== messageId),
    );
  };

  const isMessageActive = (id: string): boolean => {
    const found = historyRef.current.find((entry) => entry.id === id);
    return !!found;
  };

  const handleSendMessage = useCallback(
    async (
      chatId: string,
      receiverId: string,
      content: string,
      type: string = "0",
      fileData?: FileData,
      replyTo?: { _id: string },
    ) => {
      const messageId = `${Date.now()}`;
      try {
        // Handle both single file and multiple files
        let files: File[] = [];
        if (fileData?.files) {
          files = fileData.files; // Multi-file case
        } else if (fileData?.file) {
          files = [fileData.file]; // Single file case (backward compatibility)
        }

        let uploadedFileNames: string[] = [];
        let fileIds: string[] = [];

        if (files.length > 0) {
          addHistoryEntry({
            id: messageId,
            chatId,
            status: "Uploading",
            progress: 0,
            fileName: files.length === 1 ? files[0].name : `${files.length} files`,
            step: "Uploading Files",
          });

          // Upload each file
          for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
            const file = files[fileIndex];
            const fileId = `${file.name}-${Date.now()}-${fileIndex}`;
            fileIds.push(fileId);

            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
            let uploadedBytes = 0;

            // Update progress for current file
            updateHistory(messageId, {
              step: files.length === 1 ? "Uploading File" : `Uploading ${file.name} (${fileIndex + 1}/${files.length})`,
            });

            const uploadChunk = async (chunkIndex: number): Promise<void> => {
              if (!isMessageActive(messageId) && chunkIndex > 10)
                throw new Error("Upload cancelled");

              const start = chunkIndex * CHUNK_SIZE;
              const end = Math.min(file.size, start + CHUNK_SIZE);
              const chunk = file.slice(start, end);

              const chunkForm = new FormData();
              chunkForm.append("fileName", file.name);
              chunkForm.append("fileId", fileId);
              chunkForm.append("fileIndex", fileIndex.toString());
              chunkForm.append("chunkIndex", chunkIndex.toString());
              chunkForm.append("totalChunks", totalChunks.toString());
              chunkForm.append("chunk", chunk);

              return fetch(`${BaseUrl}/api/upload/chunk`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                  "ngrok-skip-browser-warning": "69420",
                },
                body: chunkForm,
              }).then((res) => {
                if (!res.ok) throw new Error(`Chunk ${chunkIndex} upload failed`);

                uploadedBytes += chunk.size;
                const fileProgress = (uploadedBytes / file.size) * 70; // 70% for upload
                const overallProgress = ((fileIndex * 70) + fileProgress) / files.length;
                updateHistory(messageId, { progress: Math.round(overallProgress) });
              });
            };

            // Upload chunks for current file
            for (let i = 0; i < totalChunks; i += CONCURRENCY_LIMIT) {
              const batch = [];
              for (let j = i; j < i + CONCURRENCY_LIMIT && j < totalChunks; j++) {
                batch.push(uploadChunk(j));
              }
              await Promise.all(batch);
            }

            // Merge current file
            if (!isMessageActive(messageId))
              throw new Error("Upload cancelled before merge");

            updateHistory(messageId, {
              step: files.length === 1 ? "Merging File" : `Merging ${file.name}`,
              progress: Math.round(((fileIndex + 1) * 80) / files.length),
              status: "Merging",
            });

            const mergeRes = await fetch(`${BaseUrl}/api/upload/merge`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "ngrok-skip-browser-warning": "69420",
              },
              body: JSON.stringify({ fileId, fileName: file.name }),
            });

            if (!mergeRes.ok) throw new Error("File merge failed");

            const { finalFileName } = await mergeRes.json();
            uploadedFileNames.push(finalFileName);
          }

          // Scanning phase
          updateHistory(messageId, {
            step: "Scanning Files",
            progress: 95,
            status: "Scanning"
          });
          await new Promise((res) => setTimeout(res, 500));
        }

        // Send message
        const formData = new FormData();
        formData.append("content", content);
        formData.append("type", type);
        if (replyTo) {
          formData.append("isReply", "true");
          formData.append("messageId", replyTo._id);
        }

        // Handle multiple files
        if (uploadedFileNames.length > 1) {
          uploadedFileNames.map(item => {
            formData.append("fileName", item);
          })

          fileIds.map(item => {
            formData.append("fileId", item);
          })
          formData.append("multipleFiles", "true");
        } else if (uploadedFileNames.length === 1) {
          // Single file (existing format)
          formData.append("fileName", uploadedFileNames[0]);
          formData.append("fileId", fileIds[0]);
        }

        const response = await fetch(
          `${BaseUrl}/api/chat/${chatId}/message/chunks`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "ngrok-skip-browser-warning": "69420",
            },
            body: formData,
          },
        );

        if (!response.ok) throw new Error("Message send failed");

        if (files.length > 0) {
          updateHistory(messageId, {
            step: "Files Uploaded",
            progress: 100,
            status: "Uploaded",
          });
        }

        cancelUpload(messageId);
      } catch (err: any) {
        console.error(err);
        updateHistory(messageId, {
          status: "Error",
          error: err.message,
          step: "Failed",
        });
      }
    },
    [],
  );

  const value: UploadContextType = {
    processingHistory,
    handleSendMessage,
    cancelUpload,
  };

  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
