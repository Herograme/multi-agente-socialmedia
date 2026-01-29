import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { PageTransition } from './PageTransition';
import { useAppStore } from '../../stores/app.store';
import { cn } from '../../lib/utils';

export function Layout() {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main
        className={cn(
          'pt-14 transition-all duration-300',
          sidebarOpen ? 'pl-60' : 'pl-16'
        )}
      >
        <div className="container mx-auto p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
