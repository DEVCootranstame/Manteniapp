import React from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import {
  personOutline, mailOutline, shieldCheckmarkOutline,
  businessOutline, logOutOutline, hardwareChipOutline,
} from 'ionicons/icons';
import { useAuth } from '../../context/AuthContext';
import './MiPerfil.css';

const MiPerfil: React.FC = () => {
  const { user, logout } = useAuth();

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'admin': return '#EF4444';
      case 'supervisor': return '#F97316';
      case 'gestor': return '#2563EB';
      case 'tecnico': return '#10B981';
      default: return '#94A3B8';
    }
  };

  const getRolLabel = (rol: string) => {
    switch (rol) {
      case 'admin': return 'Administrador';
      case 'supervisor': return 'Supervisor';
      case 'gestor': return 'Gestor de Agencia';
      case 'tecnico': return 'Técnico';
      default: return rol;
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  if (!user) return null;

  return (
    <IonPage>
      <IonContent className="miperfil-content" fullscreen>

        {/* ── C.H.I.P Header ────────────────────── */}
        <div className="miperfil-chip-header">
          <IonIcon icon={hardwareChipOutline} className="miperfil-chip-header__icon" />
          <div className="miperfil-chip-header__text">
            <span className="miperfil-chip-header__brand">C.H.I.P</span>
            <span className="miperfil-chip-header__full">Control de Hardware, Inventario y Periféricos</span>
          </div>
        </div>

        {/* ── Tarjeta de perfil ─────────────────── */}
        <div className="miperfil-card">
          <div className="miperfil-card__avatar">
            {getInitials(user.name)}
          </div>
          <h2 className="miperfil-card__name">{user.name}</h2>
          <span
            className="miperfil-card__role"
            style={{ background: getRolColor(user.role) }}
          >
            {getRolLabel(user.role)}
          </span>

          <div className="miperfil-card__divider" />

          <div className="miperfil-card__details">
            <div className="miperfil-detail-row">
              <div className="miperfil-detail-row__icon">
                <IonIcon icon={mailOutline} />
              </div>
              <span>{user.email}</span>
            </div>
            <div className="miperfil-detail-row">
              <div className="miperfil-detail-row__icon">
                <IonIcon icon={shieldCheckmarkOutline} />
              </div>
              <span>{getRolLabel(user.role)}</span>
            </div>
            {user.agencia_id && (
              <div className="miperfil-detail-row">
                <div className="miperfil-detail-row__icon">
                  <IonIcon icon={businessOutline} />
                </div>
                <span>{user.agencia?.nombre ?? `Agencia #${user.agencia_id}`}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Botón cerrar sesión ───────────────── */}
        <button className="miperfil-logout" onClick={logout}>
          <IonIcon icon={logOutOutline} />
          <span>Cerrar Sesión</span>
        </button>

      </IonContent>
    </IonPage>
  );
};

export default MiPerfil;
