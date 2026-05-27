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
import { add, pencil, trash } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { Agencia, Ubicacion } from '../types';
import { AgenciasService } from '../services/agencias.service';
import { useAuth } from '../context/AuthContext';
import './GestionUbicaciones.css';

const GestionUbicaciones: React.FC = () => {
  const { agenciaId } = useParams<{ agenciaId: string }>();
  const { user } = useAuth();
  const [agencia, setAgencia] = useState<Agencia | null>(null);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [showEditAlert, setShowEditAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<Ubicacion | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const cargarAgencia = useCallback(async () => {
    const agencias = await AgenciasService.getAgenciasForUser(user);
    const encontrada = agencias.find((a) => a.id === agenciaId);
    if (encontrada) {
      setAgencia(encontrada);
    }
  }, [agenciaId, user]);

  useIonViewWillEnter(() => {
    cargarAgencia();
  });

  const guardarAgencia = async (agenciaActualizada: Agencia) => {
    const agencias = await AgenciasService.getCached();
    const actualizadas = agencias.map((a) =>
      a.id === agenciaActualizada.id ? agenciaActualizada : a
    );
    await AgenciasService.saveCache(actualizadas);
    setAgencia(agenciaActualizada);
  };

  const agregarUbicacion = async (nombre: string) => {
    if (!agencia || !nombre.trim()) return;

    const nueva: Ubicacion = {
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
    };

    const actualizada: Agencia = {
      ...agencia,
      ubicaciones: [...agencia.ubicaciones, nueva],
    };
    await guardarAgencia(actualizada);
    setToastMessage(`Ubicación "${nueva.nombre}" creada`);
    setShowToast(true);
  };

  const editarUbicacion = async (nombre: string) => {
    if (!agencia || !ubicacionSeleccionada || !nombre.trim()) return;

    const actualizada: Agencia = {
      ...agencia,
      ubicaciones: agencia.ubicaciones.map((u) =>
        u.id === ubicacionSeleccionada.id ? { ...u, nombre: nombre.trim() } : u
      ),
    };
    await guardarAgencia(actualizada);
    setToastMessage('Ubicación actualizada');
    setShowToast(true);
  };

  const eliminarUbicacion = async () => {
    if (!agencia || !ubicacionSeleccionada) return;

    const actualizada: Agencia = {
      ...agencia,
      ubicaciones: agencia.ubicaciones.filter((u) => u.id !== ubicacionSeleccionada.id),
    };
    await guardarAgencia(actualizada);
    setToastMessage(`Ubicación "${ubicacionSeleccionada.nombre}" eliminada`);
    setShowToast(true);
    setUbicacionSeleccionada(null);
  };

  return (
    <IonPage>
      <IonHeader className="ubicaciones-header" mode="md">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/agencias" text="Volver" />
          </IonButtons>
          <IonTitle>{agencia ? `${agencia.codigo} - Ubicaciones` : 'Ubicaciones'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="ubicaciones-container">
          {agencia && (
            <div className="ubicaciones-agencia-info">
              <span className="ubicaciones-agencia-info__codigo">{agencia.codigo}</span>
              <span className="ubicaciones-agencia-info__nombre">{agencia.nombre}</span>
            </div>
          )}

          {/* Botón agregar */}
          <button className="ubicaciones-add-btn" onClick={() => setShowAddAlert(true)}>
            <IonIcon icon={add} />
            Nueva Ubicación
          </button>

          {/* Lista de ubicaciones */}
          {!agencia || agencia.ubicaciones.length === 0 ? (
            <div className="ubicaciones-empty">
              <p>No hay ubicaciones configuradas para esta agencia</p>
              <p className="ubicaciones-empty__hint">
                Agrega ubicaciones como: Taquilla, Carga, Parqueadero, Oficina...
              </p>
            </div>
          ) : (
            <div className="ubicaciones-list">
              {agencia.ubicaciones.map((ubicacion) => (
                <div key={ubicacion.id} className="ubicacion-card">
                  <span className="ubicacion-card__nombre">{ubicacion.nombre}</span>
                  <div className="ubicacion-card__actions">
                    <button
                      className="ubicacion-btn ubicacion-btn--edit"
                      onClick={() => {
                        setUbicacionSeleccionada(ubicacion);
                        setShowEditAlert(true);
                      }}
                    >
                      <IonIcon icon={pencil} />
                    </button>
                    <button
                      className="ubicacion-btn ubicacion-btn--delete"
                      onClick={() => {
                        setUbicacionSeleccionada(ubicacion);
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

        {/* Alert: Agregar ubicación */}
        <IonAlert
          isOpen={showAddAlert}
          onDidDismiss={() => setShowAddAlert(false)}
          header="Nueva Ubicación"
          inputs={[
            { name: 'nombre', type: 'text', placeholder: 'Ej: Taquilla, Carga, Parqueadero...' },
          ]}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Crear',
              handler: (data) => {
                agregarUbicacion(data.nombre);
              },
            },
          ]}
        />

        {/* Alert: Editar ubicación */}
        <IonAlert
          isOpen={showEditAlert}
          onDidDismiss={() => setShowEditAlert(false)}
          header="Editar Ubicación"
          inputs={[
            {
              name: 'nombre',
              type: 'text',
              value: ubicacionSeleccionada?.nombre || '',
              placeholder: 'Nombre de ubicación',
            },
          ]}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Guardar',
              handler: (data) => {
                editarUbicacion(data.nombre);
              },
            },
          ]}
        />

        {/* Alert: Confirmar eliminación */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Eliminar Ubicación"
          message={`¿Seguro que deseas eliminar "${ubicacionSeleccionada?.nombre}"?`}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Eliminar',
              role: 'destructive',
              handler: () => eliminarUbicacion(),
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

export default GestionUbicaciones;
