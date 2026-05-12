import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import { businessOutline, constructOutline, bulbOutline, chevronForward } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Configuracion.css';

const Configuracion: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader className="config-header" mode="md">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="Volver" />
          </IonButtons>
          <IonTitle>Configuración</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="config-container">
          <p className="config-subtitle">Administra los datos base de la aplicación</p>

          <div className="config-list">
            <button
              className="config-item"
              onClick={() => history.push('/agencias')}
            >
              <div className="config-item__icon config-item__icon--blue">
                <IonIcon icon={businessOutline} />
              </div>
              <div className="config-item__content">
                <span className="config-item__title">Agencias</span>
                <span className="config-item__desc">Gestionar agencias y ubicaciones</span>
              </div>
              <IonIcon icon={chevronForward} className="config-item__arrow" />
            </button>

            <button
              className="config-item"
              onClick={() => history.push('/tipos-mantenimiento')}
            >
              <div className="config-item__icon config-item__icon--purple">
                <IonIcon icon={constructOutline} />
              </div>
              <div className="config-item__content">
                <span className="config-item__title">Tipos de Mantenimiento</span>
                <span className="config-item__desc">Preventivo, correctivo, predictivo y más</span>
              </div>
              <IonIcon icon={chevronForward} className="config-item__arrow" />
            </button>

            <button
              className="config-item"
              onClick={() => history.push('/sugerencias')}
            >
              <div className="config-item__icon config-item__icon--amber">
                <IonIcon icon={bulbOutline} />
              </div>
              <div className="config-item__content">
                <span className="config-item__title">Sugerencias de Mantenimiento</span>
                <span className="config-item__desc">Textos técnicos predefinidos por tipo</span>
              </div>
              <IonIcon icon={chevronForward} className="config-item__arrow" />
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Configuracion;
