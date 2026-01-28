import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, History, Settings, Play, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../stores/app.store';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/trends', icon: TrendingUp, label: 'Tendências' },
  { to: '/execution', icon: Play, label: 'Execução' },
  { to: '/posts', icon: FileText, label: 'Posts' },
  { to: '/history', icon: History, label: 'Histórico' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

export function Sidebar() {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);

  return (
    <aside
      className={cn(
        'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] border-r bg-card transition-all duration-300',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      <nav className="flex flex-col gap-2 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
