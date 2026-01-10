import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { documents } from '@/lib/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  File,
  MoreHorizontal,
  Download,
  Trash2,
  Eye,
  Clock,
  CloudUpload
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const getFileIcon = (filename: string) => {
  if (filename.endsWith('.pdf')) return <FileText className="w-4 h-4 text-red-500" strokeWidth={1.75} />;
  if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return <FileSpreadsheet className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />;
  if (filename.endsWith('.docx') || filename.endsWith('.doc')) return <FileText className="w-4 h-4 text-blue-600" strokeWidth={1.75} />;
  return <File className="w-4 h-4 text-gray-500" strokeWidth={1.75} />;
};

export default function Documents() {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const isEmpty = documents.length === 0;

  return (
    <div className="max-w-[1200px] mx-auto space-y-6" data-testid="page-documents">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight">Documents</h1>
          <p className="text-[13px] text-[#6B7280] mt-1">Source documents for security assessment</p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-[13px] font-medium shadow-sm" data-testid="button-upload-documents">
          <Upload className="w-3.5 h-3.5" strokeWidth={2} />
          Upload Documents
        </Button>
      </div>

      <div
        className={`border-2 border-dashed rounded-[14px] p-8 transition-colors ${
          isDragging 
            ? 'border-[#0F766E] bg-[#0F766E]/5' 
            : 'border-[#E5E7EB] bg-white'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="upload-zone"
      >
        <div className="flex flex-col items-center text-center">
          <CloudUpload className="w-8 h-8 text-[#9CA3AF] mb-3" strokeWidth={1.5} />
          <p className="text-[13px] text-[#374151] mb-2">
            Upload security source documents (PDF, DOCX, XLSX)
          </p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-red-50 text-red-700 text-[11px] font-medium">PDF</span>
            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-[11px] font-medium">DOCX</span>
            <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[11px] font-medium">XLSX</span>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-12 shadow-sm" data-testid="empty-state">
          <div className="flex flex-col items-center text-center">
            <FileText className="w-10 h-10 text-[#D1D5DB] mb-3" strokeWidth={1.5} />
            <p className="text-[14px] font-medium text-[#374151] mb-1">No documents uploaded</p>
            <p className="text-[13px] text-[#6B7280] mb-4">Upload security policies to begin assessment</p>
            <Button size="sm" className="h-8 gap-1.5 text-[13px] font-medium shadow-sm" data-testid="button-upload-empty">
              <Upload className="w-3.5 h-3.5" strokeWidth={2} />
              Upload Documents
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Filename</th>
                <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Version</th>
                <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Uploaded</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {documents.map((doc) => (
                <tr 
                  key={doc.id} 
                  className="hover:bg-[#F9FAFB] transition-colors"
                  data-testid={`document-row-${doc.id}`}
                >
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.filename)}
                      <span className="text-[13px] font-medium text-[#111827]">{doc.filename}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-[13px] text-[#6B7280]">{doc.type}</td>
                  <td className="py-3 px-5 text-[13px] font-mono text-[#6B7280]">{doc.version}</td>
                  <td className="py-3 px-5"><StatusBadge status={doc.status} /></td>
                  <td className="py-3 px-5 text-[13px] text-[#6B7280]">{doc.uploadedDate}</td>
                  <td className="py-3 px-5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 hover:bg-[#F3F4F6] rounded-md transition-colors" data-testid={`button-actions-${doc.id}`}>
                          <MoreHorizontal className="w-4 h-4 text-[#9CA3AF]" strokeWidth={1.75} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem className="text-[13px]" data-testid={`action-view-${doc.id}`}>
                          <Eye className="w-4 h-4 mr-2" strokeWidth={1.75} />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[13px]" data-testid={`action-download-${doc.id}`}>
                          <Download className="w-4 h-4 mr-2" strokeWidth={1.75} />
                          Download original
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[13px]" data-testid={`action-status-${doc.id}`}>
                          <Clock className="w-4 h-4 mr-2" strokeWidth={1.75} />
                          View parsing status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className={`text-[13px] ${doc.usedInAssessment ? 'text-[#9CA3AF] cursor-not-allowed' : 'text-red-600'}`}
                          disabled={doc.usedInAssessment}
                          data-testid={`action-remove-${doc.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.75} />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="px-5 py-3 border-t border-[#E5E7EB]">
            <p className="text-[11px] text-[#9CA3AF]">
              Documents are versioned and locked once referenced in an assessment.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
