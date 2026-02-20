import { Users, CheckSquare, LayoutDashboard, Target, Filter } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfileSelector } from '@/contexts/ProfileSelectorContext';
import logoBelaflor from '@/assets/logo-belaflor.svg';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader,
} from '@/components/ui/sidebar';
export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useProfileSelector();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Leads', path: '/leads' },
    { icon: CheckSquare, label: 'Rotina', path: '/routine' },
    ...(isAdmin ? [
      { icon: Filter, label: 'Funil Webinário', path: '/funil-webinar' },
      { icon: Target, label: 'Meta de Vendas', path: '/meta' },
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
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
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
    </Sidebar>
  );
}
