import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Inbox, Users, MessageSquare, Settings, HelpCircle } from 'lucide-react';
const navItems = [{
  path: '/',
  icon: LayoutDashboard,
  label: 'Dashboard'
}, {
  path: '/inbox',
  icon: Inbox,
  label: 'Inbox'
}, {
  path: '/users',
  icon: Users,
  label: 'Users'
}];
const bottomNavItems = [{
  path: '/settings',
  icon: Settings,
  label: 'Settings'
}, {
  path: '/help',
  icon: HelpCircle,
  label: 'Help'
}];
export function Sidebar() {
  const location = useLocation();
  return <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <img src="/images/onfnewlogo.png" alt="Onference Logo" className="h-8 w-auto" />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return <NavLink key={item.path} to={item.path} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200', isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>;
        })}
        </nav>

        {/* Bottom Navigation */}
        

        {/* User Profile */}
        
      </div>
    </aside>;
}