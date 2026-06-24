import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonIcon, IonLoading, IonAlert, IonToast } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  arrowBackOutline, trashBinOutline, calendarOutline,
  documentTextOutline, cameraOutline, camera, close,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { EquiposService, ComputadorDetalle } from '../../services/equipos.service';
import { SolicitudesService } from '../../services/solicitudes.service';
import { useAuth } from '../../context/AuthContext';
import './DarDeBaja.css';

const DarDeBaja: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { user } = useAuth();

  const [equipo, setEquipo] = useState<ComputadorDetalle | null>(null);
  const [loadingEquipo, setLoadingEquipo] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const [fechaBaja, setFechaBaja] = useState(today);
  const [motivo, setMotivo] = useState('');
  const [fotos, setFotos] = useState<(string | null)[]>([null, null, null]);

  const [enviando, setEnviando] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertHeader, setAlertHeader] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    EquiposService.getComputador(Number(id))
      .then(setEquipo)
      .catch(() => {
        setAlertHeader('Error');
        setAlertMsg('No se pudo cargar la información del equipo.');
        setShowAlert(true);
      })
      .finally(() => setLoadingEquipo(false));
  }, [id]);

  const tomarFoto = async (index: number) => {
    if (fotos[index]) return;
    try {
      const image = await Camera.getPhoto({
        quality: 60,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
        correctOrientation: true,
        width: 1024,
        height: 1024,
      });
      if (image.base64String) {
        setFotos(prev => prev.map((f, i) => i === index ? image.base64String! : f));
        setToastMsg(`Foto ${index + 1} capturada`);
        setShowToast(true);
      }
    } catch (e: any) {
      if (!e?.message?.includes('cancel') && !e?.message?.includes('User cancelled')) {
        setAlertHeader('Error');
        setAlertMsg(`No se pudo tomar la foto: ${e?.message || 'Error desconocido'}`);
        setShowAlert(true);
      }
    }
  };

  const eliminarFoto = (index: number) => {
    setFotos(prev => prev.map((f, i) => i === index ? null : f));
  };

  const formularioValido = () =>
    fechaBaja.trim().length > 0 && motivo.trim().length > 0 && fotos[0] !== null;

  const confirmar = () => {
    setTouched(true);
    if (!formularioValido()) {
      setAlertHeader('Campos incompletos');
      setAlertMsg('La fecha, el motivo y la foto principal son obligatorios.');
      setShowAlert(true);
      return;
    }
    setShowConfirm(true);
  };

  const ejecutarBaja = async () => {
    if (!equipo || !user) return;
    setEnviando(true);
    try {
      await SolicitudesService.createSolicitud({
        tipo: 'baja',
        computador_id: equipo.id,
        agencia_id: equipo.agencia?.id ?? 0,
        creado_por: user.id,
        motivo_cambio: motivo.trim(),
        datos_equipo: {
          fecha_baja: fechaBaja,
          motivo_baja: motivo.trim(),
          fotos_baja: fotos.filter(Boolean),
        },
      });
      setToastMsg('Solicitud de baja enviada. Pendiente de aprobación.');
      setShowToast(true);
      setTimeout(() => history.replace('/solicitudes'), 1500);
    } catch (e: any) {
      setAlertHeader('Error al procesar');
      setAlertMsg(e?.message || 'No se pudo enviar la solicitud. Intenta de nuevo.');
      setShowAlert(true);
    } finally {
      setEnviando(false);
    }
  };

  const fotoLabels = ['Principal (obligatoria)', 'Adicional 1 (opcional)', 'Adicional 2 (opcional)'];

  return (
    <IonPage>
      <IonContent className="baja-content" fullscreen>

        {/* Header */}
        <div className="baja-header">
          <button className="baja-header__back" onClick={() => history.goBack()}>
            <IonIcon icon={arrowBackOutline} />
          </button>
          <div className="baja-header__info">
            <h1 className="baja-header__title">Solicitud de Baja</h1>
            {equipo && <p className="baja-header__code">{equipo.Codigo}</p>}
          </div>
          <div className="baja-header__icon-wrap">
            <IonIcon icon={trashBinOutline} />
          </div>
        </div>

        {loadingEquipo ? (
          <div className="baja-loading">Cargando equipo...</div>
        ) : (
          <div className="baja-form">

            {/* Aviso */}
            <div className="baja-warning-banner">
              <IonIcon icon={trashBinOutline} />
              <div>
                <p className="baja-warning-banner__title">Requiere aprobación</p>
                <p className="baja-warning-banner__desc">Se creará una solicitud de baja que debe ser aprobada por un administrador.</p>
              </div>
            </div>

            {/* Sección: Fecha */}
            <div className="baja-section">
              <div className="baja-section__header">
                <div className="baja-section__icon">
                  <IonIcon icon={calendarOutline} />
                </div>
                <div>
                  <h3 className="baja-section__title">Fecha de Baja</h3>
                  <p className="baja-section__subtitle">¿Cuándo se retira el equipo?</p>
                </div>
              </div>
              <div className="baja-section__body">
                <div className="baja-field">
                  <label className="baja-field__label">
                    Fecha <span className="baja-field__required">*</span>
                  </label>
                  <input
                    type="date"
                    className="baja-input"
                    value={fechaBaja}
                    max={today}
                    onChange={e => setFechaBaja(e.target.value)}
                  />
                  {touched && !fechaBaja && (
                    <div className="baja-field__error">La fecha es obligatoria</div>
                  )}
                </div>
              </div>
            </div>

            {/* Sección: Motivo */}
            <div className="baja-section">
              <div className="baja-section__header">
                <div className="baja-section__icon baja-section__icon--orange">
                  <IonIcon icon={documentTextOutline} />
                </div>
                <div>
                  <h3 className="baja-section__title">Motivo</h3>
                  <p className="baja-section__subtitle">Explica por qué se da de baja el equipo</p>
                </div>
              </div>
              <div className="baja-section__body">
                <div className="baja-field">
                  <label className="baja-field__label">
                    Motivo de baja <span className="baja-field__required">*</span>
                  </label>
                  <textarea
                    className="baja-textarea"
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    placeholder="Ej: Equipo obsoleto, daño irreparable, robo, pérdida..."
                    rows={4}
                  />
                  {touched && motivo.trim() === '' && (
                    <div className="baja-field__error">El motivo es obligatorio</div>
                  )}
                </div>
              </div>
            </div>

            {/* Sección: Fotos */}
            <div className="baja-section">
              <div className="baja-section__header">
                <div className="baja-section__icon baja-section__icon--purple">
                  <IonIcon icon={cameraOutline} />
                </div>
                <div>
                  <h3 className="baja-section__title">Evidencia Fotográfica</h3>
                  <p className="baja-section__subtitle">1 obligatoria · 2 opcionales</p>
                </div>
              </div>
              <div className="baja-section__body">
                <div className="baja-fotos">
                  {fotos.map((foto, index) => (
                    <div key={index} className="baja-foto-slot">
                      <p className="baja-foto-slot__label">
                        {fotoLabels[index]}
                        {index === 0 && touched && !fotos[0] && (
                          <span className="baja-field__required"> *</span>
                        )}
                      </p>
                      {foto ? (
                        <div className="baja-foto-item">
                          <img
                            src={`data:image/jpeg;base64,${foto}`}
                            alt={`Foto ${index + 1}`}
                            className="baja-foto-item__img"
                          />
                          <button className="baja-foto-item__delete" onClick={() => eliminarFoto(index)}>
                            <IonIcon icon={close} />
                          </button>
                        </div>
                      ) : (
                        <button className="baja-foto-add" onClick={() => tomarFoto(index)}>
                          <IonIcon icon={camera} />
                          <span>Tomar foto</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {touched && !fotos[0] && (
                  <div className="baja-field__error">La foto principal es obligatoria</div>
                )}
              </div>
            </div>

            {/* Botón */}
            <button className="baja-btn-submit" onClick={confirmar}>
              <IonIcon icon={trashBinOutline} />
              Enviar Solicitud de Baja
            </button>

          </div>
        )}

        <IonLoading isOpen={enviando} message="Enviando solicitud..." />

        <IonAlert
          isOpen={showConfirm}
          onDidDismiss={() => setShowConfirm(false)}
          header="¿Enviar solicitud de baja?"
          message={`Se enviará una solicitud para dar de baja el equipo ${equipo?.Codigo}. Quedará pendiente de aprobación.`}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Enviar solicitud', handler: ejecutarBaja, cssClass: 'alert-btn-danger' },
          ]}
        />

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={alertHeader}
          message={alertMsg}
          buttons={['Aceptar']}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={2500}
          position="bottom"
          color="dark"
        />

      </IonContent>
    </IonPage>
  );
};

export default DarDeBaja;
