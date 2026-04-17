import { Users, CheckSquare, LayoutDashboard, Target, Filter, DollarSign, Bell, BellOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfileSelector } from '@/contexts/ProfileSelectorContext';
import { useLanguage } from '@/contexts/LanguageContext';
import logoBelaflor from '@/assets/logo-belaflor.svg';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from '@/components/ui/sidebar';
export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, selectedProfile } = useProfileSelector();
  const { t } = useLanguage();
  const { isSupported, isSubscribed, subscribe, unsubscribe, loading } = usePushNotifications();

  const menuItems = [
    { icon: LayoutDashboard, label: t('Dashboard'), path: '/' },
    // BR operation or admin: show regular Leads
    ...(isAdmin || selectedProfile.operation !== 'ES' ? [{ icon: Users, label: 'Leads - Thaylor', path: '/leads' }] : []),
    // ES operation or admin or BR operation: show Leads Alicia
    ...(isAdmin || selectedProfile.operation === 'ES' || selectedProfile.operation === 'BR' ? [{ icon: Users, label: 'Leads - Alicia', path: '/leads-alicia' }] : []),
    { icon: CheckSquare, label: t('Rotina'), path: '/routine' },
    ...(isAdmin ? [
      { icon: Filter, label: t('Funil Webinário'), path: '/funil-webinar' },
      { icon: Target, label: t('Meta de Vendas'), path: '/meta' },
      { icon: DollarSign, label: t('Comissões'), path: '/comissoes' },
    ] : []),
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-5">
        <div className="flex items-center gap-3">
          <img src={logoBelaflor} alt="Bela Flor" className="w-9 h-9 rounded-lg" />
          <div className="h-7 w-px bg-muted-foreground/20"></div>
          <div className="flex flex-col justify-center">
            <span className="text-sidebar-foreground font-extrabold tracking-wide text-sm leading-none">
              COMERCIAL
            </span>
            <span className="text-muted-foreground text-[9px] uppercase tracking-[0.2em] font-semibold leading-tight mt-0.5">
              DASHBOARD
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('Menu')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {isSupported && (
        <SidebarFooter className="p-3">
          <SidebarMenuButton
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={loading}
            className="w-full"
          >
            {isSubscribed ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            <span>{isSubscribed ? 'Notificações ativas' : 'Ativar notificações'}</span>
          </SidebarMenuButton>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
