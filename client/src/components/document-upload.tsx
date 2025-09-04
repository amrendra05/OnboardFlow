import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, FileText, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
}

export default function DocumentUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Simulate file processing
      const fileData = {
        name: file.name,
        size: file.size,
        progress: 0,
        status: "uploading" as const,
      };

      setUploadedFiles((prev) => [...prev, fileData]);

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setUploadedFiles((prev) =>
          prev.map((f) => (f.name === file.name ? { ...f, progress: i } : f))
        );
      }

      // Switch to processing
      setUploadedFiles((prev) =>
        prev.map((f) => (f.name === file.name ? { ...f, status: "processing" } : f))
      );

      // Create document record
      const response = await apiRequest("POST", "/api/documents", {
        title: file.name.replace(/\.[^/.]+$/, ""),
        content: `Content extracted from ${file.name}`,
        fileType: file.name.split(".").pop()?.toUpperCase() || "UNKNOWN",
        category: "training",
        tags: ["onboarding", "document"],
      });

      return response.json();
    },
    onSuccess: (data, file) => {
      setUploadedFiles((prev) =>
        prev.map((f) => (f.name === file.name ? { ...f, status: "completed" } : f))
      );
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document uploaded successfully",
        description: `${file.name} has been processed and added to the knowledge base.`,
      });
    },
    onError: (error, file) => {
      setUploadedFiles((prev) =>
        prev.map((f) => (f.name === file.name ? { ...f, status: "error" } : f))
      );
      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowedExtensions = ['.pdf', '.docx', '.pptx', '.ppt', '.odp', '.txt'];
    
    files.forEach((file) => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        toast({
          title: "File type not supported",
          description: `${file.name} is not a supported file type. Please upload PDF, DOCX, PPTX, PPT, ODP, or TXT files.`,
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB. Please choose a smaller file.`,
          variant: "destructive",
        });
        return;
      }
      
      uploadMutation.mutate(file);
    });
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const allowedExtensions = ['.pdf', '.docx', '.pptx', '.ppt', '.odp', '.txt'];
    
    files.forEach((file) => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        toast({
          title: "File type not supported",
          description: `${file.name} is not a supported file type. Please upload PDF, DOCX, PPTX, PPT, ODP, or TXT files.`,
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB. Please choose a smaller file.`,
          variant: "destructive",
        });
        return;
      }
      
      uploadMutation.mutate(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Processing</CardTitle>
        <p className="text-sm text-muted-foreground">
          AI processes and indexes uploaded documents for smart retrieval
        </p>
      </CardHeader>
      <CardContent>
        {/* Upload Area */}
        <div
          data-testid="upload-area"
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <CloudUpload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">Drop files here or click to upload</p>
          <p className="text-sm text-muted-foreground">Support for PDF, DOCX, PPTX, PPT, ODP, and TXT files</p>
          <Button className="mt-4" data-testid="button-select-files">
            Select Files
          </Button>
          <input
            id="file-input"
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Processing Status */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium text-foreground">Recent Uploads</h4>
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                data-testid={`uploaded-file-${index}`}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.status === "uploading" && "Uploading..."}
                      {file.status === "processing" && "Processing... AI extracting key concepts"}
                      {file.status === "completed" && "Processing complete"}
                      {file.status === "error" && "Upload failed"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.status === "uploading" && (
                    <>
                      <Progress value={file.progress} className="w-16" />
                      <span className="text-xs text-muted-foreground">{file.progress}%</span>
                    </>
                  )}
                  {file.status === "processing" && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  {file.status === "completed" && (
                    <span className="text-xs text-green-500 font-medium">✓ Complete</span>
                  )}
                  {file.status === "error" && (
                    <span className="text-xs text-red-500 font-medium">✗ Error</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
