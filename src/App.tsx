import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { statsChartOutline, desktopOutline, constructOutline, documentTextOutline, settingsOutline } from 'ionicons/icons';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole } from './types/auth.types';

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
  tab: string;
  href: string;
  icon: string;
  label: string;
  roles: UserRole[];
}

const TAB_CONFIG: TabConfig[] = [
  { tab: 'dashboard', href: '/home', icon: statsChartOutline, label: 'Dashboard', roles: ['admin', 'supervisor', 'gestor', 'tecnico'] },
  { tab: 'equipos', href: '/equipos', icon: desktopOutline, label: 'Equipos', roles: ['admin', 'supervisor', 'gestor'] },
  { tab: 'mantenimientos', href: '/home-mantenimientos', icon: constructOutline, label: 'Mantenimientos', roles: ['tecnico'] },
  { tab: 'solicitudes', href: '/solicitudes', icon: documentTextOutline, label: 'Solicitudes', roles: ['admin', 'supervisor'] },
  { tab: 'config', href: '/perfil', icon: settingsOutline, label: 'Perfil', roles: ['admin', 'supervisor', 'gestor', 'tecnico'] },
];

const AppTabs: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <IonRouterOutlet>
        <Route exact path="/login" component={Login} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </IonRouterOutlet>
    );
  }

  const visibleTabs = TAB_CONFIG.filter((t) => t.roles.includes(user.role));

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/home" component={HomeDashboard} />
        <Route exact path="/home-mantenimientos" component={Home} />
        <Route exact path="/formulario" component={FormularioMantenimiento} />
        <Route exact path="/agencias" component={GestionAgencias} />
        <Route exact path="/agencias/:agenciaId/ubicaciones" component={GestionUbicaciones} />
        <Route exact path="/tipos-mantenimiento" component={GestionTiposMantenimiento} />
        <Route exact path="/sugerencias" component={GestionSugerencias} />
        <Route exact path="/perfil" component={Perfil} />
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

      <IonTabBar slot="bottom">
        {visibleTabs.map((tab) => (
          <IonTabButton key={tab.tab} tab={tab.tab} href={tab.href}>
            <IonIcon icon={tab.icon} />
            <IonLabel>{tab.label}</IonLabel>
          </IonTabButton>
        ))}
      </IonTabBar>
    </IonTabs>
  );
};

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <ToastProvider>
        <IonReactRouter>
          <AppTabs />
        </IonReactRouter>
      </ToastProvider>
    </AuthProvider>
  </IonApp>
);

export default App;

