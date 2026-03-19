import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface MockProfile {
  id: string;
  full_name: string;
  role: 'ADMIN' | 'VENDEDORA' | 'SDR' | 'SOCIAL_SELLER';
  operation?: string;
}

interface ProfileSelectorContextType {
  selectedProfile: MockProfile;
  setSelectedProfile: (profile: MockProfile) => void;
  isAdmin: boolean;
  teamMembers: MockProfile[];
}

const ProfileSelectorContext = createContext<ProfileSelectorContextType | null>(null);

export function ProfileSelectorProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<MockProfile[]>([]);
  const [adminSelectedProfile, setAdminSelectedProfile] = useState<MockProfile | null>(null);

  // Determine if logged-in user is admin based on their real profile from DB
  const realIsAdmin = profile?.role === 'ADMIN';

  useEffect(() => {
    if (realIsAdmin) {
      supabase.from('profiles_dash').select('*').then(({ data }) => {
        if (data) {
          const members = data.map(d => ({
            id: d.id,
            full_name: d.full_name || 'Sem nome',
            role: (d.role as MockProfile['role']) || 'VENDEDORA',
            operation: (d as any).operation || 'BR',
          }));
          setTeamMembers(members);
          
          if (!adminSelectedProfile) {
            // Seleciona ele mesmo por padrão ou o primeiro da lista
            const myMem = members.find(m => m.id === user?.id) || members[0];
            if (myMem) setAdminSelectedProfile(myMem);
          }
        }
      });
    }
  }, [realIsAdmin, user?.id]);

  // Build the real user's profile object
  const realUserProfile = useMemo<MockProfile>(() => ({
    id: user?.id || '',
    full_name: profile?.full_name || user?.email?.split('@')[0] || 'Usuário',
    role: (profile?.role as MockProfile['role']) || 'VENDEDORA',
    operation: (profile as any)?.operation || 'BR',
  }), [user?.id, user?.email, profile?.full_name, profile?.role, (profile as any)?.operation]);

  // For non-admins, always use their real profile
  const selectedProfile = realIsAdmin && adminSelectedProfile ? adminSelectedProfile : realUserProfile;

  const setSelectedProfile = (p: MockProfile) => {
    if (realIsAdmin) {
      setAdminSelectedProfile(p);
    }
    // Non-admins cannot change profile - silently ignore
  };

  return (
    <ProfileSelectorContext.Provider value={{
      selectedProfile,
      setSelectedProfile,
      isAdmin: realIsAdmin,
      teamMembers: realIsAdmin ? teamMembers : [realUserProfile],
    }}>
      {children}
    </ProfileSelectorContext.Provider>
  );
}

export function useProfileSelector() {
  const ctx = useContext(ProfileSelectorContext);
  if (!ctx) throw new Error('useProfileSelector must be used within ProfileSelectorProvider');
  return ctx;
}
