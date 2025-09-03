import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MessageCircle } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  startDate: string;
  avatarUrl?: string;
}

interface EmployeeProgressProps {
  employees: Employee[];
}

export default function EmployeeProgress({ employees }: EmployeeProgressProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Onboarding Progress</CardTitle>
          <Button variant="outline" size="sm" data-testid="button-view-all-progress">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employees.slice(0, 3).map((employee, index) => {
            // Mock progress data - in real app, this would come from the API
            const progressValues = [75, 92, 15];
            const daysAgo = [3, 7, 0];
            const progress = progressValues[index] || 0;
            const days = daysAgo[index] || 0;

            return (
              <div
                key={employee.id}
                data-testid={`employee-progress-${employee.id}`}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={employee.avatarUrl} alt={`${employee.name} avatar`} />
                    <AvatarFallback>
                      {employee.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.position} - Started {days === 0 ? "today" : `${days} days ago`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{progress}% Complete</p>
                    <Progress value={progress} className="w-24 mt-1" />
                  </div>
                  <Button variant="ghost" size="icon" data-testid={`button-chat-${employee.id}`}>
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </Button>
                </div>
              </div>
            );
          })}
          
          {employees.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No employees in onboarding process</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
