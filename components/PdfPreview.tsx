"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Use a locally served worker to avoid CORS/dynamic import issues
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export function PdfPreview({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);

  return (
    <div className="rounded border p-4">
      <h2 className="font-medium mb-2">Preview</h2>
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      >
        <Page pageNumber={1} width={600} />
      </Document>
      <p className="text-sm text-gray-600 mt-2">Pages: {numPages}</p>
    </div>
  );
}
