import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface MockProfile {
  id: string;
  full_name: string;
  role: 'ADMIN' | 'VENDEDORA' | 'SDR' | 'SOCIAL_SELLER';
}

export const TEAM_MEMBERS: MockProfile[] = [
  { id: '00000000-0000-0000-0000-000000000001', full_name: 'Admin', role: 'ADMIN' },
  { id: '00000000-0000-0000-0000-000000000002', full_name: 'Carolina', role: 'VENDEDORA' },
  { id: '00000000-0000-0000-0000-000000000003', full_name: 'Carol Souza', role: 'VENDEDORA' },
  { id: '00000000-0000-0000-0000-000000000004', full_name: 'Maria', role: 'SDR' },
  { id: '00000000-0000-0000-0000-000000000005', full_name: 'Sabrina', role: 'SOCIAL_SELLER' },
  { id: '00000000-0000-0000-0000-000000000006', full_name: 'Ana Caroline', role: 'SDR' },
];

interface ProfileSelectorContextType {
  selectedProfile: MockProfile;
  setSelectedProfile: (profile: MockProfile) => void;
  isAdmin: boolean;
}

const ProfileSelectorContext = createContext<ProfileSelectorContextType | null>(null);

export function ProfileSelectorProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();

  // Determine if logged-in user is admin based on their real profile from DB
  const realIsAdmin = profile?.role === 'ADMIN';

  // Build the real user's profile object
  const realUserProfile = useMemo<MockProfile>(() => ({
    id: user?.id || '',
    full_name: profile?.full_name || user?.email?.split('@')[0] || 'Usuário',
    role: (profile?.role as MockProfile['role']) || 'VENDEDORA',
  }), [user?.id, user?.email, profile?.full_name, profile?.role]);

  // Only admins can switch profiles; default to admin's first team member view
  const [adminSelectedProfile, setAdminSelectedProfile] = useState<MockProfile>(TEAM_MEMBERS[0]);

  // For non-admins, always use their real profile
  const selectedProfile = realIsAdmin ? adminSelectedProfile : realUserProfile;

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
