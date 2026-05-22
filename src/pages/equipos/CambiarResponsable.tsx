import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonItem, IonLabel,
  IonInput, IonSearchbar, IonList, IonIcon, IonNote,
  IonSpinner, IonCard, IonCardContent, IonTextarea,
  IonProgressBar, IonChip, IonAlert, IonBadge,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  personOutline, addOutline, checkmarkCircleOutline,
  swapHorizontalOutline, documentTextOutline, sendOutline,
  cloudOfflineOutline, timeOutline,
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

  // Load recientes when offline and entering paso 2
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
      // Store data locally — will be created on sync
      const tempResponsable: Responsable = {
        id: -Date.now(), // temp negative id, replaced on sync
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
        // Build chained queue job
        const steps = [];

        if (esNuevoResponsable) {
          // Step 1: create responsable, save id as 'resp_id'
          steps.push({
            method: 'POST' as const,
            endpoint: '/responsables',
            body: {
              nombre: nuevoNombre,
              numero_documento: nuevoDocumento,
              cargo: nuevoCargo || undefined,
              correo: nuevoCorreo || undefined,
            },
            saveAs: 'resp_id',
            saveField: 'id',
          });
        }

        // Step 2: create acta
        steps.push({
          method: 'POST' as const,
          endpoint: '/solicitudes/actas',
          body: {
            computador_id: Number(equipo.id),
            responsable_entrega_id: equipo.responsable_info?.id ? Number(equipo.responsable_info.id) : undefined,
            responsable_recibe_id: esNuevoResponsable ? '__resp_id__' : Number(responsableSeleccionado.id),
            firma_entrega: firmaEntrega,
            firma_recibe: firmaRecibe,
            firma_gestor: firmaGestor,
            observaciones,
          },
          ...(esNuevoResponsable ? { useFrom: { responsable_recibe_id: 'resp_id' } } : {}),
        });

        // Step 3: create solicitud
        steps.push({
          method: 'POST' as const,
          endpoint: '/solicitudes',
          body: {
            tipo: 'cambio_responsable',
            computador_id: Number(equipo.id),
            responsable_anterior_id: equipo.responsable_info?.id ? Number(equipo.responsable_info.id) : undefined,
            responsable_nuevo_id: esNuevoResponsable ? '__resp_id__' : Number(responsableSeleccionado.id),
            agencia_id: Number(equipo.agencia?.id ?? user.agencia_id!),
            creado_por: Number(user.id),
            observaciones,
          },
          ...(esNuevoResponsable ? { useFrom: { responsable_nuevo_id: 'resp_id' } } : {}),
        });

        await OfflineQueueService.add({
          label: `Cambio responsable: ${equipo.Codigo} → ${responsableSeleccionado.nombre}`,
          steps,
        });
        await refreshPendingCount();
        setGuardadoOffline(true);
        setPaso(4);
      } else {
        // Online — send directly
        await SolicitudesService.createActa({
          computador_id: Number(equipo.id),
          responsable_entrega_id: equipo.responsable_info?.id ? Number(equipo.responsable_info.id) : undefined,
          responsable_recibe_id: Number(responsableSeleccionado.id),
          firma_entrega: firmaEntrega,
          firma_recibe: firmaRecibe,
          firma_gestor: firmaGestor,
          observaciones,
        });
        await SolicitudesService.createSolicitud({
          tipo: 'cambio_responsable',
          computador_id: Number(equipo.id),
          responsable_anterior_id: equipo.responsable_info?.id ? Number(equipo.responsable_info.id) : undefined,
          responsable_nuevo_id: Number(responsableSeleccionado.id),
          agencia_id: Number(equipo.agencia?.id ?? user.agencia_id!),
          creado_por: Number(user.id),
          observaciones,
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
    4: 'Solicitud Enviada',
  };

  if (loadingEquipo) return (
    <IonPage>
      <IonHeader><IonToolbar color="primary"><IonTitle>Cargando...</IonTitle></IonToolbar></IonHeader>
      <IonContent className="ion-padding ion-text-center"><IonSpinner /></IonContent>
    </IonPage>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            {paso > 1 && paso < 4
              ? <IonButton onClick={() => setPaso((paso - 1) as Paso)}>Atras</IonButton>
              : <IonBackButton defaultHref={`/equipos/${id}`} />}
          </IonButtons>
          <IonTitle>{titulos[paso]}</IonTitle>
        </IonToolbar>
        <IonProgressBar value={(paso - 1) / 3} color="warning" />
      </IonHeader>
      <IonContent className="cambiar-responsable-content">

        {/* Offline indicator */}
        {!isOnline && (
          <div className="offline-bar">
            <IonIcon icon={cloudOfflineOutline} />
            <span>Sin conexión — se guardará y enviará al reconectar</span>
          </div>
        )}

        {/* PASO 1: Confirmar */}
        {paso === 1 && equipo && (
          <div className="paso-container">
            <IonCard><IonCardContent>
              <div className="equipo-resumen">
                <IonIcon icon={swapHorizontalOutline} size="large" color="primary" />
                <h2>{equipo.Codigo}</h2>
                {equipo.agencia && <p>{equipo.agencia.nombre}</p>}
              </div>
              <div className="responsable-actual">
                <p className="paso-label">Responsable actual</p>
                {equipo.responsable_info ? (
                  <div className="responsable-card">
                    <strong>{equipo.responsable_info.nombre}</strong>
                    <span>{equipo.responsable_info.numero_documento}</span>
                  </div>
                ) : <IonNote>Sin responsable asignado</IonNote>}
              </div>
              <p className="aviso-texto">Se creara una solicitud que debe ser aprobada por un supervisor. Se generara un acta de entrega con firmas.</p>
            </IonCardContent></IonCard>
            <IonButton expand="block" className="ion-margin" onClick={() => setPaso(2)}>Continuar</IonButton>
          </div>
        )}

        {/* PASO 2: Buscar / Crear responsable */}
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
                <IonSearchbar value={busqueda} onIonInput={e => buscarResponsables(e.detail.value ?? '')} placeholder="Nombre o documento..." debounce={400} />
                {buscando && <div className="ion-text-center"><IonSpinner /></div>}
                <IonList>
                  {resultados.map(r => (
                    <IonItem key={r.id} button onClick={() => seleccionarResponsable(r)}>
                      <IonIcon icon={personOutline} slot="start" />
                      <IonLabel>
                        <h3>{r.nombre}</h3>
                        <p>{r.numero_documento}{r.cargo ? ` - ${r.cargo}` : ''}</p>
                      </IonLabel>
                    </IonItem>
                  ))}
                </IonList>
              </>
            ) : (
              <div className="crear-form">
                {!isOnline && (
                  <div className="offline-hint">
                    <IonIcon icon={cloudOfflineOutline} />
                    <span>El responsable se creará al sincronizar</span>
                  </div>
                )}
                <IonItem>
                  <IonLabel position="stacked">Nombre completo *</IonLabel>
                  <IonInput value={nuevoNombre} onIonInput={e => setNuevoNombre(e.detail.value ?? '')} />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Numero de documento *</IonLabel>
                  <IonInput type="number" value={nuevoDocumento} onIonInput={e => setNuevoDocumento(e.detail.value ?? '')} />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Cargo</IonLabel>
                  <IonInput value={nuevoCargo} onIonInput={e => setNuevoCargo(e.detail.value ?? '')} />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Correo</IonLabel>
                  <IonInput type="email" value={nuevoCorreo} onIonInput={e => setNuevoCorreo(e.detail.value ?? '')} />
                </IonItem>
                <IonButton expand="block" className="ion-margin-top" onClick={crearYSeleccionar}>
                  {isOnline ? 'Crear y continuar' : 'Guardar y continuar'}
                </IonButton>
              </div>
            )}
          </div>
        )}

        {/* PASO 3: Firmar acta */}
        {paso === 3 && responsableSeleccionado && (
          <div className="paso-container">
            <IonCard><IonCardContent>
              <p className="paso-label">Nuevo responsable</p>
              <IonChip color="success">
                <IonIcon icon={checkmarkCircleOutline} />
                <IonLabel>{responsableSeleccionado.nombre} - {responsableSeleccionado.numero_documento}</IonLabel>
              </IonChip>
            </IonCardContent></IonCard>
            <div className="firmas-container ion-padding">
              <IonIcon icon={documentTextOutline} color="primary" />
              <h3>Acta de Entrega</h3>
              <FirmaCanvas
                label={equipo?.responsable_info ? `Firma de quien entrega (${equipo.responsable_info.nombre})` : 'Firma de quien entrega'}
                onFirma={setFirmaEntrega}
              />
              <FirmaCanvas
                label={`Firma de quien recibe (${responsableSeleccionado.nombre})`}
                onFirma={setFirmaRecibe}
              />
              <FirmaCanvas label="Firma del gestor" onFirma={setFirmaGestor} />
              <IonItem>
                <IonLabel position="stacked">Observaciones</IonLabel>
                <IonTextarea rows={3} value={observaciones} onIonInput={e => setObservaciones(e.detail.value ?? '')} placeholder="Condiciones del equipo..." />
              </IonItem>
            </div>
            <IonButton expand="block" className="ion-margin" onClick={enviarSolicitud} disabled={enviando}>
              {enviando
                ? <IonSpinner name="crescent" />
                : isOnline
                  ? <><IonIcon icon={sendOutline} slot="start" />Enviar a supervision</>
                  : <><IonIcon icon={cloudOfflineOutline} slot="start" />Guardar (enviar al reconectar)</>
              }
            </IonButton>
          </div>
        )}

        {/* PASO 4: Exito */}
        {paso === 4 && (
          <div className="paso-container paso-exito">
            <IonIcon icon={guardadoOffline ? timeOutline : checkmarkCircleOutline} size="large" color={guardadoOffline ? 'warning' : 'success'} />
            <h2>{guardadoOffline ? 'Guardado sin conexión' : 'Solicitud enviada!'}</h2>
            {guardadoOffline
              ? <p>La solicitud se guardó localmente. Se enviará automáticamente cuando recuperes la conexión.</p>
              : <p>El cambio de responsable fue enviado a supervision. Recibiras una notificacion cuando sea aprobado.</p>
            }
            <IonButton expand="block" className="ion-margin" onClick={() => history.push('/equipos')}>Volver a Equipos</IonButton>
            {!guardadoOffline && (
              <IonButton expand="block" fill="outline" className="ion-margin-horizontal" onClick={() => history.push('/solicitudes')}>Ver solicitudes</IonButton>
            )}
          </div>
        )}

      </IonContent>
      <IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header="Atencion" message={alertMsg} buttons={['OK']} />
    </IonPage>
  );
};

export default CambiarResponsable;
