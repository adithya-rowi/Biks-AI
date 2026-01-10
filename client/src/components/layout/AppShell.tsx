import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  FileText, 
  ClipboardCheck, 
  AlertTriangle, 
  FileBarChart,
  Plus,
  ChevronDown,
  LogOut,
  User,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navItems = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/assessments', label: 'Assessments', icon: ClipboardCheck },
  { path: '/findings', label: 'Findings', icon: AlertTriangle },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex bg-gradient-mint bg-blob">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shadow-xl" data-testid="sidebar">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Link href="/overview" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">Biks.ai</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/60 mb-2">
            PT Bank Nusantara Tbk
          </div>
          <div className="text-xs text-sidebar-foreground/40">
            v1.2.0 • Enterprise
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-6 shadow-sm" data-testid="topbar">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              PT Bank Nusantara Tbk
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/assessments">
              <Button className="gap-2 shadow-md" data-testid="button-new-assessment">
                <Plus className="w-4 h-4" />
                New Assessment
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-accent rounded-lg px-2 py-1.5 transition-colors" data-testid="user-menu-trigger">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      AW
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden sm:block">
                    <div className="text-sm font-medium">Ahmad Wijaya</div>
                    <div className="text-xs text-muted-foreground">Compliance Manager</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem data-testid="menu-profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" data-testid="menu-logout">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
