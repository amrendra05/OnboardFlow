import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, Users, Clock, GraduationCap, Brain, FileText, Upload, TrendingUp } from "lucide-react";
import ChatAssistant from "@/components/chat-assistant";
import EmployeeProgress from "@/components/employee-progress";
import DocumentUpload from "@/components/document-upload";
import OnboardingWorkflow from "@/components/onboarding-workflow";

export default function Dashboard() {
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/onboarding/stats"],
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["/api/documents"],
  });

  const kpiData = [
    {
      title: "Active Onboarding",
      value: stats?.activeOnboarding || 0,
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Avg. Time Saved",
      value: "4.2 days",
      icon: Clock,
      color: "bg-green-500/10 text-green-500",
    },
    {
      title: "Completion Rate",
      value: `${stats?.avgCompletionRate || 0}%`,
      icon: GraduationCap,
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      title: "AI Interactions",
      value: "1,247",
      icon: Brain,
      color: "bg-purple-500/10 text-purple-500",
    },
  ];

  const recentDocs = documents.slice(0, 3);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">AI-Powered Onboarding Dashboard</h2>
            <p className="text-muted-foreground">Streamline employee onboarding with intelligent automation</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                data-testid="input-search-knowledge"
                type="search"
                placeholder="Search knowledge base..."
                className="w-80 pl-10"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full"></span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiData.map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <Card key={index} data-testid={`card-kpi-${kpi.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${kpi.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-muted-foreground">{kpi.title}</p>
                        <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Employee Progress and Knowledge */}
            <div className="lg:col-span-2 space-y-6">
              <EmployeeProgress employees={employees} />
              
              {/* Knowledge Repository */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Knowledge Repository</CardTitle>
                      <CardDescription>Access company documents and project information</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" data-testid="button-upload-docs">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Docs
                      </Button>
                      <Button size="sm" data-testid="button-manage-knowledge">
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Search Knowledge */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      data-testid="input-search-policies"
                      type="search"
                      placeholder="Search policies, procedures, project docs..."
                      className="pl-10"
                    />
                  </div>

                  {/* Knowledge Categories */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card className="hover:bg-muted/50 cursor-pointer transition-colors" data-testid="card-policies">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-6 w-6 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">Policies</p>
                            <p className="text-xs text-muted-foreground">47 documents</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="hover:bg-muted/50 cursor-pointer transition-colors" data-testid="card-projects">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <TrendingUp className="h-6 w-6 text-green-500" />
                          <div>
                            <p className="font-medium text-foreground">Projects</p>
                            <p className="text-xs text-muted-foreground">124 documents</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Documents */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Recently Accessed</h4>
                    {recentDocs.map((doc) => (
                      <div
                        key={doc.id}
                        data-testid={`doc-${doc.title.toLowerCase().replace(/\s+/g, '-')}`}
                        className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
                      >
                        <FileText className="h-4 w-4 text-red-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Updated {new Date(doc.updatedAt || "").toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary">{doc.fileType}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - AI Assistant and Actions */}
            <div className="space-y-6">
              <ChatAssistant />

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    data-testid="button-new-employee"
                  >
                    <Users className="h-5 w-5 text-primary mr-3" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">New Employee</p>
                      <p className="text-xs text-muted-foreground">Start onboarding process</p>
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    data-testid="button-upload-documents"
                  >
                    <Upload className="h-5 w-5 text-green-500 mr-3" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Upload Documents</p>
                      <p className="text-xs text-muted-foreground">Add to knowledge base</p>
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    data-testid="button-view-analytics"
                  >
                    <TrendingUp className="h-5 w-5 text-purple-500 mr-3" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">View Analytics</p>
                      <p className="text-xs text-muted-foreground">Onboarding insights</p>
                    </div>
                  </Button>
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-green-500/10 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-start space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Optimization Suggestion</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Consider splitting security training into smaller modules to improve completion rates.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-primary">
                    <div className="flex items-start space-x-2">
                      <Brain className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Trending Questions</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Most asked: "How to access project documentation?" - Consider adding a quick guide.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Onboarding Workflow */}
          <OnboardingWorkflow />

          {/* Document Processing and Knowledge Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DocumentUpload />

            {/* Contextual Knowledge */}
            <Card>
              <CardHeader>
                <CardTitle>Contextual Knowledge</CardTitle>
                <CardDescription>AI-powered search results based on employee role and current tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: "Software Development Guidelines",
                      description: "Comprehensive coding standards and best practices for new developers...",
                      relevance: 95,
                      icon: "code",
                    },
                    {
                      title: "Project Alpha Technical Stack",
                      description: "NodeJS, MongoDB setup guide and architectural overview...",
                      relevance: 89,
                      icon: "project",
                    },
                    {
                      title: "Security Protocols",
                      description: "Essential security measures for development team members...",
                      relevance: 82,
                      icon: "security",
                    },
                  ].map((result, index) => (
                    <div
                      key={index}
                      data-testid={`knowledge-result-${index}`}
                      className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <FileText className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-foreground mb-1">{result.title}</h4>
                          <p className="text-xs text-muted-foreground mb-2">{result.description}</p>
                          <div className="flex items-center space-x-4">
                            <Badge variant="secondary">{result.relevance}% relevance</Badge>
                            <span className="text-xs text-muted-foreground">Updated 1 week ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
