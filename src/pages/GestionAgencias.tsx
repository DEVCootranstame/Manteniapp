import React, { useState, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonAlert,
  IonToast,
  useIonViewWillEnter,
} from '@ionic/react';
import { add, pencil, trash, locationOutline } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { useHistory } from 'react-router-dom';
import { Agencia, AGENCIAS_STORAGE_KEY } from '../types';
import './GestionAgencias.css';

const AGENCIAS_INICIALES: Agencia[] = [
  { id: '1', codigo: 'AR', nombre: 'Arauca', ubicaciones: [] },
  { id: '2', codigo: 'AQ', nombre: 'Arauquita', ubicaciones: [] },
  { id: '3', codigo: 'SA', nombre: 'Saravena', ubicaciones: [] },
  { id: '4', codigo: 'FT', nombre: 'Fortul', ubicaciones: [] },
  { id: '5', codigo: 'TA', nombre: 'Tame', ubicaciones: [] },
  { id: '6', codigo: 'PR', nombre: 'Puerto Rondón', ubicaciones: [] },
  { id: '7', codigo: 'HC', nombre: 'Hato Corozal', ubicaciones: [] },
  { id: '8', codigo: 'PO', nombre: 'Pore', ubicaciones: [] },
  { id: '9', codigo: 'PA', nombre: 'Paz de Ariporo', ubicaciones: [] },
  { id: '10', codigo: 'YP', nombre: 'Yopal', ubicaciones: [] },
  { id: '11', codigo: 'VI', nombre: 'Villavicencio', ubicaciones: [] },
  { id: '12', codigo: 'JG', nombre: 'San José de Guaviare', ubicaciones: [] },
  { id: '13', codigo: 'BT', nombre: 'Bogotá', ubicaciones: [] },
  { id: '14', codigo: 'MD', nombre: 'Medellín', ubicaciones: [] },
  { id: '15', codigo: 'AM', nombre: 'Armenia', ubicaciones: [] },
  { id: '16', codigo: 'BM', nombre: 'Bucaramanga', ubicaciones: [] },
  { id: '17', codigo: 'CT', nombre: 'Cúcuta', ubicaciones: [] },
  { id: '18', codigo: 'PM', nombre: 'Pamplona', ubicaciones: [] },
  { id: '19', codigo: 'PE', nombre: 'Pereira', ubicaciones: [] },
];

