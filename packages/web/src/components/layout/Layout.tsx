import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSSE } from '../../hooks/useSSE';
import { cn } from '../../lib/utils';
import {
  MessageSquare,
  Settings,
  Puzzle,
  Zap,
  Server,
  Store,
  Wifi,
  WifiOff,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isConnected } = useSSE();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { path: '/sessions', icon: MessageSquare, label: 'Sessions' },
    { path: '/settings', icon: Settings, label: 'Settings' },
    { path: '/plugins', icon: Puzzle, label: 'Plugins' },
    { path: '/skills', icon: Zap, label: 'Skills' },
    { path: '/mcp', icon: Server, label: 'MCP' },
    { path: '/marketplace', icon: Store, label: 'Marketplace' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-all duration-200 lg:translate-x-0 lg:static',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          !sidebarOpen && 'lg:w-16 lg:border-r-0'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {sidebarOpen ? (
            <h1 className="text-xl font-bold">CC Manager</h1>
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg mx-auto" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className={cn('p-4 space-y-2', !sidebarOpen && 'lg:p-2 lg:space-y-1')}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted',
                  !sidebarOpen && 'lg:justify-center lg:px-2'
                )
              }
              onClick={() => setMobileSidebarOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span>Disconnected</span>
                </>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center h-16 px-4 border-b bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex"
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
