import React from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonItem, IonLabel, IonIcon,
  IonButton, IonAvatar, IonBadge, IonList,
} from '@ionic/react';
import {
  personOutline, mailOutline, businessOutline,
  shieldCheckmarkOutline, logOutOutline, informationCircleOutline,
} from 'ionicons/icons';
import { useAuth } from '../../context/AuthContext';
import './Perfil.css';

const Perfil: React.FC = () => {
  const { user, logout } = useAuth();

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'admin': return 'danger';
      case 'supervisor': return 'warning';
      case 'gestor': return 'primary';
      case 'tecnico': return 'success';
      default: return 'medium';
    }
  };

  const getRolLabel = (rol: string) => {
    switch (rol) {
      case 'admin': return 'Administrador';
      case 'supervisor': return 'Supervisor';
      case 'gestor': return 'Gestor de Agencia';
      case 'tecnico': return 'Tecnico';
      default: return rol;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  if (!user) return null;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Mi Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="perfil-content">

        {/* Avatar y nombre */}
        <div className="perfil-hero">
          <div className="perfil-avatar">
            {getInitials(user.name)}
          </div>
          <h2>{user.name}</h2>
          <IonBadge color={getRolColor(user.role)} className="rol-badge">
            {getRolLabel(user.role)}
          </IonBadge>
        </div>

        {/* Info */}
        <IonCard>
          <IonCardContent className="ion-no-padding">
            <IonList lines="inset">
              <IonItem>
                <IonIcon icon={mailOutline} slot="start" color="medium" />
                <IonLabel>
                  <p>Correo</p>
                  <h3>{user.email}</h3>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={shieldCheckmarkOutline} slot="start" color="medium" />
                <IonLabel>
                  <p>Rol</p>
                  <h3>{getRolLabel(user.role)}</h3>
                </IonLabel>
              </IonItem>
              {user.agencia_id && (
                <IonItem lines="none">
                  <IonIcon icon={businessOutline} slot="start" color="medium" />
                  <IonLabel>
                    <p>Agencia ID</p>
                    <h3>{user.agencia_id}</h3>
                  </IonLabel>
                </IonItem>
              )}
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Version */}
        <IonCard>
          <IonCardContent className="ion-no-padding">
            <IonItem lines="none">
              <IonIcon icon={informationCircleOutline} slot="start" color="medium" />
              <IonLabel>
                <p>Version</p>
                <h3>ManteniApp v2.0</h3>
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Cerrar sesion */}
        <div className="ion-padding">
          <IonButton expand="block" color="danger" fill="outline" onClick={logout}>
            <IonIcon icon={logOutOutline} slot="start" />
            Cerrar Sesion
          </IonButton>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default Perfil;
