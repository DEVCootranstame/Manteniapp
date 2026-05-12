import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';
import FormularioMantenimiento from './components/FormularioMantenimiento';
import GestionAgencias from './pages/GestionAgencias';
import GestionUbicaciones from './pages/GestionUbicaciones';
import GestionTiposMantenimiento from './pages/GestionTiposMantenimiento';
import GestionSugerencias from './pages/GestionSugerencias';
import Configuracion from './pages/Configuracion';

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

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
/* import '@ionic/react/css/palettes/dark.system.css'; */

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/home" component={Home} />
        <Route exact path="/formulario" component={FormularioMantenimiento} />
        <Route exact path="/agencias" component={GestionAgencias} />
        <Route exact path="/agencias/:agenciaId/ubicaciones" component={GestionUbicaciones} />
        <Route exact path="/tipos-mantenimiento" component={GestionTiposMantenimiento} />
        <Route exact path="/sugerencias" component={GestionSugerencias} />
        <Route exact path="/configuracion" component={Configuracion} />
        <Route exact path="/">
          <Redirect to="/home" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
