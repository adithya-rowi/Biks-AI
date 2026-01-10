import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  MoreVertical,
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
  if (filename.endsWith('.pdf')) return <FileText className="w-5 h-5 text-red-500" />;
  if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
  if (filename.endsWith('.docx') || filename.endsWith('.doc')) return <FileText className="w-5 h-5 text-blue-600" />;
  return <File className="w-5 h-5 text-slate-500" />;
};

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocuments = documents.filter(doc =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="page-documents">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage your compliance documentation</p>
        </div>
        <Button className="gap-2 shadow-md" data-testid="button-upload-document">
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">All Documents</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-documents"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Filename</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Uploaded</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">By</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr 
                    key={doc.id} 
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                    data-testid={`document-row-${doc.id}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.filename)}
                        <span className="text-sm font-medium">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{doc.type}</td>
                    <td className="py-3 px-4"><StatusBadge status={doc.status} /></td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{doc.uploadedDate}</td>
                    <td className="py-3 px-4 text-sm">{doc.uploadedBy}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{doc.size}</td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-actions-${doc.id}`}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No documents found</h3>
              <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search query</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
