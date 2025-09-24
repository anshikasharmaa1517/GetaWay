"use client";

export function PdfPreview({ fileUrl }: { fileUrl: string }) {
  return (
    <div className="rounded border p-4">
      <h2 className="font-medium mb-2">Preview</h2>
      <div className="w-full h-96 border rounded overflow-hidden">
        <iframe
          src={fileUrl}
          className="w-full h-full"
          title="PDF Preview"
          style={{ border: "none" }}
        />
      </div>
      <p className="text-sm text-gray-600 mt-2 text-center">
        PDF Preview - Ready to upload
      </p>
    </div>
  );
}
