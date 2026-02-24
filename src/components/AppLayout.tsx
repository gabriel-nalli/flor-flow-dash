import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useProfileSelector, TEAM_MEMBERS } from '@/contexts/ProfileSelectorContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Sun, Moon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppLayout() {
  const { selectedProfile, setSelectedProfile, isAdmin } = useProfileSelector();
  const { signOut } = useAuth();
  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  }, [isLight]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex items-center gap-3 px-6 py-3 bg-background">
          <SidebarTrigger />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLight(!isLight)}
              className="h-9 w-9"
              title={isLight ? 'Modo escuro' : 'Modo claro'}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            <User className="w-4 h-4 text-muted-foreground" />
            {isAdmin ? (
              <Select
                value={selectedProfile.id}
                onValueChange={(id) => {
                  const profile = TEAM_MEMBERS.find(p => p.id === id);
                  if (profile) setSelectedProfile(profile);
                }}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_MEMBERS.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name} ({p.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm font-medium text-muted-foreground px-2">
                {selectedProfile.full_name}
              </span>
            )}
          </div>
        </header>
        <main className="p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
