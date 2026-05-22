import React from 'react';
import {
  IonPage, IonContent,
  IonIcon,
} from '@ionic/react';
import {
  businessOutline, constructOutline,
  bulbOutline, chevronForward, hardwareChipOutline,
} from 'ionicons/icons';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from 'react-router-dom';
import './Perfil.css';

const Perfil: React.FC = () => {
  const { hasRole } = useAuth();
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="perfil-content" fullscreen>

        {/* ── C.H.I.P Header ────────────────────── */}
        <div className="chip-header">
          <div className="chip-header__left">
            <IonIcon icon={hardwareChipOutline} className="chip-header__icon" />
            <span className="chip-header__brand">C.H.I.P</span>
          </div>
          <span className="chip-header__subtitle">Configuración</span>
        </div>

        {/* ── Opciones dinámicas según rol ──────── */}
        <div className="perfil-options-section">
          <h3 className="perfil-section-title">
            {hasRole(['admin', 'supervisor']) ? 'Administración del Sistema' : 'Acciones'}
          </h3>

          <div className="perfil-options-list">
            {hasRole(['admin', 'supervisor']) && (
              <>
                <button className="perfil-option" onClick={() => history.push('/agencias')}>
                  <div className="perfil-option__icon perfil-option__icon--blue">
                    <IonIcon icon={businessOutline} />
                  </div>
                  <div className="perfil-option__content">
                    <span className="perfil-option__title">Agencias</span>
                    <span className="perfil-option__desc">Gestionar agencias y ubicaciones</span>
                  </div>
                  <IonIcon icon={chevronForward} className="perfil-option__arrow" />
                </button>

                <button className="perfil-option" onClick={() => history.push('/tipos-mantenimiento')}>
                  <div className="perfil-option__icon perfil-option__icon--green">
                    <IonIcon icon={constructOutline} />
                  </div>
                  <div className="perfil-option__content">
                    <span className="perfil-option__title">Tipos de Mantenimiento</span>
                    <span className="perfil-option__desc">Preventivo, correctivo, predictivo</span>
                  </div>
                  <IonIcon icon={chevronForward} className="perfil-option__arrow" />
                </button>

                <button className="perfil-option" onClick={() => history.push('/sugerencias')}>
                  <div className="perfil-option__icon perfil-option__icon--orange">
                    <IonIcon icon={bulbOutline} />
                  </div>
                  <div className="perfil-option__content">
                    <span className="perfil-option__title">Sugerencias</span>
                    <span className="perfil-option__desc">Textos técnicos predefinidos</span>
                  </div>
                  <IonIcon icon={chevronForward} className="perfil-option__arrow" />
                </button>
              </>
            )}

            {hasRole(['tecnico']) && (
              <button className="perfil-option" onClick={() => history.push('/home-mantenimientos')}>
                <div className="perfil-option__icon perfil-option__icon--green">
                  <IonIcon icon={constructOutline} />
                </div>
                <div className="perfil-option__content">
                  <span className="perfil-option__title">Mis Mantenimientos</span>
                  <span className="perfil-option__desc">Ver registros de mantenimiento</span>
                </div>
                <IonIcon icon={chevronForward} className="perfil-option__arrow" />
              </button>
            )}

            {hasRole(['gestor']) && (
              <button className="perfil-option" onClick={() => history.push('/equipos')}>
                <div className="perfil-option__icon perfil-option__icon--blue">
                  <IonIcon icon={businessOutline} />
                </div>
                <div className="perfil-option__content">
                  <span className="perfil-option__title">Equipos de mi Agencia</span>
                  <span className="perfil-option__desc">Gestionar computadores</span>
                </div>
                <IonIcon icon={chevronForward} className="perfil-option__arrow" />
              </button>
            )}
          </div>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default Perfil;
