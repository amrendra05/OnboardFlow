import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { CheckSquare, Plus, Search, Filter, Calendar, User, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type Task, type Employee } from "@shared/schema";
import type { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type TaskFormData = z.infer<typeof insertTaskSchema>;

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  // Fetch tasks with filters
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", { 
      search: searchQuery || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      priority: priorityFilter !== "all" ? priorityFilter : undefined,
      assignedTo: assigneeFilter !== "all" ? assigneeFilter : undefined
    }],
  });

  // Fetch employees for assignment dropdown
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Fetch task stats
  const { data: stats } = useQuery<{ total: number; open: number; inProgress: number; completed: number; overdue: number }>({
    queryKey: ["/api/tasks/stats"],
  });

  const form = useForm<TaskFormData>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "open",
      priority: "medium",
      createdBy: "current-user", // In real app, get from auth
      source: "manual",
      tags: [],
      assignedTo: "unassigned",
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: TaskFormData) => apiRequest("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      setShowCreateModal(false);
      form.reset();
      toast({
        title: "Task created",
        description: "The task has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiRequest(`/api/tasks/${taskId}/complete`, {
      method: "POST",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      toast({
        title: "Task completed",
        description: "The task has been marked as completed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (statusFilter !== "all" && task.status !== statusFilter) {
      return false;
    }
    
    // Priority filter
    if (priorityFilter !== "all" && task.priority !== priorityFilter) {
      return false;
    }
    
    // Assignee filter
    if (assigneeFilter !== "all") {
      if (assigneeFilter === "unassigned" && task.assignedTo !== null) {
        return false; // Show only unassigned
      }
      if (assigneeFilter !== "unassigned" && task.assignedTo !== assigneeFilter) {
        return false; // Show only tasks assigned to specific person
      }
    }
    
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatPriority = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const isOverdue = (task: Task) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center space-x-3">
            <CheckSquare className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Task Management</h2>
              <p className="text-muted-foreground">Manage and track tasks for AI agents</p>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tasks...</p>
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
            <CheckSquare className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Task Management</h2>
              <p className="text-muted-foreground">Manage and track tasks for AI agents</p>
            </div>
          </div>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-task">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createTaskMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input data-testid="input-task-title" placeholder="Enter task title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea data-testid="input-task-description" placeholder="Enter task description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-task-priority">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low" data-testid="select-item-priority-low">Low</SelectItem>
                              <SelectItem value="medium" data-testid="select-item-priority-medium">Medium</SelectItem>
                              <SelectItem value="high" data-testid="select-item-priority-high">High</SelectItem>
                              <SelectItem value="critical" data-testid="select-item-priority-critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-task-source">
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="manual" data-testid="select-item-source-manual">Manual</SelectItem>
                              <SelectItem value="ai" data-testid="select-item-source-ai">AI Generated</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned To</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-task-assignee">
                                <SelectValue placeholder="Select assignee" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unassigned" data-testid="select-item-assignee-unassigned">Unassigned</SelectItem>
                              {employees.map((employee) => (
                                <SelectItem key={employee.id} value={employee.id} data-testid={`select-item-assignee-${employee.id}`}>
                                  {employee.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input 
                              data-testid="input-task-due-date"
                              type="date" 
                              {...field} 
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value || null)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} data-testid="button-cancel-task">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTaskMutation.isPending} data-testid="button-submit-task">
                      {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="px-6 py-4 bg-muted/50">
          <div className="grid grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-total-tasks">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Tasks</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600" data-testid="stat-open-tasks">{stats.open}</div>
                  <div className="text-sm text-muted-foreground">Open</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600" data-testid="stat-in-progress-tasks">{stats.inProgress}</div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600" data-testid="stat-completed-tasks">{stats.completed}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600" data-testid="stat-overdue-tasks">{stats.overdue}</div>
                  <div className="text-sm text-muted-foreground">Overdue</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-search-tasks"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="filter-status" className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="filter-status-all">All Status</SelectItem>
              <SelectItem value="open" data-testid="filter-status-open">Open</SelectItem>
              <SelectItem value="in_progress" data-testid="filter-status-progress">In Progress</SelectItem>
              <SelectItem value="completed" data-testid="filter-status-completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger data-testid="filter-priority" className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="filter-priority-all">All Priority</SelectItem>
              <SelectItem value="low" data-testid="filter-priority-low">Low</SelectItem>
              <SelectItem value="medium" data-testid="filter-priority-medium">Medium</SelectItem>
              <SelectItem value="high" data-testid="filter-priority-high">High</SelectItem>
              <SelectItem value="critical" data-testid="filter-priority-critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger data-testid="filter-assignee" className="w-40">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="filter-assignee-all">All Assignees</SelectItem>
              <SelectItem value="unassigned" data-testid="filter-assignee-unassigned">Unassigned</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id} data-testid={`filter-assignee-${employee.id}`}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-auto p-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all"
                ? "Try adjusting your filters to see more tasks."
                : "Create your first task to get started with AI agent task management."}
            </p>
            {!searchQuery && statusFilter === "all" && priorityFilter === "all" && assigneeFilter === "all" && (
              <Button onClick={() => setShowCreateModal(true)} data-testid="button-create-first-task">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Task
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className={`${isOverdue(task) ? 'border-red-200 dark:border-red-800' : ''}`} data-testid={`task-card-${task.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg" data-testid={`task-title-${task.id}`}>{task.title}</CardTitle>
                        {isOverdue(task) && (
                          <AlertCircle className="h-4 w-4 text-red-500" data-testid={`task-overdue-${task.id}`} />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(task.status)} data-testid={`task-status-${task.id}`}>
                          {formatStatus(task.status)}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)} data-testid={`task-priority-${task.id}`}>
                          {formatPriority(task.priority)}
                        </Badge>
                        {task.source === 'ai' && (
                          <Badge variant="outline" data-testid={`task-source-${task.id}`}>
                            AI Generated
                          </Badge>
                        )}
                      </div>
                    </div>
                    {task.status !== 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => completeTaskMutation.mutate(task.id)}
                        disabled={completeTaskMutation.isPending}
                        data-testid={`button-complete-${task.id}`}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {task.description && (
                    <p className="text-muted-foreground mb-4" data-testid={`task-description-${task.id}`}>
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      {task.assignedTo && (
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span data-testid={`task-assignee-${task.id}`}>
                            {employees.find(e => e.id === task.assignedTo)?.name || task.assignedTo}
                          </span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span data-testid={`task-due-date-${task.id}`}>
                            Due {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "No due date"}
                          </span>
                        </div>
                      )}
                      {task.claimedByAgentId && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Clock className="h-4 w-4" />
                          <span data-testid={`task-claimed-${task.id}`}>
                            Claimed by AI Agent
                          </span>
                        </div>
                      )}
                    </div>
                    <div data-testid={`task-created-${task.id}`}>
                      Created {format(new Date(task.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}