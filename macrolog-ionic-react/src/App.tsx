import { Redirect, Route } from 'react-router-dom';
import { useEffect } from 'react';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { homeOutline, barChartOutline, settingsOutline } from 'ionicons/icons';
import HomePage from './pages/Home';
import ProgressPage from './pages/Progress';
import SettingsPage from './pages/Settings';
import { StorageService } from './services/storage';

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
import '@ionic/react/css/palettes/dark.class.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

function applyTheme(appearance: 'system' | 'light' | 'dark') {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark);
  document.documentElement.classList.toggle('ion-palette-dark', isDark);
}

const App: React.FC = () => {
  useEffect(() => {
    StorageService.getSettings().then(s => applyTheme(s.appearance ?? 'system'));

    // Re-apply when system theme changes (only matters in 'system' mode)
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => StorageService.getSettings().then(s => applyTheme(s.appearance ?? 'system'));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
  <IonApp>
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/tab1">
            <HomePage />
          </Route>
          <Route exact path="/tab2">
            <ProgressPage />
          </Route>
          <Route path="/tab3">
            <SettingsPage />
          </Route>
          <Route exact path="/">
            <Redirect to="/tab1" />
          </Route>
        </IonRouterOutlet>
        <IonTabBar slot="bottom">
          <IonTabButton tab="tab1" href="/tab1">
            <IonIcon aria-hidden="true" icon={homeOutline} />
            <IonLabel>Home</IonLabel>
          </IonTabButton>
          <IonTabButton tab="tab2" href="/tab2">
            <IonIcon aria-hidden="true" icon={barChartOutline} />
            <IonLabel>Progress</IonLabel>
          </IonTabButton>
          <IonTabButton tab="tab3" href="/tab3">
            <IonIcon aria-hidden="true" icon={settingsOutline} />
            <IonLabel>Settings</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  </IonApp>
  );
};

export { applyTheme };
export default App;
