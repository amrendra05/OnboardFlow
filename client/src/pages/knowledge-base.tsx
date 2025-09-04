import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Document } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Upload, FileText, Filter, X } from "lucide-react";

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    content: "",
    category: "",
    fileType: "",
    tags: [] as string[],
  });
  const [currentTag, setCurrentTag] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: documents = [] } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      
      const url = `/api/documents${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: typeof uploadForm & { fileContent?: string }) => {
      return apiRequest("POST", "/api/documents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document uploaded successfully",
        description: "Your document has been added to the knowledge base.",
      });
      setUploadDialogOpen(false);
      setUploadForm({
        title: "",
        content: "",
        category: "",
        fileType: "",
        tags: [],
      });
      setSelectedFile(null);
    },
    onError: () => {
      toast({
        title: "Failed to upload document",
        description: "Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddTag = () => {
    if (currentTag.trim() && !uploadForm.tags.includes(currentTag.trim())) {
      setUploadForm(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setUploadForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Supported formats: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Auto-fill form fields based on file
    if (!uploadForm.title) {
      setUploadForm(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
    }
    
    // Auto-detect file type
    const extension = file.name.toLowerCase().split('.').pop();
    let detectedType = "text";
    switch (extension) {
      case 'pdf':
        detectedType = "pdf";
        break;
      case 'doc':
      case 'docx':
        detectedType = "doc";
        break;
      case 'xls':
      case 'xlsx':
        detectedType = "spreadsheet";
        break;
      default:
        detectedType = "text";
    }
    
    if (!uploadForm.fileType) {
      setUploadForm(prev => ({ ...prev, fileType: detectedType }));
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (file.type === 'text/plain' || file.type === 'text/csv') {
          resolve(content);
        } else {
          // For other file types, store the filename and basic info
          resolve(`File: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nType: ${file.type}\n\nContent will be processed when viewing this document.`);
        }
      };
      reader.onerror = reject;
      
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        reader.readAsText(file);
      } else {
        // For binary files, just return metadata
        resolve(`File: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nType: ${file.type}\n\nContent will be processed when viewing this document.`);
      }
    });
  };

  const handleSubmit = async () => {
    if (!uploadForm.title || !uploadForm.category || !uploadForm.fileType) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, category, and file type.",
        variant: "destructive",
      });
      return;
    }

    let finalContent = uploadForm.content;
    
    // If a file is selected, read its content
    if (selectedFile) {
      try {
        const fileContent = await readFileContent(selectedFile);
        finalContent = fileContent;
      } catch (error) {
        toast({
          title: "Failed to read file",
          description: "Please try again or enter content manually.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!finalContent.trim()) {
      toast({
        title: "Missing content",
        description: "Please either upload a file or enter content manually.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      ...uploadForm,
      content: finalContent,
    });
  };

  const handleDocumentClick = (document: Document) => {
    console.log('Document clicked:', document.title);
    console.log('Setting dialog open to true');
    setSelectedDocument(document);
    setViewDialogOpen(true);
    console.log('Dialog state should be:', true);
  };

  const categories = [
    { id: "all", name: "All Documents", count: documents.length },
    { id: "policies", name: "Policies", count: documents.filter(d => d.category === "policies").length },
    { id: "projects", name: "Projects", count: documents.filter(d => d.category === "projects").length },
    { id: "training", name: "Training", count: documents.filter(d => d.category === "training").length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Knowledge Base</h2>
            <p className="text-muted-foreground">Search and manage your company's knowledge repository</p>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-document">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Document title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                      data-testid="input-document-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={uploadForm.category} 
                      onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger data-testid="select-document-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="policies">Policies</SelectItem>
                        <SelectItem value="projects">Projects</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="fileType">File Type *</Label>
                  <Select 
                    value={uploadForm.fileType} 
                    onValueChange={(value) => setUploadForm(prev => ({ ...prev, fileType: value }))}
                  >
                    <SelectTrigger data-testid="select-file-type">
                      <SelectValue placeholder="Select file type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="doc">Document</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="file">Upload File (Optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      id="file"
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                      className="hidden"
                      data-testid="input-file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file')?.click()}
                      data-testid="button-choose-file"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                    {selectedFile && (
                      <div className="mt-2 text-sm text-foreground">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Supports: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX (max 10MB)
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="content">Content {!selectedFile && "*"}</Label>
                  <Textarea
                    id="content"
                    placeholder={selectedFile ? "File content will be automatically extracted..." : "Enter the document content or description..."}
                    value={uploadForm.content}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[120px]"
                    disabled={!!selectedFile}
                    data-testid="textarea-document-content"
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="tags"
                      placeholder="Add a tag"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      data-testid="input-add-tag"
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">
                      Add
                    </Button>
                  </div>
                  {uploadForm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {uploadForm.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                          <span>{tag}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setUploadDialogOpen(false)}
                    data-testid="button-cancel-upload"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={uploadMutation.isPending}
                    data-testid="button-submit-upload"
                  >
                    {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    data-testid="input-search-documents"
                    type="search"
                    placeholder="Search documents, policies, procedures..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" data-testid="button-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Categories and Results */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  data-testid={`tab-${category.id}`}
                  className="flex items-center space-x-2"
                >
                  <span>{category.name}</span>
                  <Badge variant="secondary" className="ml-2">
                    {category.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents
                    .filter(doc => category.id === "all" || doc.category === category.id)
                    .map((document) => (
                      <Card
                        key={document.id}
                        data-testid={`document-${document.id}`}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleDocumentClick(document)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-5 w-5 text-primary" />
                              <Badge variant="outline">{document.fileType}</Badge>
                            </div>
                            <Badge variant="secondary">{document.category}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardTitle className="text-lg mb-2">{document.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                            {document.content.substring(0, 150)}...
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Updated {new Date(document.updatedAt || "").toLocaleDateString()}</span>
                            <div className="flex space-x-1">
                              {document.tags?.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {documents.filter(doc => category.id === "all" || doc.category === category.id).length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No documents found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? "Try adjusting your search terms" : "Upload your first document to get started"}
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Document Viewer Dialog */}
      {viewDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl max-h-[80vh] w-full mx-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span className="font-semibold text-lg">{selectedDocument?.title}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setViewDialogOpen(false)}
                data-testid="button-close-document"
              >
                ✕
              </Button>
            </div>
            
            {selectedDocument && (
              <div className="flex-1 overflow-auto space-y-4 p-6">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground border-b pb-3">
                  <Badge variant="outline">{selectedDocument.fileType}</Badge>
                  <Badge variant="secondary">{selectedDocument.category}</Badge>
                  <span>Updated: {new Date(selectedDocument.updatedAt || "").toLocaleDateString()}</span>
                </div>

                {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedDocument.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Content</h4>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedDocument.content}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end p-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => setViewDialogOpen(false)}
                data-testid="button-close-document-footer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
