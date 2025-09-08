import { Link, useLocation } from "wouter";
import { Brain, BarChart3, Users, Book, Bot, Settings, MoreVertical, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3, current: location === "/" },
    { name: "New Employee", href: "/new-employee", icon: Users, current: location === "/new-employee" },
    { name: "Onboarding List", href: "/onboarding-list", icon: UserCheck, current: location === "/onboarding-list" },
    { name: "Knowledge Base", href: "/knowledge-base", icon: Book, current: location === "/knowledge-base" },
    { name: "AI Assistant", href: "/ai-assistant", icon: Bot, current: location === "/ai-assistant" },
    { name: "Analytics", href: "/analytics", icon: BarChart3, current: location === "/analytics" },
    { name: "Settings", href: "/settings", icon: Settings, current: location === "/settings" },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0 flex flex-col">
      {/* Logo and Company Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Pod 42 AI</h1>
            <p className="text-sm text-muted-foreground">Onboarding Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <span
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-md transition-colors cursor-pointer
                  ${
                    item.current
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className={item.current ? "font-medium" : ""}>{item.name}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://github.com/shadcn.png" alt="User avatar" />
            <AvatarFallback>SJ</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Sarah Johnson</p>
            <p className="text-xs text-muted-foreground truncate">HR Manager</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
