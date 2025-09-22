"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const PdfPreview = dynamic(
  () => import("@/components/PdfPreview").then((m) => m.PdfPreview),
  { ssr: false }
);

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      setError(null);
    } else {
      setError("Please upload a PDF file.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/pdf": [".pdf"] },
  });

  const fileUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  async function onUpload() {
    if (!file) return;
    setIsUploading(true);
    const supabase = getBrowserSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }
    const userId = userData.user.id;
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error: uploadError, data } = await supabase.storage
      .from("resumes")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      setError(uploadError.message);
      setIsUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("resumes")
      .getPublicUrl(data.path);
    await fetch("/api/resumes/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_url: urlData.publicUrl, status: "Pending" }),
    });
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-3xl py-10 px-4 space-y-6">
      <h1 className="text-2xl font-semibold">Upload resume</h1>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded p-10 text-center ${
          isDragActive ? "bg-gray-50" : ""
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the PDF here...</p>
        ) : (
          <p>Drag 'n' drop a PDF here, or click to select file</p>
        )}
      </div>
      {fileUrl && <PdfPreview fileUrl={fileUrl} />}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={!file || isUploading}
        onClick={onUpload}
        className="rounded bg-black text-white px-4 py-2 disabled:opacity-50"
      >
        {isUploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
