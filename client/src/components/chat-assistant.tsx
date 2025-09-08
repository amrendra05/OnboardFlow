import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Send, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  message: string;
  isFromAI: boolean;
  timestamp: string;
}

export default function ChatAssistant() {
  const [inputMessage, setInputMessage] = useState("");
  const [selectedEmployeeId] = useState("540dd7fe-a72e-4a86-a996-e61ee9eb10c9"); // John Smith's ID
  const queryClient = useQueryClient();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/employees", selectedEmployeeId, "chat"],
    enabled: !!selectedEmployeeId,
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", `/api/employees/${selectedEmployeeId}/chat`, {
        message,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/employees", selectedEmployeeId, "chat"],
      });
      setInputMessage("");
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(inputMessage.trim());
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-green-500 rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">AI Assistant</CardTitle>
            <p className="text-xs text-green-500">● Online</p>
          </div>
        </div>
      </CardHeader>

      {/* Chat Messages */}
      <CardContent ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 ? (
          <div className="chat-message">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-muted p-3 rounded-lg max-w-xs">
                <p className="text-sm text-foreground">
                  Hi! I'm here to help with onboarding questions. What would you like to know?
                </p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="chat-message" data-testid={`chat-message-${message.id}`}>
              {message.isFromAI ? (
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg max-w-xs">
                    <p className="text-sm text-foreground">{message.message}</p>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-3 justify-end">
                  <div className="bg-primary p-3 rounded-lg max-w-xs">
                    <p className="text-sm text-primary-foreground">{message.message}</p>
                  </div>
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>

      {/* Chat Input */}
      <CardContent className="pt-0">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            data-testid="input-chat-message"
            type="text"
            placeholder="Ask about onboarding, policies, or projects..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={sendMessageMutation.isPending}
            className="flex-1"
          />
          <Button
            type="submit"
            data-testid="button-send-message"
            disabled={!inputMessage.trim() || sendMessageMutation.isPending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
