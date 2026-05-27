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
import { useHistory } from 'react-router-dom';
import { Agencia } from '../types';
import { AgenciasService } from '../services/agencias.service';
import { useAuth } from '../context/AuthContext';
import './GestionAgencias.css';

const GestionAgencias: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [showEditAlert, setShowEditAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [agenciaSeleccionada, setAgenciaSeleccionada] = useState<Agencia | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const cargarAgencias = useCallback(async () => {
    // Limpiar cache viejo con IDs incorrectos y forzar sync con API
    const data = await AgenciasService.getAgenciasForUser(user);
    setAgencias(data);
  }, [user]);

  useIonViewWillEnter(() => {
    cargarAgencias();
  });

  const guardarAgencias = async (nuevas: Agencia[]) => {
    await AgenciasService.saveCache(nuevas);
    setAgencias(nuevas);
  };

  const agregarAgencia = async (nombre: string, codigo: string) => {
    if (!nombre.trim() || !codigo.trim()) return;

    try {
      const nueva = await AgenciasService.createAgencia(nombre.trim(), codigo.trim().toUpperCase());
      setAgencias((prev) => [...prev, nueva]);
      setToastMessage(`Agencia "${nueva.nombre}" creada`);
    } catch {
      setToastMessage('Error al crear agencia. Se guardará localmente.');
      const nueva: Agencia = {
        id: crypto.randomUUID(),
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        ubicaciones: [],
      };
      const actualizadas = [...agencias, nueva];
      await guardarAgencias(actualizadas);
    }
    setShowToast(true);
  };

  const editarAgencia = async (nombre: string, codigo: string) => {
    if (!agenciaSeleccionada || !nombre.trim() || !codigo.trim()) return;

    try {
      const updated = await AgenciasService.updateAgencia(
        agenciaSeleccionada.id,
        nombre.trim(),
        codigo.trim().toUpperCase()
      );
      setAgencias((prev) => prev.map((a) => (a.id === updated.id ? { ...updated, ubicaciones: a.ubicaciones } : a)));
      setToastMessage('Agencia actualizada');
    } catch {
      setToastMessage('Error al actualizar. Cambio guardado localmente.');
      const actualizadas = agencias.map((a) =>
        a.id === agenciaSeleccionada.id
          ? { ...a, nombre: nombre.trim(), codigo: codigo.trim().toUpperCase() }
          : a
      );
      await guardarAgencias(actualizadas);
    }
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
          {/* Botón agregar — solo admin */}
          {isAdmin && (
            <button className="agencias-add-btn" onClick={() => setShowAddAlert(true)}>
              <IonIcon icon={add} />
              Nueva Agencia
            </button>
          )}

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
                    {isAdmin && (
                      <>
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
                      </>
                    )}
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
