"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";
import { getBrowserSupabaseClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { AppBar } from "@/components/ui/AppBar";

const PdfPreview = dynamic(
  () => import("@/components/PdfPreview").then((m) => m.PdfPreview),
  { ssr: false }
);

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [reviewer, setReviewer] = useState<{ name: string; slug: string } | null>(null);
  const toReviewer = searchParams.get("to");

  useEffect(() => {
    async function fetchReviewer() {
      if (toReviewer) {
        try {
          const res = await fetch(`/api/reviewers?slug=${encodeURIComponent(toReviewer)}`);
          if (res.ok) {
            const { reviewer: reviewerData } = await res.json();
            setReviewer({ name: reviewerData.display_name || reviewerData.slug, slug: reviewerData.slug });
          }
        } catch (error) {
          console.error("Error fetching reviewer:", error);
        }
      }
    }
    fetchReviewer();
  }, [toReviewer]);

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
    setError(null);
    
    try {
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
        return;
      }
      
      const { data: urlData } = supabase.storage
        .from("resumes")
        .getPublicUrl(data.path);
        
      const response = await fetch("/api/resumes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          file_url: urlData.publicUrl, 
          status: "Pending",
          reviewer_slug: toReviewer 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create resume record");
        return;
      }
      
      // Success - redirect to dashboard
      router.push("/dashboard");
      
    } catch (error) {
      console.error("Upload error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar />
      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 mb-3">
            Upload Resume
          </h1>
          {reviewer && (
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-gray-700">
                Sharing with <span className="font-semibold text-gray-900">{reviewer.name}</span>
              </p>
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors duration-200 cursor-pointer ${
              isDragActive 
                ? "bg-blue-50 border-blue-300" 
                : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              {isDragActive ? (
                <div>
                  <p className="text-lg font-medium text-gray-900">Drop the PDF here</p>
                  <p className="text-sm text-gray-600">Release to upload</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-gray-900">Upload your resume</p>
                  <p className="text-sm text-gray-600">Drag and drop your PDF here, or click to browse</p>
                </div>
              )}
            </div>
          </div>

          {/* File Preview */}
          {fileUrl && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
              <PdfPreview fileUrl={fileUrl} />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-8 flex justify-end">
            <button
              disabled={!file || isUploading}
              onClick={onUpload}
              className="inline-flex items-center justify-center rounded-2xl bg-gray-900 text-white px-8 py-3 text-sm font-semibold shadow-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Resume
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
