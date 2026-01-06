"use client";

import { useState, useEffect } from "react";
import { FileText, Download, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

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

  const handleDownload = (document: OrderDocument) => {
    window.open(document.download_url, '_blank');
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
        <div className="border-t border-blue-200 bg-white p-3 space-y-2">
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
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
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
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View document"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <a
                    href={doc.download_url}
                    download={doc.file_name}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Download document"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
