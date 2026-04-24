import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useProfileSelector } from '@/contexts/ProfileSelectorContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Sun, Moon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function AppLayout() {
  const { selectedProfile, setSelectedProfile, isAdmin, teamMembers } = useProfileSelector();
  const { signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
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
      <SidebarInset className="overflow-x-hidden">
        <header className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 bg-background sticky top-0 z-30">
          <SidebarTrigger />
          <div className="flex-1" />
          <div className="flex items-center gap-1 md:gap-2">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === 'pt' ? 'es' : 'pt')}
              className="h-8 md:h-9 px-2 md:px-3 text-xs font-bold gap-1 md:gap-1.5 text-muted-foreground hover:text-foreground"
              title={lang === 'pt' ? 'Cambiar a Español' : 'Mudar para Português'}
            >
              <span className="text-base">{lang === 'pt' ? '🇧🇷' : '🇪🇸'}</span>
              <span className="hidden sm:inline">{lang === 'pt' ? 'PT' : 'ES'}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title={t('Sair da conta')}
            >
              <LogOut className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLight(!isLight)}
              className="h-8 w-8 md:h-9 md:w-9"
              title={isLight ? t('Modo escuro') : t('Modo claro')}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            <User className="w-4 h-4 text-muted-foreground hidden sm:block" />
            {isAdmin && (
              <>
                <Button 
                  onClick={async () => {
                    const luiz = teamMembers.find(m => m.full_name?.toLowerCase().includes('luiz') || m.full_name?.toLowerCase().includes('carvalho'));
                    if (luiz) {
                      if (confirm(`Tem certeza que quer dar ADMIN para: ${luiz.full_name}?`)) {
                        const { error } = await supabase.from('profiles_dash').update({ role: 'ADMIN' }).eq('id', luiz.id);
                        if (error) alert("Erro: " + error.message);
                        else alert(`${luiz.full_name} agora é ADMIN! Atualize a página e você já poderá apagar/editar esse botão.`);
                      }
                    } else {
                      alert("Nenhum usuário com o nome 'Luiz' ou 'Carvalho' foi encontrado. Ele já fez login na Dashboard pelo menos uma vez para criar o perfil dele?");
                    }
                  }}
                  variant="default"
                  size="sm"
                  className="h-8 md:h-9 text-xs md:text-sm mr-2"
                >
                  Dar Admin pro Luiz
                </Button>
              <Select
                value={selectedProfile.id}
                onValueChange={(id) => {
                  const profile = teamMembers.find(p => p.id === id);
                  if (profile) setSelectedProfile(profile);
                }}
              >
                <SelectTrigger className="w-[120px] md:w-[180px] h-8 md:h-9 text-xs md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name} ({p.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </>
            ) : (
              <span className="text-xs md:text-sm font-medium text-muted-foreground px-1 md:px-2 truncate max-w-[100px] md:max-w-none">
                {selectedProfile.full_name}
              </span>
            )}
          </div>
        </header>
        <main className="p-3 md:p-6 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
