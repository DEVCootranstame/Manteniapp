import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent,
  IonSearchbar, IonIcon, IonSpinner, IonAlert,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  personOutline, addOutline, checkmarkCircleOutline,
  documentTextOutline, sendOutline,
  cloudOfflineOutline, timeOutline, chevronBackOutline,
  chevronForwardOutline, desktopOutline, checkmarkDoneOutline,
} from 'ionicons/icons';
import { EquiposService, ComputadorDetalle } from '../../services/equipos.service';
import { ResponsablesService } from '../../services/responsables.service';
import { SolicitudesService } from '../../services/solicitudes.service';
import { OfflineQueueService } from '../../services/offline-queue.service';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../hooks/useNetwork';
import { Responsable } from '../../types/equipo.types';
import FirmaCanvas from '../../components/FirmaCanvas';
import './CambiarResponsable.css';

type Paso = 1 | 2 | 3 | 4;

const CambiarResponsable: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { user } = useAuth();
  const { isOnline, refreshPendingCount } = useNetwork();
  const [paso, setPaso] = useState<Paso>(1);
  const [equipo, setEquipo] = useState<ComputadorDetalle | null>(null);
  const [loadingEquipo, setLoadingEquipo] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Responsable[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [modoCrear, setModoCrear] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoDocumento, setNuevoDocumento] = useState('');
  const [nuevoCargo, setNuevoCargo] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [responsableSeleccionado, setResponsableSeleccionado] = useState<Responsable | null>(null);
  const [esNuevoResponsable, setEsNuevoResponsable] = useState(false);
  const [firmaEntrega, setFirmaEntrega] = useState('');
  const [firmaRecibe, setFirmaRecibe] = useState('');
  const [firmaGestor, setFirmaGestor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [guardadoOffline, setGuardadoOffline] = useState(false);

  useEffect(() => {
    EquiposService.getComputador(Number(id))
      .then(setEquipo)
      .finally(() => setLoadingEquipo(false));
  }, [id]);

  const buscarResponsables = async (q: string) => {
    setBusqueda(q);
    if (!isOnline) {
      const recientes = await ResponsablesService.getRecientes();
      if (!q || q.length < 2) { setResultados(recientes); return; }
      const lower = q.toLowerCase();
      setResultados(recientes.filter(r =>
        r.nombre.toLowerCase().includes(lower) || r.numero_documento.includes(q)
      ));
      return;
    }
    if (!q || q.length < 2) { setResultados([]); return; }
    setBuscando(true);
    try { setResultados(await ResponsablesService.getResponsables(q)); }
    finally { setBuscando(false); }
  };

  useEffect(() => {
    if (paso === 2 && !isOnline) {
      ResponsablesService.getRecientes().then(setResultados);
    }
  }, [paso, isOnline]);

  const seleccionarResponsable = async (r: Responsable) => {
    await ResponsablesService.saveReciente(r);
    setResponsableSeleccionado(r);
    setEsNuevoResponsable(false);
    setPaso(3);
  };

  const crearYSeleccionar = async () => {
    if (!nuevoNombre || !nuevoDocumento) {
      setAlertMsg('Nombre y documento son obligatorios');
      setShowAlert(true);
      return;
    }
    if (!isOnline) {
      const tempResponsable: Responsable = {
        id: -Date.now(),
        nombre: nuevoNombre,
        numero_documento: nuevoDocumento,
        cargo: nuevoCargo || null,
        correo: nuevoCorreo || null,
      };
      setResponsableSeleccionado(tempResponsable);
      setEsNuevoResponsable(true);
      setPaso(3);
      return;
    }
    try {
      const r = await ResponsablesService.createResponsable({
        nombre: nuevoNombre,
        numero_documento: nuevoDocumento,
        cargo: nuevoCargo || undefined,
        correo: nuevoCorreo || undefined,
      });
      await ResponsablesService.saveReciente(r);
      setResponsableSeleccionado(r);
      setEsNuevoResponsable(false);
      setPaso(3);
    } catch (e: any) {
      setAlertMsg(e.message || 'Error al crear responsable');
      setShowAlert(true);
    }
  };

  const enviarSolicitud = async () => {
    if (!equipo || !responsableSeleccionado || !user) return;
    if (!firmaEntrega || !firmaRecibe || !firmaGestor) {
      setAlertMsg('Todas las firmas son obligatorias');
      setShowAlert(true);
      return;
    }
    setEnviando(true);
    try {
      if (!isOnline || esNuevoResponsable) {
        const steps: any[] = [];
        if (esNuevoResponsable) {
          steps.push({
            method: 'POST',
            endpoint: '/responsables',
            body: { nombre: nuevoNombre, numero_documento: nuevoDocumento, cargo: nuevoCargo || undefined, correo: nuevoCorreo || undefined },
            saveAs: 'resp_id',
            saveField: 'id',
          });
        }
        steps.push({
          method: 'POST',
          endpoint: '/solicitudes/actas',
          body: {
            computador_id: Number(equipo.id),
            responsable_entrega_id: equipo.responsable_info?.id ? Number(equipo.responsable_info.id) : undefined,
            responsable_recibe_id: esNuevoResponsable ? '__resp_id__' : Number(responsableSeleccionado.id),
            firma_entrega: firmaEntrega, firma_recibe: firmaRecibe, firma_gestor: firmaGestor, observaciones,
          },
          ...(esNuevoResponsable ? { useFrom: { responsable_recibe_id: 'resp_id' } } : {}),
        });
        steps.push({
          method: 'POST',
          endpoint: '/solicitudes',
          body: {
            tipo: 'cambio_responsable',
            computador_id: Number(equipo.id),
            responsable_anterior_id: equipo.responsable_info?.id ? Number(equipo.responsable_info.id) : undefined,
            responsable_nuevo_id: esNuevoResponsable ? '__resp_id__' : Number(responsableSeleccionado.id),
            agencia_id: Number(equipo.agencia?.id ?? user.agencia_id!),
            creado_por: Number(user.id), observaciones,
          },
          ...(esNuevoResponsable ? { useFrom: { responsable_nuevo_id: 'resp_id' } } : {}),
        });
        await OfflineQueueService.add({ label: `Cambio responsable: ${equipo.Codigo} -> ${responsableSeleccionado.nombre}`, steps });
        await refreshPendingCount();
        setGuardadoOffline(true);
        setPaso(4);
      } else {
        await SolicitudesService.createActa({
          computador_id: Number(equipo.id),
          responsable_entrega_id: equipo.responsable_info?.id ? Number(equipo.responsable_info.id) : undefined,
          responsable_recibe_id: Number(responsableSeleccionado.id),
          firma_entrega: firmaEntrega, firma_recibe: firmaRecibe, firma_gestor: firmaGestor, observaciones,
        });
        await SolicitudesService.createSolicitud({
          tipo: 'cambio_responsable',
          computador_id: Number(equipo.id),
          responsable_anterior_id: equipo.responsable_info?.id ? Number(equipo.responsable_info.id) : undefined,
          responsable_nuevo_id: Number(responsableSeleccionado.id),
          agencia_id: Number(equipo.agencia?.id ?? user.agencia_id!),
          creado_por: Number(user.id), observaciones,
        });
        setGuardadoOffline(false);
        setPaso(4);
      }
    } catch (e: any) {
      setAlertMsg(e.message || 'Error al enviar solicitud');
      setShowAlert(true);
    } finally {
      setEnviando(false);
    }
  };

  const titulos: Record<Paso, string> = {
    1: 'Confirmar Cambio',
    2: 'Nuevo Responsable',
    3: 'Acta de Entrega',
    4: 'Listo',
  };

  const stepIcons = [desktopOutline, personOutline, documentTextOutline, checkmarkDoneOutline];

  const getInitials = (nombre: string) =>
    nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  if (loadingEquipo) return (
    <IonPage>
      <IonContent className="cambiar-responsable-content ion-text-center">
        <div style={{ paddingTop: '40%' }}><IonSpinner /></div>
      </IonContent>
    </IonPage>
  );

  return (
    <IonPage>
      <div className="wizard-header">
        <div className="wizard-header__top">
          <button className="wizard-header__back" onClick={() => {
            if (paso > 1 && paso < 4) setPaso((paso - 1) as Paso);
            else history.goBack();
          }}>
            <IonIcon icon={chevronBackOutline} />
          </button>
          <h2 className="wizard-header__title">{titulos[paso]}</h2>
          <span className="wizard-header__badge">Paso {paso} / 4</span>
        </div>
        <div className="wizard-stepper">
          {([1, 2, 3, 4] as Paso[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className="wizard-step">
                <div className={`wizard-step__circle wizard-step__circle--${paso > s ? 'done' : paso === s ? 'active' : 'pending'}`}>
                  {paso > s
                    ? <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 14 }} />
                    : <IonIcon icon={stepIcons[i]} style={{ fontSize: 13 }} />
                  }
                </div>
              </div>
              {i < 3 && (
                <div className={`wizard-step__line wizard-step__line--${paso > s ? 'done' : 'pending'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <IonContent className="cambiar-responsable-content">

        {!isOnline && paso < 4 && (
          <div className="offline-bar">
            <IonIcon icon={cloudOfflineOutline} />
            <span>Sin conexion - se guardara y enviara al reconectar</span>
          </div>
        )}

        {/* PASO 1 */}
        {paso === 1 && equipo && (
          <div className="paso-container">
            <div className="wizard-card">
              <div className="equipo-resumen">
                <div className="equipo-resumen__icon">
                  <IonIcon icon={desktopOutline} />
                </div>
                <h2 className="equipo-resumen__codigo">{equipo.Codigo}</h2>
                {equipo.agencia && <p className="equipo-resumen__agencia">{equipo.agencia.nombre}</p>}
              </div>
              <p className="wizard-card__label">
                <IonIcon icon={personOutline} />
                Responsable actual
              </p>
              {equipo.responsable_info ? (
                <div className="responsable-actual-row">
                  <div className="responsable-actual-row__avatar">
                    {getInitials(equipo.responsable_info.nombre)}
                  </div>
                  <div className="responsable-actual-row__info">
                    <p className="responsable-actual-row__nombre">{equipo.responsable_info.nombre}</p>
                    <p className="responsable-actual-row__doc">{equipo.responsable_info.numero_documento}</p>
                  </div>
                </div>
              ) : (
                <div className="sin-responsable-chip">
                  <IonIcon icon={personOutline} />
                  Sin responsable asignado
                </div>
              )}
              <div style={{ marginTop: 14 }}>
                <p className="aviso-texto">Se creara una solicitud que debe ser aprobada por un supervisor. Se generara un acta de entrega con firmas.</p>
              </div>
            </div>
            <button className="wizard-btn-primary" onClick={() => setPaso(2)}>
              Continuar
              <IonIcon icon={chevronForwardOutline} />
            </button>
          </div>
        )}

        {/* PASO 2 */}
        {paso === 2 && (
          <div className="paso-container">
            <div className="paso-tabs">
              <button className={!modoCrear ? 'active' : ''} onClick={() => setModoCrear(false)}>
                <IonIcon icon={personOutline} /> Buscar
              </button>
              <button className={modoCrear ? 'active' : ''} onClick={() => setModoCrear(true)}>
                <IonIcon icon={addOutline} /> Crear nuevo
              </button>
            </div>
            {!modoCrear ? (
              <>
                {!isOnline && (
                  <div className="offline-hint">
                    <IonIcon icon={timeOutline} />
                    <span>Mostrando responsables recientes guardados</span>
                  </div>
                )}
                <IonSearchbar
                  value={busqueda}
                  onIonInput={e => buscarResponsables(e.detail.value ?? '')}
                  placeholder="Nombre o documento..."
                  debounce={400}
                  className="wizard-searchbar"
                />
                {buscando && <div style={{ textAlign: 'center', padding: 8 }}><IonSpinner /></div>}
                <div className="responsable-result-list">
                  {resultados.map(r => (
                    <div key={r.id} className="responsable-result-item" onClick={() => seleccionarResponsable(r)}>
                      <div className="responsable-result-item__avatar">
                        {getInitials(r.nombre)}
                      </div>
                      <div className="responsable-result-item__info">
                        <p className="responsable-result-item__nombre">{r.nombre}</p>
                        <p className="responsable-result-item__meta">{r.numero_documento}{r.cargo ? ` - ${r.cargo}` : ''}</p>
                      </div>
                      <IonIcon icon={chevronForwardOutline} className="responsable-result-item__arrow" />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="wizard-card">
                {!isOnline && (
                  <div className="offline-hint" style={{ margin: '0 0 12px' }}>
                    <IonIcon icon={cloudOfflineOutline} />
                    <span>El responsable se creara al sincronizar</span>
                  </div>
                )}
                <div className="crear-form">
                  <div className="wizard-field">
                    <label className="wizard-field__label">Nombre completo *</label>
                    <input className="wizard-field__input" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Ej: Juan Perez" />
                  </div>
                  <div className="wizard-field">
                    <label className="wizard-field__label">Numero de documento *</label>
                    <input className="wizard-field__input" type="number" value={nuevoDocumento} onChange={e => setNuevoDocumento(e.target.value)} placeholder="Ej: 10234567890" />
                  </div>
                  <div className="wizard-field">
                    <label className="wizard-field__label">Cargo</label>
                    <input className="wizard-field__input" value={nuevoCargo} onChange={e => setNuevoCargo(e.target.value)} placeholder="Ej: Conductor" />
                  </div>
                  <div className="wizard-field">
                    <label className="wizard-field__label">Correo</label>
                    <input className="wizard-field__input" type="email" value={nuevoCorreo} onChange={e => setNuevoCorreo(e.target.value)} placeholder="correo@ejemplo.com" />
                  </div>
                  <button className="wizard-btn-primary" onClick={crearYSeleccionar} style={{ marginTop: 6 }}>
                    {isOnline ? 'Crear y continuar' : 'Guardar y continuar'}
                    <IonIcon icon={chevronForwardOutline} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASO 3 */}
        {paso === 3 && responsableSeleccionado && (
          <div className="paso-container">
            <div className="wizard-card">
              <p className="wizard-card__label"><IonIcon icon={personOutline} />Nuevo responsable</p>
              <div className="responsable-seleccionado-chip">
                <IonIcon icon={checkmarkCircleOutline} className="responsable-seleccionado-chip__icon" />
                <div>
                  <p className="responsable-seleccionado-chip__nombre">{responsableSeleccionado.nombre}</p>
                  <p className="responsable-seleccionado-chip__doc">{responsableSeleccionado.numero_documento}</p>
                </div>
              </div>
            </div>
            <div className="wizard-card">
              <div className="firmas-title">
                <IonIcon icon={documentTextOutline} />
                Acta de Entrega
              </div>
              <div className="firmas-container">
                <FirmaCanvas
                  label={equipo?.responsable_info ? `Firma de quien entrega (${equipo.responsable_info.nombre})` : 'Firma de quien entrega'}
                  onFirma={setFirmaEntrega}
                />
                <FirmaCanvas
                  label={`Firma de quien recibe (${responsableSeleccionado.nombre})`}
                  onFirma={setFirmaRecibe}
                />
                <FirmaCanvas label="Firma del gestor" onFirma={setFirmaGestor} />
                <div className="wizard-field">
                  <label className="wizard-field__label">Observaciones</label>
                  <textarea
                    className="wizard-textarea"
                    rows={3}
                    value={observaciones}
                    onChange={e => setObservaciones(e.target.value)}
                    placeholder="Condiciones del equipo..."
                  />
                </div>
              </div>
            </div>
            <button className="wizard-btn-primary" onClick={enviarSolicitud} disabled={enviando}>
              {enviando
                ? <IonSpinner name="crescent" style={{ width: 20, height: 20 }} />
                : isOnline
                  ? <><IonIcon icon={sendOutline} />Enviar a supervision</>
                  : <><IonIcon icon={cloudOfflineOutline} />Guardar (enviar al reconectar)</>
              }
            </button>
          </div>
        )}

        {/* PASO 4 */}
        {paso === 4 && (
          <div className="paso-container paso-exito">
            <div className={`paso-exito__icon-wrap paso-exito__icon-wrap--${guardadoOffline ? 'offline' : 'success'}`}>
              <IonIcon icon={guardadoOffline ? timeOutline : checkmarkCircleOutline} />
            </div>
            <h2>{guardadoOffline ? 'Guardado sin conexion' : 'Solicitud enviada!'}</h2>
            <p>
              {guardadoOffline
                ? 'La solicitud se guardo localmente. Se enviara automaticamente cuando recuperes la conexion.'
                : 'El cambio de responsable fue enviado a supervision. Recibiras una notificacion cuando sea aprobado.'
              }
            </p>
            <button className="wizard-btn-primary" onClick={() => history.push('/equipos')}>
              Volver a Equipos
            </button>
            {!guardadoOffline && (
              <button className="wizard-btn-outline" style={{ marginTop: 0 }} onClick={() => history.push('/solicitudes')}>
                Ver solicitudes
              </button>
            )}
          </div>
        )}

      </IonContent>
      <IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header="Atencion" message={alertMsg} buttons={['OK']} />
    </IonPage>
  );
};

export default CambiarResponsable;
