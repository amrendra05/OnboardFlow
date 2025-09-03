import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Circle, ClipboardCheck, Calendar, GraduationCap } from "lucide-react";

interface WorkflowStage {
  title: string;
  description: string;
  icon: React.ElementType;
  status: "completed" | "in-progress" | "pending";
  tasks: Array<{
    name: string;
    completed: boolean;
  }>;
}

export default function OnboardingWorkflow() {
  const stages: WorkflowStage[] = [
    {
      title: "Pre-boarding",
      description: "AI document preparation",
      icon: ClipboardCheck,
      status: "completed",
      tasks: [
        { name: "Welcome email sent", completed: true },
        { name: "Documents prepared", completed: true },
        { name: "Equipment ordered", completed: true },
      ],
    },
    {
      title: "First Day",
      description: "Guided AI orientation",
      icon: Calendar,
      status: "in-progress",
      tasks: [
        { name: "Badge activation", completed: true },
        { name: "System access setup", completed: false },
        { name: "Team introductions", completed: false },
      ],
    },
    {
      title: "Training",
      description: "AI-curated learning",
      icon: GraduationCap,
      status: "pending",
      tasks: [
        { name: "Role-specific training", completed: false },
        { name: "Project knowledge sync", completed: false },
        { name: "Feedback collection", completed: false },
      ],
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "in-progress":
        return <Clock className="h-6 w-6 text-primary" />;
      default:
        return <Circle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getTaskIcon = (completed: boolean) => {
    return completed ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <Clock className="h-4 w-4 text-muted-foreground" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Onboarding Workflow</CardTitle>
        <p className="text-sm text-muted-foreground">
          Automated workflow adapts based on role, department, and project assignments
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <div key={stage.title} className="relative" data-testid={`workflow-stage-${index}`}>
                <div className="flex items-center mb-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      stage.status === "completed"
                        ? "bg-green-500"
                        : stage.status === "in-progress"
                        ? "bg-primary"
                        : "bg-secondary border-2 border-border"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        stage.status === "pending" ? "text-muted-foreground" : "text-white"
                      }`}
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-semibold text-foreground">{stage.title}</h4>
                    <p className="text-xs text-muted-foreground">{stage.description}</p>
                  </div>
                  <div className="ml-auto">{getStatusIcon(stage.status)}</div>
                </div>

                <div className="space-y-2 ml-14">
                  {stage.tasks.map((task, taskIndex) => (
                    <div
                      key={taskIndex}
                      data-testid={`task-${index}-${taskIndex}`}
                      className="flex items-center text-xs"
                    >
                      {getTaskIcon(task.completed)}
                      <span
                        className={`ml-2 ${
                          task.completed ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {task.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Connection line */}
                {index < stages.length - 1 && (
                  <div className="absolute top-12 left-16 w-px h-20 bg-border md:w-20 md:h-px md:top-5 md:left-full"></div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
