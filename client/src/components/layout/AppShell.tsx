import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  FileText, 
  ClipboardCheck, 
  AlertCircle, 
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

const navItems = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/assessments', label: 'Assessments', icon: ClipboardCheck },
  { path: '/findings', label: 'Findings', icon: AlertCircle },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex bg-[#F9FAFB]">
      <aside className="w-[220px] bg-[#0F766E] flex flex-col" data-testid="sidebar">
        <div className="h-14 flex items-center px-5 border-b border-white/10">
          <Link href="/overview" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">B</span>
            </div>
            <span className="text-[15px] font-semibold text-white tracking-tight">Biks.ai</span>
          </Link>
        </div>

        <nav className="flex-1 py-4">
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
                  className={`relative flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'text-white bg-white/5'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full" />
                  )}
                  <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="text-[11px] text-white/50 font-medium">
            PT Bank Nusantara Tbk
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-14 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6" data-testid="topbar">
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-medium text-[#6B7280]">
              PT Bank Nusantara Tbk
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/assessments">
              <Button size="sm" className="h-8 gap-1.5 text-[13px] font-medium shadow-sm" data-testid="button-new-assessment">
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                New Assessment
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-[#F3F4F6] rounded-md px-2 py-1.5 transition-colors" data-testid="user-menu-trigger">
                  <div className="w-7 h-7 rounded-full bg-[#0F766E] flex items-center justify-center">
                    <span className="text-white text-[11px] font-medium">AW</span>
                  </div>
                  <span className="text-[13px] font-medium text-[#374151]">Ahmad Wijaya</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem data-testid="menu-profile" className="text-[13px]">
                  <User className="w-4 h-4 mr-2" strokeWidth={1.75} />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-settings" className="text-[13px]">
                  <Settings className="w-4 h-4 mr-2" strokeWidth={1.75} />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 text-[13px]" data-testid="menu-logout">
                  <LogOut className="w-4 h-4 mr-2" strokeWidth={1.75} />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
