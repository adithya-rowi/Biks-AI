import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { documents } from '@/lib/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { 
  Upload, 
  Search, 
  FileText, 
  FileSpreadsheet, 
  File,
  MoreHorizontal,
  Download,
  Trash2,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const getFileIcon = (filename: string) => {
  if (filename.endsWith('.pdf')) return <FileText className="w-4 h-4 text-red-500" strokeWidth={1.75} />;
  if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return <FileSpreadsheet className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />;
  if (filename.endsWith('.docx') || filename.endsWith('.doc')) return <FileText className="w-4 h-4 text-blue-600" strokeWidth={1.75} />;
  return <File className="w-4 h-4 text-gray-500" strokeWidth={1.75} />;
};

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocuments = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto space-y-6" data-testid="page-documents">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight">Documents</h1>
          <p className="text-[13px] text-[#6B7280] mt-1">Evidence and supporting documentation</p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-[13px] font-medium shadow-sm" data-testid="button-upload-document">
          <Upload className="w-3.5 h-3.5" strokeWidth={2} />
          Upload
        </Button>
      </div>

      <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-sm">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" strokeWidth={1.75} />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-[13px] border-[#E5E7EB] bg-[#F9FAFB] focus:bg-white"
              data-testid="input-search-documents"
            />
          </div>
        </div>
        
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Filename</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Type</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Uploaded</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">By</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Size</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {filteredDocuments.map((doc) => (
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
                <td className="py-3 px-5"><StatusBadge status={doc.status} /></td>
                <td className="py-3 px-5 text-[13px] text-[#6B7280]">{doc.uploadedDate}</td>
                <td className="py-3 px-5 text-[13px] text-[#374151]">{doc.uploadedBy}</td>
                <td className="py-3 px-5 text-[13px] text-[#9CA3AF]">{doc.size}</td>
                <td className="py-3 px-5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 hover:bg-[#F3F4F6] rounded-md transition-colors" data-testid={`button-actions-${doc.id}`}>
                        <MoreHorizontal className="w-4 h-4 text-[#9CA3AF]" strokeWidth={1.75} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem className="text-[13px]">
                        <Eye className="w-4 h-4 mr-2" strokeWidth={1.75} />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[13px]">
                        <Download className="w-4 h-4 mr-2" strokeWidth={1.75} />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 text-[13px]">
                        <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.75} />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-[13px] text-[#6B7280]">No documents found</p>
          </div>
        )}
      </div>
    </div>
  );
}
