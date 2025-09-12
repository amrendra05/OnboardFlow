import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Clock, CheckCircle, TrendingUp, Calendar, Sparkles, Target, Zap } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
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

  // Chart color palettes
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];
  const GRADIENT_COLORS = {
    total: 'from-blue-500 via-purple-500 to-pink-500',
    progress: 'from-orange-400 via-red-500 to-pink-600',
    completed: 'from-green-400 via-teal-500 to-blue-600',
    rate: 'from-purple-400 via-pink-500 to-red-500'
  };

  // Prepare chart data
  const departmentChartData = Object.entries(departmentCounts).map(([name, value]) => ({ name, value }));
  const stageChartData = Object.entries(stageCounts).map(([name, value]) => ({ name, value }));
  
  // Sample trend data (you can replace with real time-series data)
  const trendData = [
    { month: 'Jan', completed: 5, inProgress: 8 },
    { month: 'Feb', completed: 8, inProgress: 12 },
    { month: 'Mar', completed: 12, inProgress: 15 },
    { month: 'Apr', completed: completedOnboarding, inProgress: inProgress },
  ];

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
          
          {/* Key Metrics - Flashy Gradient Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENT_COLORS.total} opacity-90`} />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Total Employees</CardTitle>
                <div className="bg-white/20 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-white flex items-center" data-testid="metric-total-employees">
                  {totalEmployees}
                  <Sparkles className="h-6 w-6 ml-2 text-yellow-300" />
                </div>
                <p className="text-xs text-white/80 mt-1">Active in system</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENT_COLORS.progress} opacity-90`} />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">In Progress</CardTitle>
                <div className="bg-white/20 p-2 rounded-lg">
                  <Zap className="h-5 w-5 text-white animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-white flex items-center" data-testid="metric-in-progress">
                  {inProgress}
                  <Clock className="h-5 w-5 ml-2 text-orange-200" />
                </div>
                <p className="text-xs text-white/80 mt-1">Currently onboarding</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENT_COLORS.completed} opacity-90`} />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Completed</CardTitle>
                <div className="bg-white/20 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-white flex items-center" data-testid="metric-completed">
                  {completedOnboarding}
                  <Target className="h-5 w-5 ml-2 text-green-200" />
                </div>
                <p className="text-xs text-white/80 mt-1">Fully onboarded</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENT_COLORS.rate} opacity-90`} />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">Completion Rate</CardTitle>
                <div className="bg-white/20 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-white flex items-center" data-testid="metric-completion-rate">
                  {completionRate.toFixed(1)}%
                  <div className="h-2 w-2 bg-yellow-300 rounded-full ml-2 animate-bounce" />
                </div>
                <p className="text-xs text-white/80 mt-1">Overall success rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Department Distribution - Colorful Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg border-2 border-purple-100 dark:border-purple-900">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                <CardTitle className="flex items-center space-x-2 text-purple-800 dark:text-purple-200">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>Department Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {Object.entries(departmentCounts).map(([dept, count]: [string, any], index) => (
                    <div key={dept} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          {dept}
                        </span>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">{count} employees</Badge>
                      </div>
                      <div className="relative bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${totalEmployees > 0 ? (count / totalEmployees) * 100 : 0}%`,
                            background: `linear-gradient(to right, ${COLORS[index % COLORS.length]}, ${COLORS[index % COLORS.length]}DD)`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {Object.keys(departmentCounts).length === 0 && (
                    <div className="h-32 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No department data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Onboarding Stage Breakdown - Animated Vertical Bars */}
            <Card className="shadow-lg border-2 border-blue-100 dark:border-blue-900">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                <CardTitle className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Onboarding Stages</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {Object.entries(stageCounts).map(([stage, count]: [string, any], index) => (
                    <div key={stage} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2 animate-pulse" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          {stage}
                        </span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {count} employees
                        </Badge>
                      </div>
                      <div className="relative bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full rounded-full transition-all duration-1500 ease-out shadow-lg"
                          style={{
                            width: `${totalEmployees > 0 ? (count / totalEmployees) * 100 : 0}%`,
                            background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}AA, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`
                          }}
                        />
                        <div 
                          className="absolute top-0 left-0 h-full rounded-full animate-pulse opacity-30"
                          style={{
                            width: `${totalEmployees > 0 ? (count / totalEmployees) * 100 : 0}%`,
                            background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, white, ${COLORS[index % COLORS.length]})`
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  ))}
                  {Object.keys(stageCounts).length === 0 && (
                    <div className="h-32 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No stage data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary - Flashy Stats Grid */}
          <Card className="shadow-lg border-2 border-emerald-100 dark:border-emerald-900">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950">
              <CardTitle className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-200">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <span>Performance Summary</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Completion Rate Circle */}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 mx-auto mb-4">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-200 dark:text-gray-700"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        className="text-emerald-500 transition-all duration-2000 ease-out"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${completionRate}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-emerald-600">{completionRate.toFixed(0)}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Success Rate</p>
                </div>

                {/* Active Pipeline */}
                <div className="text-center">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                      <Clock className="h-8 w-8 text-white animate-pulse" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-yellow-900">{inProgress}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Active Pipeline</p>
                </div>

                {/* Completed Count */}
                <div className="text-center">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-lg">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-green-900">{completedOnboarding}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Completed</p>
                </div>
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