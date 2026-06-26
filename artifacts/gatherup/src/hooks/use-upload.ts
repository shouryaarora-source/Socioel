import { useState } from "react";

interface UploadResult {
  objectPath: string;
  servingUrl: string;
}

interface UseUploadOptions {
  onSuccess?: (result: UploadResult) => void;
  onError?: (err: Error) => void;
}

export function useUpload(options?: UseUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function uploadFile(file: File): Promise<UploadResult | null> {
    setIsUploading(true);
    setProgress(0);
    try {
      const metaRes = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });

      if (!metaRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await metaRes.json();

      setProgress(30);

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!putRes.ok) throw new Error("Failed to upload file");

      setProgress(100);
      const result: UploadResult = {
        objectPath,
        servingUrl: `/api/storage${objectPath}`,
      };
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      options?.onError?.(err as Error);
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  async function uploadDataUrl(dataUrl: string, filename: string): Promise<UploadResult | null> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
    return uploadFile(file);
  }

  return { uploadFile, uploadDataUrl, isUploading, progress };
}
