import { Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppStore } from '../../stores/app.store';
import { ConnectionStatus } from '../websocket/ConnectionStatus';

export function Header() {
  const { toggleSidebar } = useAppStore();

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-14 items-center gap-4 px-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Social Content Agent
          </span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <ConnectionStatus showLabel />
        </div>
      </div>
    </header>
  );
}
