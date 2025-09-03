import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChatAssistant from "@/components/chat-assistant";
import type { Employee } from "@shared/schema";

export default function AIAssistant() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("540dd7fe-a72e-4a86-a996-e61ee9eb10c9");

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">AI Assistant</h2>
            <p className="text-muted-foreground">Chat with the AI to get help with onboarding questions</p>
          </div>
          <div className="w-64">
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="540dd7fe-a72e-4a86-a996-e61ee9eb10c9">John Smith (Demo)</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <div className="h-[600px]">
                <ChatAssistant />
              </div>
            </div>

            {/* AI Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Capabilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">What I can help with:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Company policies and procedures</li>
                      <li>• Development environment setup</li>
                      <li>• Project technical documentation</li>
                      <li>• Security requirements and training</li>
                      <li>• Onboarding process guidance</li>
                      <li>• Remote work policies</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Powered by:</h4>
                    <p className="text-sm text-muted-foreground">
                      Open source Llama 3.1 model via Groq API with contextual knowledge from your company documents
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sample Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      "How do I set up my development environment?",
                      "What are the security requirements?",
                      "Tell me about the remote work policy",
                      "What's included in Project Alpha?",
                      "How do I access company policies?"
                    ].map((question, index) => (
                      <div
                        key={index}
                        className="p-3 bg-muted/30 rounded-lg text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        "{question}"
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}