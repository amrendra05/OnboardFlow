import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Clock, CheckCircle, TrendingUp, Calendar } from "lucide-react";
import type { Employee } from "@shared/schema";

export default function Analytics() {
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/onboarding/stats"],
  });

  // Calculate analytics data
  const totalEmployees = employees.length;
  const completedOnboarding = employees.filter(emp => emp.onboardingStage === "Completed").length;
  const inProgress = employees.filter(emp => emp.onboardingStage !== "Completed").length;
  
  // Department breakdown
  const departmentCounts = employees.reduce((acc: Record<string, number>, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {});

  // Stage breakdown
  const stageCounts = employees.reduce((acc: Record<string, number>, emp) => {
    acc[emp.onboardingStage] = (acc[emp.onboardingStage] || 0) + 1;
    return acc;
  }, {});

  const completionRate = totalEmployees > 0 ? (completedOnboarding / totalEmployees) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
            <p className="text-muted-foreground">Insights into onboarding performance and trends</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="metric-total-employees">{totalEmployees}</div>
                <p className="text-xs text-muted-foreground">Active in system</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="metric-in-progress">{inProgress}</div>
                <p className="text-xs text-muted-foreground">Currently onboarding</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="metric-completed">{completedOnboarding}</div>
                <p className="text-xs text-muted-foreground">Fully onboarded</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="metric-completion-rate">{completionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Overall success rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Department Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(departmentCounts).map(([dept, count]: [string, any]) => (
                  <div key={dept} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{dept}</span>
                      <Badge variant="secondary">{count} employees</Badge>
                    </div>
                    <Progress 
                      value={totalEmployees > 0 ? (count / totalEmployees) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Stage Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Stage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stageCounts).map(([stage, count]: [string, any]) => (
                  <div key={stage} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{stage}</span>
                      <Badge variant="outline">{count} employees</Badge>
                    </div>
                    <Progress 
                      value={totalEmployees > 0 ? (count / totalEmployees) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.slice(0, 5).map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-foreground">
                          {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.department} • {employee.position}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{employee.onboardingStage}</Badge>
                  </div>
                ))}
                {employees.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No employees added yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add your first employee to see analytics data
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">AI Recommendations</h4>
                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    {completionRate < 50 && (
                      <p>• Consider reviewing onboarding processes to improve completion rates</p>
                    )}
                    {inProgress > completedOnboarding && (
                      <p>• Focus on supporting employees currently in the onboarding pipeline</p>
                    )}
                    {Object.keys(departmentCounts).length > 0 && (
                      <p>• {Object.keys(departmentCounts)[0]} department has the most new hires</p>
                    )}
                    {totalEmployees === 0 && (
                      <p>• Start by adding your first employee to begin tracking onboarding metrics</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}