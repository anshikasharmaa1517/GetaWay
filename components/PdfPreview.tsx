"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Use CDN worker to avoid CORS issues with blob URLs
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export function PdfPreview({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded border p-4">
      <h2 className="font-medium mb-2">Preview</h2>
      {error ? (
        <div className="text-red-600 text-sm p-4 bg-red-50 rounded">
          Failed to load PDF: {error}
        </div>
      ) : (
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            setError(null);
          }}
          onLoadError={(error) => {
            console.error("PDF load error:", error);
            setError(error.message || "Unknown error");
          }}
          options={{
            cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
          }}
        >
          <Page pageNumber={1} width={600} />
        </Document>
      )}
      <p className="text-sm text-gray-600 mt-2">Pages: {numPages}</p>
    </div>
  );
}
