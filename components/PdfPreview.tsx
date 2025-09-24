"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Use a working CDN worker
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

export function PdfPreview({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  return (
    <div className="rounded border p-4">
      <h2 className="font-medium mb-2">Preview</h2>
      {error ? (
        <div className="text-red-600 text-sm p-4 bg-red-50 rounded">
          Failed to load PDF: {error}
        </div>
      ) : (
        <div>
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2 text-gray-600">Loading PDF...</span>
            </div>
          )}
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
              setError(null);
              setLoading(false);
            }}
            onLoadError={(error) => {
              console.error("PDF load error:", error);
              setError(error.message || "Could not load PDF");
              setLoading(false);
            }}
            loading=""
          >
            <Page 
              pageNumber={1} 
              width={600}
              loading=""
            />
          </Document>
        </div>
      )}
      {numPages && (
        <p className="text-sm text-gray-600 mt-2">Pages: {numPages}</p>
      )}
    </div>
  );
}
