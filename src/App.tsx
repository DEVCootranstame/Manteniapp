import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonPage, IonIcon, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { statsChartOutline, desktopOutline, constructOutline, documentTextOutline, settingsOutline, personOutline } from 'ionicons/icons';
import { AuthProvider, useAuth } from './context/AuthContext';
import React from 'react';
import { useInactivityLogout } from './hooks/useInactivityLogout';
import { UserRole } from './types/auth.types';
import { useHistory, useLocation } from 'react-router-dom';
import NotificacionesBell from './components/NotificacionesBell';
import OfflineBanner from './components/OfflineBanner';

import Home from './pages/Home';
import FormularioMantenimiento from './components/FormularioMantenimiento';
import GestionAgencias from './pages/GestionAgencias';
import GestionUbicaciones from './pages/GestionUbicaciones';
import GestionTiposMantenimiento from './pages/GestionTiposMantenimiento';
import GestionSugerencias from './pages/GestionSugerencias';
import Configuracion from './pages/Configuracion';
import Login from './pages/login/Login';
import RoleGuard from './guards/RoleGuard';
import ListaEquipos from './pages/equipos/ListaEquipos';
import DetalleEquipo from './pages/equipos/DetalleEquipo';
import CambiarResponsable from './pages/equipos/CambiarResponsable';
import ListaSolicitudes from './pages/solicitudes/ListaSolicitudes';
import DetalleSolicitud from './pages/solicitudes/DetalleSolicitud';
import HomeDashboard from './pages/dashboard/HomeDashboard';
import Perfil from './pages/perfil/Perfil';
import MiPerfil from './pages/perfil/MiPerfil';
import { ToastProvider } from './context/ToastContext';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

interface TabConfig {
  id: string;
  href: string;
  icon: string;
  label: string;
  roles: UserRole[];
  isCenter?: boolean;
}

const TAB_CONFIG: TabConfig[] = [
  { id: 'dashboard', href: '/home', icon: statsChartOutline, label: 'Inicio', roles: ['admin', 'supervisor', 'gestor', 'tecnico'] },
  { id: 'equipos', href: '/equipos', icon: desktopOutline, label: 'Equipos', roles: ['admin', 'supervisor', 'gestor'] },
  { id: 'mantenimientos', href: '/home-mantenimientos', icon: constructOutline, label: 'Mant.', roles: ['admin', 'tecnico'] },
  { id: 'solicitudes', href: '/solicitudes', icon: documentTextOutline, label: 'Solicitudes', roles: ['admin', 'supervisor'] },
  { id: 'config', href: '/perfil', icon: settingsOutline, label: 'Config', roles: ['admin', 'supervisor', 'gestor', 'tecnico'] },
  { id: 'mi-perfil', href: '/mi-perfil', icon: personOutline, label: 'Perfil', roles: ['admin', 'supervisor', 'gestor', 'tecnico'] },
];

/* ── Custom Floating Navbar ────────────────────────── */
const FloatingNavbar: React.FC = React.memo(() => {
  const { user } = useAuth();
  const history = useHistory();
  const location = useLocation();

  if (!user) return null;

  const visibleTabs = TAB_CONFIG.filter((t) => t.roles.includes(user.role));

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <div className="floating-navbar">
      <div className="floating-navbar__inner">
        {visibleTabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <button
              key={tab.id}
              className={`nav-tab ${active ? 'nav-tab--active' : ''}`}
              onClick={() => history.push(tab.href)}
            >
              <span className="nav-tab__bubble" />
              <span className="nav-tab__icon">
                <IonIcon icon={tab.icon} />
              </span>
              <span className="nav-tab__label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

/* ── Hidden routes (pages without navbar visible) ──── */
const HIDDEN_NAVBAR_ROUTES = ['/login', '/formulario'];

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout, softLogout } = useAuth();
  const location = useLocation();

  useInactivityLogout(softLogout, isAuthenticated);

  const showNavbar = isAuthenticated && user && !HIDDEN_NAVBAR_ROUTES.some(r => location.pathname.startsWith(r));

  // While loading auth state, show nothing (avoids flash)
  if (isLoading) {
    return null;
  }

  // If not authenticated and not on login page, redirect to login
  if (!isAuthenticated && location.pathname !== '/login') {
    return <Redirect to="/login" />;
  }

  return (
    <>
      <IonRouterOutlet>
        <Route exact path="/home" component={HomeDashboard} />
        <Route exact path="/home-mantenimientos" component={Home} />
        <Route exact path="/formulario" component={FormularioMantenimiento} />
        <Route exact path="/agencias" component={GestionAgencias} />
        <Route exact path="/agencias/:agenciaId/ubicaciones" component={GestionUbicaciones} />
        <Route exact path="/tipos-mantenimiento" component={GestionTiposMantenimiento} />
        <Route exact path="/sugerencias" component={GestionSugerencias} />
        <Route exact path="/perfil" component={Perfil} />
        <Route exact path="/mi-perfil" component={MiPerfil} />
        <Route exact path="/configuracion" component={Configuracion} />
        <Route exact path="/equipos" component={ListaEquipos} />
        <Route exact path="/equipos/:id" component={DetalleEquipo} />
        <Route exact path="/equipos/:id/cambiar-responsable" component={CambiarResponsable} />
        <Route exact path="/solicitudes" component={ListaSolicitudes} />
        <Route exact path="/solicitudes/:id" component={DetalleSolicitud} />
        <Route exact path="/login" component={Login} />
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
      </IonRouterOutlet>

      {showNavbar && <FloatingNavbar />}
      {showNavbar && <NotificacionesBell />}
      <OfflineBanner />
    </>
  );
};

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <ToastProvider>
        <IonReactRouter>
          <AppContent />
        </IonReactRouter>
      </ToastProvider>
    </AuthProvider>
  </IonApp>
);

export default App;

