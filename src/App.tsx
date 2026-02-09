import { useState, useEffect, useCallback } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
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
import { getSession, canAccessAdmin, clearSession, ensureOwnerAccount } from './lib/store';

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

  // Auth page
  if (route === 'auth') {
    return (
      <>
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
        <SpeedInsights />
      </>
    );
  }

  // User portal
  if (route === 'portal') {
    return (
      <>
        <UserPortal
          onBack={() => navigateTo('home')}
          onLogout={() => {
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
        <SpeedInsights />
      </>
    );
  }

  // Admin login
  if (route === 'admin-login') {
    return (
      <>
        <AdminLogin
          onLogin={() => {
            forceRefresh();
            setRoute('admin-dashboard');
          }}
          onBack={() => navigateTo('home')}
        />
        <SpeedInsights />
      </>
    );
  }

  // Admin dashboard
  if (route === 'admin-dashboard') {
    const user = getSession();
    if (!user || !canAccessAdmin(user.role)) {
      return (
        <>
          <AdminLogin
            onLogin={() => {
              forceRefresh();
              setRoute('admin-dashboard');
            }}
            onBack={() => navigateTo('home')}
          />
          <SpeedInsights />
        </>
      );
    }

    return (
      <>
        <AdminDashboard
          currentUser={user}
          onLogout={() => {
            clearSession();
            forceRefresh();
            navigateTo('home');
          }}
          onBack={() => navigateTo('home')}
        />
        <SpeedInsights />
      </>
    );
  }

  // ══════════════════════════════════════════════════════════
  // MAIN HOMEPAGE — This is what visitors see
  // ══════════════════════════════════════════════════════════
  const currentUser = getSession();
  const isStaff = currentUser && canAccessAdmin(currentUser.role);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      {/* 1. Navigation */}
      <Navbar
        onAdminClick={isStaff ? () => navigateTo('admin-dashboard') : undefined}
        onLoginClick={() => navigateTo('auth')}
        onPortalClick={() => navigateTo('portal')}
      />

      <main>
        {/* 3. Hero Section */}
        <Hero />

        {/* 4. Season Banner — shows current season with custom image */}
        <SeasonBanner />

        {/* 5. About the SMP */}
        <About />

        {/* 6. Server Details & Rules */}
        <Details />

        {/* 7. Team */}
        <Team />

        {/* 8. Application Form */}
        <Application />

        {/* 9. Community & Socials */}
        <Community />
      </main>

      {/* 10. Footer */}
      <Footer onAdminClick={isStaff ? () => navigateTo('admin-dashboard') : undefined} />
      
      <SpeedInsights />
    </div>
  );
}
