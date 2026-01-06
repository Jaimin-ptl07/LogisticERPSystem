"use client";

import { useState, useEffect } from "react";
import { FileText, Download, ExternalLink, ChevronDown, ChevronUp, X, Eye } from "lucide-react";

interface OrderDocument {
  id: string;
  order_id: string;
  document_type: string;
  title: string;
  description: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  download_url: string;
  created_at: string;
  uploaded_by: string;
}

interface DocumentsResponse {
  documents: OrderDocument[];
  total: number;
}

interface OrderDocumentsViewerProps {
  orderId: string;
}

export function OrderDocumentsViewer({ orderId }: OrderDocumentsViewerProps) {
  const [documents, setDocuments] = useState<OrderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<OrderDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [orderId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call orders service to get delivery documents
      const response = await fetch(
        `/api/orders/${orderId}/documents/delivery-proof`
      );

      // Handle all non-OK responses gracefully
      if (!response.ok) {
        console.log(`Documents fetch returned ${response.status} for order ${orderId}`);
        setDocuments([]);
        return;
      }

      const data: DocumentsResponse = await response.json();
      console.log('API Response:', data);
      console.log('Documents from API:', data.documents);
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      // Don't set error for missing documents, just return empty array
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') {
      return <span className="text-red-600 font-bold">PDF</span>;
    }
    if (mimeType.startsWith('image/')) {
      return <span className="text-blue-600 font-bold">IMG</span>;
    }
    return <FileText className="w-4 h-4 text-gray-600" />;
  };

  const handleDownload = async (doc: OrderDocument) => {
    try {
      // Check if it's a presigned MinIO URL (contains X-Amz-Signature)
      const isPresignedUrl = doc.download_url.includes('X-Amz-Signature') ||
                            doc.download_url.includes('localhost:9000') ||
                            doc.download_url.includes('minio:');

      let response: Response;

      if (isPresignedUrl) {
        // For presigned URLs, fetch directly without auth headers
        response = await fetch(doc.download_url);
      } else {
        // For API routes, include auth headers
        response = await fetch(doc.download_url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
          }
        });
      }

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handlePreview = async (doc: OrderDocument) => {
    try {
      // Check if it's a presigned MinIO URL
      const isPresignedUrl = doc.download_url.includes('X-Amz-Signature') ||
                            doc.download_url.includes('localhost:9000') ||
                            doc.download_url.includes('minio:');

      let url: string;

      if (isPresignedUrl) {
        // Use presigned URL directly
        url = doc.download_url;
      } else {
        // For API routes, fetch with auth and create object URL
        const response = await fetch(doc.download_url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load file');
        }

        const blob = await response.blob();
        url = window.URL.createObjectURL(blob);
      }

      setPreviewUrl(url);
      setPreviewDoc(doc);
    } catch (error) {
      console.error('Error previewing file:', error);
    }
  };

  const closePreview = () => {
    // Revoke object URL if it's one (starts with blob:)
    if (previewUrl && previewUrl.startsWith('blob:')) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewDoc(null);
  };

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  const isPdf = (mimeType: string) => {
    return mimeType === 'application/pdf';
  };

  const toggleImagePreview = (doc: OrderDocument) => {
    if (previewDoc?.id === doc.id) {
      // If already previewing this image, close it
      closePreview();
    } else {
      // Otherwise, preview this image
      handlePreview(doc);
    }
  };

  if (loading) {
    return (
      <div className="border border-blue-200 rounded-lg bg-blue-50 overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Loading documents...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border border-blue-200 rounded-lg bg-blue-50 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              Delivery Documents {documents.length > 0 && `(${documents.length})`}
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-blue-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-blue-600" />
          )}
        </button>

        {/* Documents List */}
        {expanded && (
          <div className="border-t border-blue-200 bg-white p-3 space-y-3">
            {documents.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No delivery documents uploaded yet</p>
                <p className="text-xs text-gray-400 mt-1">Documents will appear here after driver uploads delivery proof</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Document Header */}
                  <div className="flex items-center justify-between p-3 bg-gray-50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {getFileIcon(doc.mime_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{doc.file_name}</span>
                          <span>•</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                          {doc.created_at && (
                            <>
                              <span>•</span>
                              <span>
                                {new Date(doc.created_at).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {isImage(doc.mime_type) ? (
                        <button
                          onClick={() => toggleImagePreview(doc)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Toggle preview"
                        >
                          {previewDoc?.id === doc.id ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePreview(doc)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Preview document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download document"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Image Preview */}
                  {isImage(doc.mime_type) && previewDoc?.id === doc.id && previewUrl && (
                    <div className="p-2 bg-white border-t border-gray-200">
                      <img
                        src={previewUrl}
                        alt={doc.title}
                        className="max-w-full h-auto max-h-96 mx-auto rounded"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Preview Modal for PDF and other files */}
      {previewDoc && !isImage(previewDoc.mime_type) && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold truncate">{previewDoc.title}</h3>
              <button
                onClick={closePreview}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4">
              {isPdf(previewDoc.mime_type) ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full min-h-[70vh] rounded"
                  title={previewDoc.title}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                  <button
                    onClick={() => handleDownload(previewDoc)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
