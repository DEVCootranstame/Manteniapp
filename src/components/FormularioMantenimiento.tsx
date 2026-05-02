import React, { useState, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonLoading,
  IonAlert,
  IonToast,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import { camera, close, save } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';
import { useHistory } from 'react-router-dom';
import { Mantenimiento, Agencia, STORAGE_KEY, AGENCIAS_STORAGE_KEY } from '../types';
import { useIonViewWillEnter } from '@ionic/react';
import './FormularioMantenimiento.css';

function generarId(): string {
  return crypto.randomUUID();
}

function obtenerFechaHora(): { fecha: string; hora: string } {
  const now = new Date();
  const fecha = now.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const hora = now.toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return { fecha, hora };
}

const FormularioMantenimiento: React.FC = () => {
  const history = useHistory();

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [agenciaId, setAgenciaId] = useState('');
  const [ubicacionId, setUbicacionId] = useState('');

  const [nombreEquipo, setNombreEquipo] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [mantenimientoRealizado, setMantenimientoRealizado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const cargarAgencias = useCallback(async () => {
    const { value } = await Preferences.get({ key: AGENCIAS_STORAGE_KEY });
    if (value) {
      setAgencias(JSON.parse(value));
    }
  }, []);

  useIonViewWillEnter(() => {
    cargarAgencias();
  });

  const agenciaSeleccionada = agencias.find((a) => a.id === agenciaId);
  const ubicacionesDisponibles = agenciaSeleccionada?.ubicaciones || [];

  const marcarTocado = (campo: string) => {
    setTouched((prev) => ({ ...prev, [campo]: true }));
  };

  const tomarFoto = async () => {
    if (fotos.length >= 3) {
      setAlertHeader('Límite alcanzado');
      setAlertMessage('Solo puedes tomar hasta 3 fotos por equipo. Elimina una para tomar otra.');
      setShowAlert(true);
      return;
    }

    try {
      const image = await Camera.getPhoto({
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        correctOrientation: true,
        width: 1024,
        height: 1024,
      });

      if (image.base64String) {
        setFotos((prev) => [...prev, image.base64String!]);
        setToastMessage(`Foto ${fotos.length + 1} capturada`);
        setShowToast(true);
      }
    } catch (error: any) {
      console.error('Error al tomar foto:', error);
      if (!error?.message?.includes('cancel') && !error?.message?.includes('User cancelled')) {
        setAlertHeader('Error');
        setAlertMessage(`No se pudo tomar la foto: ${error?.message || 'Error desconocido'}`);
        setShowAlert(true);
      }
    }
  };

  const eliminarFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
    setToastMessage('Foto eliminada');
    setShowToast(true);
  };

  const formularioValido = (): boolean => {
    return (
      agenciaId.length > 0 &&
      ubicacionId.length > 0 &&
      nombreEquipo.trim().length > 0 &&
      proveedor.trim().length > 0 &&
      mantenimientoRealizado.trim().length > 0 &&
      observaciones.trim().length > 0
    );
  };

  const limpiarFormulario = () => {
    setAgenciaId('');
    setUbicacionId('');
    setNombreEquipo('');
    setProveedor('');
    setMantenimientoRealizado('');
    setObservaciones('');
    setFotos([]);
    setTouched({});
  };

  const guardarRegistro = async () => {
    if (!formularioValido()) {
      setTouched({
        agenciaId: true,
        ubicacionId: true,
        nombreEquipo: true,
        proveedor: true,
        mantenimientoRealizado: true,
        observaciones: true,
      });
      setAlertHeader('Campos incompletos');
      setAlertMessage('Por favor completa todos los campos obligatorios antes de guardar.');
      setShowAlert(true);
      return;
    }

    setLoading(true);
    setLoadingMessage('Guardando registro localmente...');

    try {
      const { fecha, hora } = obtenerFechaHora();

      const nuevoRegistro: Mantenimiento = {
        id: generarId(),
        nombreEquipo: nombreEquipo.trim(),
        proveedor: proveedor.trim(),
        mantenimientoRealizado: mantenimientoRealizado.trim(),
        observaciones: observaciones.trim(),
        fecha,
        hora,
        fotos: [...fotos],
        sincronizado: false,
        agenciaId,
        ubicacionId,
      };

      const { value } = await Preferences.get({ key: STORAGE_KEY });
      const registrosExistentes: Mantenimiento[] = value ? JSON.parse(value) : [];
      registrosExistentes.unshift(nuevoRegistro);

      await Preferences.set({
        key: STORAGE_KEY,
        value: JSON.stringify(registrosExistentes),
      });

      setLoading(false);
      limpiarFormulario();
      setToastMessage('Registro guardado exitosamente');
      setShowToast(true);

      setTimeout(() => {
        history.push('/home');
      }, 800);
    } catch (error: any) {
      setLoading(false);
      console.error('Error guardando registro:', error);
      setAlertHeader('Error al guardar');
      setAlertMessage(
        `No se pudo guardar el registro: ${error?.message || 'Error desconocido'}. Intenta de nuevo.`
      );
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonHeader className="form-header" mode="md">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="Volver" />
          </IonButtons>
          <IonTitle>Nuevo Mantenimiento</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="form-container">
          {/* Campo: Agencia */}
          <div className="form-field">
            <label className="form-field__label">
              Agencia <span className="form-field__required">*</span>
            </label>
            <select
              className="neo-select"
              value={agenciaId}
              onChange={(e) => {
                setAgenciaId(e.target.value);
                setUbicacionId('');
              }}
              onBlur={() => marcarTocado('agenciaId')}
            >
              <option value="">-- Selecciona una agencia --</option>
              {agencias.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.codigo} - {a.nombre}
                </option>
              ))}
            </select>
            {touched.agenciaId && agenciaId === '' && (
              <div className="form-field__error">Selecciona una agencia</div>
            )}
          </div>

          {/* Campo: Ubicación */}
          <div className="form-field">
            <label className="form-field__label">
              Ubicación <span className="form-field__required">*</span>
            </label>
            <select
              className="neo-select"
              value={ubicacionId}
              onChange={(e) => setUbicacionId(e.target.value)}
              onBlur={() => marcarTocado('ubicacionId')}
              disabled={!agenciaId}
            >
              <option value="">
                {agenciaId ? '-- Selecciona ubicación --' : '-- Primero selecciona agencia --'}
              </option>
              {ubicacionesDisponibles.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
            {touched.ubicacionId && ubicacionId === '' && agenciaId !== '' && (
              <div className="form-field__error">Selecciona una ubicación</div>
            )}
          </div>

          {/* Campo: Nombre del equipo */}
          <div className="form-field">
            <label className="form-field__label">
              Nombre del Equipo <span className="form-field__required">*</span>
            </label>
            <input
              className="neo-input"
              value={nombreEquipo}
              onChange={(e) => setNombreEquipo(e.target.value)}
              onBlur={() => marcarTocado('nombreEquipo')}
              placeholder="Ej: PC-Escritorio-001, Laptop HP ProBook..."
            />
            {touched.nombreEquipo && nombreEquipo.trim() === '' && (
              <div className="form-field__error">Este campo es obligatorio</div>
            )}
          </div>

          {/* Campo: Proveedor */}
          <div className="form-field">
            <label className="form-field__label">
              Proveedor <span className="form-field__required">*</span>
            </label>
            <input
              className="neo-input"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              onBlur={() => marcarTocado('proveedor')}
              placeholder="Ej: HP, Dell, Lenovo, Compusoluciones..."
            />
            {touched.proveedor && proveedor.trim() === '' && (
              <div className="form-field__error">Este campo es obligatorio</div>
            )}
          </div>

          {/* Campo: Mantenimiento Realizado */}
          <div className="form-field">
            <label className="form-field__label">
              Mantenimiento Realizado <span className="form-field__required">*</span>
            </label>
            <textarea
              className="neo-textarea"
              value={mantenimientoRealizado}
              onChange={(e) => setMantenimientoRealizado(e.target.value)}
              onBlur={() => marcarTocado('mantenimientoRealizado')}
              placeholder="Limpieza interna, cambio de pasta térmica, actualización de drivers..."
              rows={4}
            />
            {touched.mantenimientoRealizado && mantenimientoRealizado.trim() === '' && (
              <div className="form-field__error">Este campo es obligatorio</div>
            )}
          </div>

          {/* Campo: Observaciones */}
          <div className="form-field">
            <label className="form-field__label">
              Observaciones <span className="form-field__required">*</span>
            </label>
            <textarea
              className="neo-textarea"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              onBlur={() => marcarTocado('observaciones')}
              placeholder="Daños encontrados, piezas faltantes, recomendaciones..."
              rows={3}
            />
            {touched.observaciones && observaciones.trim() === '' && (
              <div className="form-field__error">Este campo es obligatorio</div>
            )}
          </div>

          {/* Sección de fotos */}
          <div className="form-photos">
            <div className="form-photos__header">
              <h3 className="form-photos__title">📷 Fotos ({fotos.length}/3)</h3>
              <button
                className="form-camera-btn"
                onClick={tomarFoto}
                disabled={fotos.length >= 3}
              >
                <IonIcon icon={camera} />
                Tomar Foto
              </button>
            </div>

            {fotos.length === 0 ? (
              <p className="form-photos__empty">
                Aún no has tomado fotos. Presiona "Tomar Foto" para agregar.
              </p>
            ) : (
              <div className="form-photos__grid">
                {fotos.map((foto, index) => (
                  <div key={index} className="form-photos__item">
                    <img
                      className="form-photos__img"
                      src={`data:image/jpeg;base64,${foto}`}
                      alt={`Foto ${index + 1}`}
                    />
                    <button
                      className="form-photos__delete-btn"
                      onClick={() => eliminarFoto(index)}
                    >
                      <IonIcon icon={close} />
                    </button>
                    <div className="form-photos__caption">Foto {index + 1}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón guardar */}
          <button className="form-save-btn" onClick={guardarRegistro}>
            <IonIcon icon={save} />
            Guardar Mantenimiento
          </button>

          <p className="form-help-text">
            El registro se guardará localmente. Sincroniza con Supabase cuando tengas conexión Wi-Fi.
          </p>
        </div>

        <IonLoading isOpen={loading} message={loadingMessage} />
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={alertHeader}
          message={alertMessage}
          buttons={['Aceptar']}
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

export default FormularioMantenimiento;
