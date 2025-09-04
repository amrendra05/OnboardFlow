import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Calendar, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import type { Employee, OnboardingProgress, EmployeeDocument } from "@shared/schema";

interface EmployeeWithProgress extends Employee {
  onboardingProgress?: OnboardingProgress[];
  documents?: EmployeeDocument[];
}

export default function OnboardingList() {
  const { data: employees = [], isLoading } = useQuery<EmployeeWithProgress[]>({
    queryKey: ["/api/employees"],
  });

  const { data: allDocuments = [] } = useQuery<EmployeeDocument[]>({
    queryKey: ["/api/employee-documents"],
  });

  // Filter employees who are currently in onboarding (not 100% complete)
  const onboardingEmployees = employees.filter(employee => {
    const progress = employee.onboardingProgress?.[0];
    return progress && progress.completionPercentage < 100;
  });

  const getEmployeeDocuments = (employeeId: string) => {
    return allDocuments.filter(doc => doc.employeeId === employeeId);
  };

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
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Onboarding in Progress</h2>
              <p className="text-muted-foreground">Track employees currently in onboarding</p>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading onboarding data...</p>
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
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Onboarding in Progress</h2>
              <p className="text-muted-foreground">Track employees currently in onboarding</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{onboardingEmployees.length}</p>
            <p className="text-sm text-muted-foreground">Active Onboarding</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {onboardingEmployees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Active Onboarding</h3>
            <p className="text-muted-foreground">All employees have completed their onboarding process.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {onboardingEmployees.map((employee) => {
              const progress = employee.onboardingProgress?.[0];
              const documents = getEmployeeDocuments(employee.id);
              
              return (
                <Card key={employee.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg" data-testid={`employee-name-${employee.id}`}>
                          {employee.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{employee.position}</p>
                        <p className="text-xs text-muted-foreground">{employee.department}</p>
                      </div>
                      {progress && (
                        <Badge className={getStageColor(progress.stage)} data-testid={`stage-${employee.id}`}>
                          {formatStage(progress.stage)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    {progress && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">Progress</span>
                          <span className="text-sm text-muted-foreground" data-testid={`progress-${employee.id}`}>
                            {progress.completionPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${progress.completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Start Date */}
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Started: {format(new Date(employee.startDate), "MMM dd, yyyy")}</span>
                    </div>

                    {/* Last Updated */}
                    {progress?.lastUpdated && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Updated: {format(new Date(progress.lastUpdated), "MMM dd")}</span>
                      </div>
                    )}

                    {/* Documents Section */}
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">Documents</span>
                        </div>
                        <Badge variant="secondary" data-testid={`document-count-${employee.id}`}>
                          {documents.length}
                        </Badge>
                      </div>

                      {documents.length > 0 ? (
                        <div className="space-y-2">
                          {documents.slice(0, 3).map((doc, index) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                            >
                              <div className="flex items-center space-x-2">
                                <FileText className="h-3 w-3 text-primary" />
                                <span className="truncate max-w-[150px]" title={doc.fileName}>
                                  {doc.fileName}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground uppercase">
                                {doc.fileType}
                              </span>
                            </div>
                          ))}
                          {documents.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{documents.length - 3} more documents
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No documents uploaded</p>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      data-testid={`view-details-${employee.id}`}
                      onClick={() => {
                        // Navigate to employee details or documents view
                        window.location.href = `/employees/${employee.id}`;
                      }}
                    >
                      View Details
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}