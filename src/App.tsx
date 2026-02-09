import { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SeasonBanner } from './components/SeasonBanner';
import { About } from './components/About';
import { Details } from './components/Details';
import Application from './components/Application';
import { Team } from './components/Team';
import { Community } from './components/Community';
import { Footer } from './components/Footer';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthPage } from './components/auth/AuthPage';
import { UserPortal } from './components/auth/UserPortal';
import { Maintenance } from './components/Maintenance';
import { getSession, canAccessAdmin, clearSession, ensureOwnerAccount, getSettings } from './lib/store';

type Route = 'home' | 'auth' | 'portal' | 'admin-login' | 'admin-dashboard';

function getInitialRoute(): Route {
  const hash = window.location.hash;
  const user = getSession();

  if (hash === '#admin') {
    if (user && canAccessAdmin(user.role)) {
      return 'admin-dashboard';
    }
    return 'admin-login';
  }
  if (hash === '#login' || hash === '#register') {
    return 'auth';
  }
  if (hash === '#portal') {
    return user ? 'portal' : 'auth';
  }
  return 'home';
}

export function App() {
  const [route, setRoute] = useState<Route>(getInitialRoute);
  const [, setRefreshKey] = useState(0);

  const forceRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    ensureOwnerAccount();
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const user = getSession();

      if (hash === '#admin') {
        if (user && canAccessAdmin(user.role)) {
          setRoute('admin-dashboard');
        } else {
          setRoute('admin-login');
        }
      } else if (hash === '#login' || hash === '#register') {
        setRoute('auth');
      } else if (hash === '#portal') {
        setRoute(user ? 'portal' : 'auth');
      } else if (!['#about', '#details', '#team', '#community', '#apply'].includes(hash)) {
        setRoute('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (target: Route) => {
    if (target === 'home') {
      window.location.hash = '';
      history.replaceState(null, '', window.location.pathname);
    } else if (target === 'auth') {
      window.location.hash = 'login';
    } else if (target === 'portal') {
      window.location.hash = 'portal';
    } else if (target === 'admin-login' || target === 'admin-dashboard') {
      window.location.hash = 'admin';
    }
    setRoute(target);
    window.scrollTo(0, 0);
  };

  const currentUser = useMemo(() => getSession(), [route]);
  const isStaff = currentUser && canAccessAdmin(currentUser.role);
  const settings = getSettings();
  const isMaintenance = !settings.loginEnabled && !isStaff;

  // Content selector
  const renderContent = () => {
    if (isMaintenance && route !== 'admin-login' && route !== 'admin-dashboard') {
      return <Maintenance />;
    }

    switch (route) {
      case 'auth':
        return (
          <AuthPage
            onAuth={() => {
              forceRefresh();
              const user = getSession();
              if (window.location.hash === '#admin' && user && canAccessAdmin(user.role)) {
                navigateTo('admin-dashboard');
              } else {
                navigateTo('portal');
              }
            }}
            onBack={() => navigateTo('home')}
          />
        );
      
      case 'portal':
        return (
          <UserPortal
            onBack={() => navigateTo('home')}
            onLogout={() => {
              clearSession();
              forceRefresh();
              navigateTo('home');
            }}
            onApply={() => {
              navigateTo('home');
              setTimeout(() => {
                document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
          />
        );

      case 'admin-login':
        return (
          <AdminLogin
            onLogin={() => {
              forceRefresh();
              navigateTo('admin-dashboard');
            }}
            onBack={() => navigateTo('home')}
          />
        );

      case 'admin-dashboard':
        if (!currentUser || !canAccessAdmin(currentUser.role)) {
          return (
            <AdminLogin
              onLogin={() => {
                forceRefresh();
                navigateTo('admin-dashboard');
              }}
              onBack={() => navigateTo('home')}
            />
          );
        }
        return (
          <AdminDashboard
            currentUser={currentUser}
            onLogout={() => {
              clearSession();
              forceRefresh();
              navigateTo('home');
            }}
            onBack={() => navigateTo('home')}
          />
        );

      default:
        return (
          <main>
            <Hero />
            <SeasonBanner />
            <About />
            <Details />
            <Team />
            <Application />
            <Community />
          </main>
        );
    }
  };

  // Components that don't need the standard layout
  const isSpecialPage = ['auth', 'admin-login', 'admin-dashboard'].includes(route) || isMaintenance;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-emerald-500/30 selection:text-emerald-200">
      {!isSpecialPage && (
        <Navbar
          onAdminClick={isStaff ? () => navigateTo('admin-dashboard') : undefined}
          onLoginClick={() => navigateTo('auth')}
          onPortalClick={() => navigateTo('portal')}
        />
      )}

      {renderContent()}

      {!isSpecialPage && (
        <Footer onAdminClick={isStaff ? () => navigateTo('admin-dashboard') : undefined} />
      )}
    </div>
  );
}
