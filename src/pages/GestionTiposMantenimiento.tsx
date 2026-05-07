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
import { Preferences } from '@capacitor/preferences';
import { TipoMantenimiento, TIPOS_MANTENIMIENTO_STORAGE_KEY } from '../types';
import './GestionTiposMantenimiento.css';

const TIPOS_INICIALES: TipoMantenimiento[] = [
  { id: '1', nombre: 'Preventivo' },
  { id: '2', nombre: 'Correctivo' },
  { id: '3', nombre: 'Predictivo' },
];

const GestionTiposMantenimiento: React.FC = () => {
  const [tipos, setTipos] = useState<TipoMantenimiento[]>([]);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [showEditAlert, setShowEditAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoMantenimiento | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const cargarTipos = useCallback(async () => {
    const { value } = await Preferences.get({ key: TIPOS_MANTENIMIENTO_STORAGE_KEY });
    if (value) {
      setTipos(JSON.parse(value));
    } else {
      await Preferences.set({
        key: TIPOS_MANTENIMIENTO_STORAGE_KEY,
        value: JSON.stringify(TIPOS_INICIALES),
      });
      setTipos(TIPOS_INICIALES);
    }
  }, []);

  useIonViewWillEnter(() => {
    cargarTipos();
  });

  const guardarTipos = async (nuevos: TipoMantenimiento[]) => {
    await Preferences.set({
      key: TIPOS_MANTENIMIENTO_STORAGE_KEY,
      value: JSON.stringify(nuevos),
    });
    setTipos(nuevos);
  };

  const agregarTipo = async (nombre: string) => {
    if (!nombre.trim()) return;

    const nuevo: TipoMantenimiento = {
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
    };

    const actualizados = [...tipos, nuevo];
    await guardarTipos(actualizados);
    setToastMessage(`Tipo "${nuevo.nombre}" creado`);
    setShowToast(true);
  };

  const editarTipo = async (nombre: string) => {
    if (!tipoSeleccionado || !nombre.trim()) return;

    const actualizados = tipos.map((t) =>
      t.id === tipoSeleccionado.id ? { ...t, nombre: nombre.trim() } : t
    );
    await guardarTipos(actualizados);
    setToastMessage('Tipo actualizado');
    setShowToast(true);
  };

  const eliminarTipo = async () => {
    if (!tipoSeleccionado) return;
    const actualizados = tipos.filter((t) => t.id !== tipoSeleccionado.id);
    await guardarTipos(actualizados);
    setToastMessage(`Tipo "${tipoSeleccionado.nombre}" eliminado`);
    setShowToast(true);
    setTipoSeleccionado(null);
  };

  return (
    <IonPage>
      <IonHeader className="tipos-header" mode="md">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="Volver" />
          </IonButtons>
          <IonTitle>Tipos de Mantenimiento</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="tipos-container">
          <button className="tipos-add-btn" onClick={() => setShowAddAlert(true)}>
            <IonIcon icon={add} />
            Nuevo Tipo
          </button>

          {tipos.length === 0 ? (
            <div className="tipos-empty">
              <p>No hay tipos de mantenimiento configurados</p>
            </div>
          ) : (
            <div className="tipos-list">
              {tipos.map((tipo) => (
                <div key={tipo.id} className="tipo-card">
                  <div className="tipo-card__info">
                    <span className="tipo-card__nombre">{tipo.nombre}</span>
                  </div>
                  <div className="tipo-card__actions">
                    <button
                      className="tipo-btn tipo-btn--edit"
                      onClick={() => {
                        setTipoSeleccionado(tipo);
                        setShowEditAlert(true);
                      }}
                    >
                      <IonIcon icon={pencil} />
                    </button>
                    <button
                      className="tipo-btn tipo-btn--delete"
                      onClick={() => {
                        setTipoSeleccionado(tipo);
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

        {/* Alert: Agregar tipo */}
        <IonAlert
          isOpen={showAddAlert}
          onDidDismiss={() => setShowAddAlert(false)}
          header="Nuevo Tipo de Mantenimiento"
          inputs={[
            { name: 'nombre', type: 'text', placeholder: 'Nombre (ej: Preventivo)' },
          ]}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Crear',
              handler: (data) => {
                agregarTipo(data.nombre);
              },
            },
          ]}
        />

        {/* Alert: Editar tipo */}
        <IonAlert
          isOpen={showEditAlert}
          onDidDismiss={() => setShowEditAlert(false)}
          header="Editar Tipo"
          inputs={[
            {
              name: 'nombre',
              type: 'text',
              value: tipoSeleccionado?.nombre || '',
              placeholder: 'Nombre',
            },
          ]}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Guardar',
              handler: (data) => {
                editarTipo(data.nombre);
              },
            },
          ]}
        />

        {/* Alert: Confirmar eliminar */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Eliminar Tipo"
          message={`¿Eliminar "${tipoSeleccionado?.nombre}"? Los registros existentes conservarán su tipo.`}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Eliminar',
              role: 'destructive',
              handler: () => {
                eliminarTipo();
              },
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

export default GestionTiposMantenimiento;
