import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Menu, X, Bell, Wallet, Home, Settings, Users, Moon, Sun, Monitor } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useNotifications } from './hooks/useNotifications';
import { useChatSessions } from './hooks/useChatSessions';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChatPage } from './pages/ChatPage';
import { WalletPage } from './pages/WalletPage';
import { GigsBrowserPage } from './pages/GigsBrowserPage';
import { DevPanelPage } from './pages/DevPanelPage';
import { OnboardingWizard } from './components/OnboardingWizard';

function AppContent() {
  const { user, profile, loading: authLoading, signUp, signIn, signOut, loginAsDemo, error: authError, clearError } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(profile?.user_id || null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isOnAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Loading Milo...</p>
        </div>
      </div>
    );
  }

  if (!user && !isOnAuthPage) {
    return <Navigate to="/login" replace />;
  }

  if (!profile?.onboarding_complete && user && !isOnAuthPage && location.pathname !== '/onboarding') {
    return (
      <OnboardingWizard
        onComplete={async (data) => {
          // Save profile with onboarding complete
          const { supabase } = await import('./lib/supabase');
          const { error } = await supabase
            .from('user_profiles')
            .update({ ...data, onboarding_complete: true })
            .eq('user_id', profile.user_id);

          if (!error) {
            // Redirect to home after successful onboarding
            navigate('/');
            window.location.reload();
          } else {
            console.error('Failed to complete onboarding:', error);
            alert('Failed to save profile. Please try again.');
          }
        }}
      />
    );
  }

  if (isOnAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={signIn} onDemoLogin={loginAsDemo} error={authError} clearError={clearError} />} />
        <Route path="/register" element={<RegisterPage onRegister={signUp} error={authError} clearError={clearError} />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-50 flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          {sidebarOpen ? <X className="w-5 h-5 text-slate-600 dark:text-slate-400" /> : <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">Milo</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2">
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:block`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 dark:text-white">Milo</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Campus Gigs</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            <NavItem icon={<Home className="w-5 h-5" />} label="Home" active={location.pathname === '/'} onClick={() => { navigate('/'); setSidebarOpen(false); }} />
            <NavItem icon={<Wallet className="w-5 h-5" />} label="Wallet" active={location.pathname === '/wallet'} onClick={() => { navigate('/wallet'); setSidebarOpen(false); }} />
            <NavItem icon={<Users className="w-5 h-5" />} label="Find Gigs" active={location.pathname === '/gigs'} onClick={() => { navigate('/gigs'); setSidebarOpen(false); }} />
            <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" active={location.pathname === '/settings'} onClick={() => { navigate('/settings'); setSidebarOpen(false); }} />

            {/* Dev Panel Toggle */}
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800">
              <NavItem icon={<Monitor className="w-5 h-5" />} label="Dev Panel" active={location.pathname === '/dev'} onClick={() => { navigate('/dev'); setSidebarOpen(false); }} />
            </div>
          </nav>

          {/* Theme Switcher */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Theme</span>
              <div className="flex gap-1">
                <button onClick={() => setTheme('light')} className={`p-1.5 rounded ${theme === 'light' ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <Sun className="w-4 h-4" />
                </button>
                <button onClick={() => setTheme('dark')} className={`p-1.5 rounded ${theme === 'dark' ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <Moon className="w-4 h-4" />
                </button>
                <button onClick={() => setTheme('system')} className={`p-1.5 rounded ${theme === 'system' ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <Monitor className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {profile?.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{profile?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile?.email}</p>
              </div>
              <button onClick={signOut} className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline">Logout</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <Routes>
          <Route path="/" element={<ChatPage profile={profile!} userId={profile?.user_id || ''} />} />
          <Route path="/wallet" element={<WalletPage profile={profile!} />} />
          <Route path="/gigs" element={<GigsBrowserPage profile={profile!} />} />
          <Route path="/dev" element={<DevPanelPage profile={profile!} />} />
          <Route path="/onboarding" element={<OnboardingWizard onComplete={async () => {}} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="fixed top-16 right-4 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="font-medium text-slate-900 dark:text-white">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-slate-500 dark:text-slate-400 text-center">No notifications</p>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${!notif.read ? 'bg-cyan-50 dark:bg-cyan-950/20' : ''}`}
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{notif.title}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        active
          ? 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;