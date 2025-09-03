import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Upload, FileText, Filter } from "lucide-react";

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: documents = [] } = useQuery({
    queryKey: ["/api/documents", { search: searchQuery, category: selectedCategory === "all" ? undefined : selectedCategory }],
  });

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
          <Button data-testid="button-upload-document">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
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
    </div>
  );
}
