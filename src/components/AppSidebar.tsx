import { Users, CheckSquare, LayoutDashboard, Target, Filter, DollarSign, Bell, BellOff, Send } from 'lucide-react';
import { useState } from 'react';
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
  const [testLoading, setTestLoading] = useState(false);

  const sendTestNotification = async () => {
    setTestLoading(true);
    try {
      const EDGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
      const res = await fetch(`${EDGE_BASE}/send-push-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_nome: 'Teste de notificação' }),
      });
      const data = await res.json();
      console.log('[push test]', data);
    } finally {
      setTestLoading(false);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: t('Dashboard'), path: '/' },
    ...(selectedProfile.operation === 'ALL' || selectedProfile.operation === 'Thaylor' ? [{ icon: Users, label: 'Leads - Thaylor', path: '/leads' }] : []),
    ...(selectedProfile.operation === 'ALL' || selectedProfile.operation === 'Alicia' ? [{ icon: Users, label: 'Leads - Alicia', path: '/leads-alicia' }] : []),
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
        <SidebarFooter className="p-3 flex flex-col gap-1">
          <SidebarMenuButton
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={loading}
            className="w-full"
          >
            {isSubscribed ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            <span>{isSubscribed ? 'Notificações ativas' : 'Ativar notificações'}</span>
          </SidebarMenuButton>
          {isAdmin && (
            <SidebarMenuButton
              onClick={sendTestNotification}
              disabled={testLoading}
              className="w-full"
            >
              <Send className="w-4 h-4" />
              <span>{testLoading ? 'Enviando...' : 'Testar notificação'}</span>
            </SidebarMenuButton>
          )}
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
