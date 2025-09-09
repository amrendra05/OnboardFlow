import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Building, 
  Briefcase, 
  Calendar, 
  FileText, 
  Clock,
  CheckCircle,
  Circle
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import type { Employee, OnboardingProgress, EmployeeDocument } from "../../../shared/schema.js";

interface EmployeeWithDetails extends Employee {
  onboardingProgress?: OnboardingProgress[];
  documents?: EmployeeDocument[];
}

export default function EmployeeDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const { data: employee, isLoading } = useQuery<EmployeeWithDetails>({
    queryKey: ["/api/employees", id],
  });

  const { data: documents = [] } = useQuery<EmployeeDocument[]>({
    queryKey: ["/api/employees", id, "documents"],
  });

  const { data: progress } = useQuery<OnboardingProgress>({
    queryKey: ["/api/employees", id, "progress"],
  });

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "pre-boarding":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "first-day":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "training":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "integration":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatStage = (stage: string) => {
    return stage.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/onboarding-list")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading employee details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col h-full">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/onboarding-list")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Employee Not Found</h3>
            <p className="text-muted-foreground">The employee you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/onboarding-list")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{employee.name}</h2>
              <p className="text-muted-foreground">{employee.position} • {employee.department}</p>
            </div>
          </div>
          <Badge 
            className={getStageColor(progress?.stage || employee.onboardingStage)} 
            data-testid="employee-stage"
          >
            {formatStage(progress?.stage || employee.onboardingStage)}
          </Badge>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Employee Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Employee Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Email</p>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Department</p>
                      <p className="text-sm text-muted-foreground">{employee.department}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Position</p>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Start Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(employee.startDate), "MMMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Progress */}
          {progress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Onboarding Progress</span>
                  </div>
                  <span className="text-sm font-medium">{progress.completionPercentage}% Complete</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progress.completionPercentage} className="h-3" />
                
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Tasks</h4>
                  {progress.tasks.map((task, index) => (
                    <div key={task.id} className="flex items-center space-x-3 p-2 rounded-lg bg-muted">
                      {task.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.name}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground">{task.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {progress.lastUpdated && (
                  <p className="text-sm text-muted-foreground">
                    Last updated: {format(new Date(progress.lastUpdated), "MMM dd, yyyy 'at' h:mm a")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Documents</span>
                </div>
                <Badge variant="secondary">{documents.length} files</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{doc.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {(doc.fileSize / 1024).toFixed(1)} KB • {doc.fileType} • {format(new Date(doc.uploadedAt), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {doc.fileType.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No documents uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}