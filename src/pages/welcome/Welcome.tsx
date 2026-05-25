import React, { useEffect, useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Welcome.css';

const Welcome: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    const t1 = setTimeout(() => setVisible(true), 50);
    // Redirect after 2.4s
    const t2 = setTimeout(() => {
      history.replace('/home');
    }, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [history]);

  const firstName = user?.name?.split(' ')[0] || 'Usuario';

  return (
    <IonPage>
      <IonContent fullscreen className="welcome-content">
        <div className={`welcome-container ${visible ? 'welcome-container--visible' : ''}`}>
          <div className="welcome-logo-wrap">
            <div className="welcome-icon-ring">
              <span className="welcome-icon">⚙️</span>
            </div>
          </div>

          <div className="welcome-text-block">
            <p className="welcome-greeting">Bienvenido,</p>
            <h1 className="welcome-name">{firstName}</h1>
            <div className="welcome-brand-row">
              <span className="welcome-brand">C.H.I.P</span>
            </div>
            <p className="welcome-tagline">Control de Hardware e Infraestructura de Parque</p>
          </div>

          <div className="welcome-loader">
            <div className="welcome-loader__bar" />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Welcome;