const GestionAgencias: React.FC = () => {
  const history = useHistory();
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [showEditAlert, setShowEditAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [agenciaSeleccionada, setAgenciaSeleccionada] = useState<Agencia | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const cargarAgencias = useCallback(async () => {
    const { value } = await Preferences.get({ key: AGENCIAS_STORAGE_KEY });
    if (value) {
      setAgencias(JSON.parse(value));
    } else {
      // Primera vez: precargar agencias iniciales
      await Preferences.set({
        key: AGENCIAS_STORAGE_KEY,
        value: JSON.stringify(AGENCIAS_INICIALES),
      });
      setAgencias(AGENCIAS_INICIALES);
    }
  }, []);

  useIonViewWillEnter(() => {
    cargarAgencias();
  });

  const guardarAgencias = async (nuevas: Agencia[]) => {
    await Preferences.set({
      key: AGENCIAS_STORAGE_KEY,
      value: JSON.stringify(nuevas),
    });
    setAgencias(nuevas);
  };

  const agregarAgencia = async (nombre: string, codigo: string) => {
    if (!nombre.trim() || !codigo.trim()) return;

    const nueva: Agencia = {
      id: crypto.randomUUID(),
      codigo: codigo.trim().toUpperCase(),
      nombre: nombre.trim(),
      ubicaciones: [],
    };

    const actualizadas = [...agencias, nueva];
    await guardarAgencias(actualizadas);
    setToastMessage(`Agencia "${nueva.nombre}" creada`);
    setShowToast(true);
  };

  const editarAgencia = async (nombre: string, codigo: string) => {
    if (!agenciaSeleccionada || !nombre.trim() || !codigo.trim()) return;

    const actualizadas = agencias.map((a) =>
      a.id === agenciaSeleccionada.id
        ? { ...a, nombre: nombre.trim(), codigo: codigo.trim().toUpperCase() }
        : a
    );
    await guardarAgencias(actualizadas);
    setToastMessage('Agencia actualizada');
    setShowToast(true);
  };

  const eliminarAgencia = async () => {
    if (!agenciaSeleccionada) return;
    const actualizadas = agencias.filter((a) => a.id !== agenciaSeleccionada.id);
    await guardarAgencias(actualizadas);
    setToastMessage(`Agencia "${agenciaSeleccionada.nombre}" eliminada`);
    setShowToast(true);
    setAgenciaSeleccionada(null);
  };

  return (
    <IonPage>
      <IonHeader className="agencias-header" mode="md">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="Volver" />
          </IonButtons>
          <IonTitle>Agencias</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="agencias-container">
          {/* Botón agregar */}
          <button className="agencias-add-btn" onClick={() => setShowAddAlert(true)}>
            <IonIcon icon={add} />
            Nueva Agencia
          </button>

          {/* Lista de agencias */}
          {agencias.length === 0 ? (
            <div className="agencias-empty">
              <p>No hay agencias configuradas</p>
            </div>
          ) : (
            <div className="agencias-list">
              {agencias.map((agencia) => (
                <div key={agencia.id} className="agencia-card">
                  <div className="agencia-card__info">
                    <span className="agencia-card__codigo">{agencia.codigo}</span>
                    <span className="agencia-card__nombre">{agencia.nombre}</span>
                    <span className="agencia-card__ubicaciones">
                      {agencia.ubicaciones.length} ubicación{agencia.ubicaciones.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <div className="agencia-card__actions">
                    <button
                      className="agencia-btn agencia-btn--ubicaciones"
                      onClick={() => history.push(`/agencias/${agencia.id}/ubicaciones`)}
                    >
                      <IonIcon icon={locationOutline} />
                    </button>
                    <button
                      className="agencia-btn agencia-btn--edit"
                      onClick={() => {
                        setAgenciaSeleccionada(agencia);
                        setShowEditAlert(true);
                      }}
                    >
                      <IonIcon icon={pencil} />
                    </button>
                    <button
                      className="agencia-btn agencia-btn--delete"
                      onClick={() => {
                        setAgenciaSeleccionada(agencia);
                        setShowDeleteAlert(true);
                      }}
                    >
                      <IonIcon icon={trash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert: Agregar agencia */}
        <IonAlert
          isOpen={showAddAlert}
          onDidDismiss={() => setShowAddAlert(false)}
          header="Nueva Agencia"
          inputs={[
            { name: 'nombre', type: 'text', placeholder: 'Nombre (ej: Arauca)' },
            { name: 'codigo', type: 'text', placeholder: 'Código (ej: AR)', attributes: { maxlength: 4 } },
          ]}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Crear',
              handler: (data) => {
                agregarAgencia(data.nombre, data.codigo);
              },
            },
          ]}
        />

        {/* Alert: Editar agencia */}
        <IonAlert
          isOpen={showEditAlert}
          onDidDismiss={() => setShowEditAlert(false)}
          header="Editar Agencia"
          inputs={[
            {
              name: 'nombre',
              type: 'text',
              value: agenciaSeleccionada?.nombre || '',
              placeholder: 'Nombre',
            },
            {
              name: 'codigo',
              type: 'text',
              value: agenciaSeleccionada?.codigo || '',
              placeholder: 'Código',
              attributes: { maxlength: 4 },
            },
          ]}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Guardar',
              handler: (data) => {
                editarAgencia(data.nombre, data.codigo);
              },
            },
          ]}
        />

        {/* Alert: Confirmar eliminación */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Eliminar Agencia"
          message={`¿Seguro que deseas eliminar "${agenciaSeleccionada?.nombre}"? Se perderán sus ubicaciones.`}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Eliminar',
              role: 'destructive',
              handler: () => eliminarAgencia(),
            },
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
          color="dark"
        />
      </IonContent>
    </IonPage>
  );
};

export default GestionAgencias;
