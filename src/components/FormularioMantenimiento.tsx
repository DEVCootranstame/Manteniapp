import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import { camera, close, save, bulb, locationOutline, constructOutline, documentTextOutline, cameraOutline, refreshOutline, warningOutline, chevronDownOutline, businessOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';
import { useHistory } from 'react-router-dom';
import { Mantenimiento, Agencia, TipoMantenimiento, FotosCategorized, SugerenciaMantenimiento, STORAGE_KEY, TIPOS_MANTENIMIENTO_STORAGE_KEY, SUGERENCIAS_STORAGE_KEY } from '../types';
import { useIonViewWillEnter } from '@ionic/react';
import { EquiposService, ComputadoresListItem } from '../services/equipos.service';
import { AgenciasService } from '../services/agencias.service';
import { useAuth } from '../context/AuthContext';
import { useAgenciaFilter } from '../context/AgenciaFilterContext';
import './FormularioMantenimiento.css';

/* ── Dropdown de agencia custom (mismo estilo que equipos) ── */
const AgenciaDropdown: React.FC<{
  agencias: Agencia[];
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
}> = ({ agencias, value, onChange, onBlur }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = agencias.find(a => a.id === value);

  return (
    <div className="agencia-dropdown" ref={ref}>
      <button
        className="agencia-dropdown__btn"
        onClick={() => setOpen(v => !v)}
        type="button"
      >
        <IonIcon icon={businessOutline} className="agencia-dropdown__icon" />
        <span className="agencia-dropdown__label">
          {selected ? `${selected.codigo} - ${selected.nombre}` : '-- Selecciona una agencia --'}
        </span>
        <IonIcon icon={chevronDownOutline} className={`agencia-dropdown__chevron ${open ? 'agencia-dropdown__chevron--open' : ''}`} />
      </button>

      {open && (
        <div className="agencia-dropdown__list">
          {agencias.length === 0 ? (
            <div className="agencia-dropdown__option" style={{ color: '#94a3b8' }}>Cargando agencias...</div>
          ) : agencias.map(a => (
            <button
              key={a.id}
              type="button"
              className={`agencia-dropdown__option ${a.id === value ? 'agencia-dropdown__option--active' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(a.id);
                setOpen(false);
              }}
            >
              {a.codigo} - {a.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const { user } = useAuth();
  const { agenciaFilterId, isFilterActive } = useAgenciaFilter();

  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState<TipoMantenimiento[]>([]);
  const [agenciaId, setAgenciaId] = useState('');
  const [tipoMantenimientoId, setTipoMantenimientoId] = useState('');

  const [nombreEquipo, setNombreEquipo] = useState('');
  const [computadorId, setComputadorId] = useState<number | undefined>(undefined);
  const [equipos, setEquipos] = useState<ComputadoresListItem[]>([]);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [equiposModoManual, setEquiposModoManual] = useState(false);
  const [proveedor, setProveedor] = useState('');
  const [mantenimientoRealizado, setMantenimientoRealizado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fotosCat, setFotosCat] = useState<FotosCategorized>({ antes: null, durante: null, despues: null });

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sugerencias, setSugerencias] = useState<SugerenciaMantenimiento[]>([]);
  const [showSugerencias, setShowSugerencias] = useState(false);

  const cargarEquipos = useCallback(async (agId: string) => {
    if (!agId) {
      setEquipos([]);
      setEquiposModoManual(false);
      return;
    }
    setLoadingEquipos(true);
    setNombreEquipo('');
    setComputadorId(undefined);
    try {
      const lista = await EquiposService.getComputadores(parseInt(agId, 10));
      setEquipos(lista);
      setEquiposModoManual(lista.length === 0);
    } catch {
      setEquipos([]);
      setEquiposModoManual(true);
    } finally {
      setLoadingEquipos(false);
    }
  }, []);

  const cargarAgencias = useCallback(async () => {
    const data = await AgenciasService.getAgenciasForUser(user);
    setAgencias(data);
    // Auto-seleccionar: si hay filtro global activo, usarlo; si solo hay una agencia, seleccionarla
    if (isFilterActive && agenciaFilterId !== 'todas') {
      const filtered = data.find(a => a.id === agenciaFilterId);
      if (filtered && !agenciaId) {
        setAgenciaId(filtered.id);
        cargarEquipos(filtered.id);
      }
    } else if (data.length === 1 && !agenciaId) {
      setAgenciaId(data[0].id);
      cargarEquipos(data[0].id);
    }
  }, [user, agenciaFilterId, isFilterActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarTiposMantenimiento = useCallback(async () => {
    const { value } = await Preferences.get({ key: TIPOS_MANTENIMIENTO_STORAGE_KEY });
    if (value) {
      setTiposMantenimiento(JSON.parse(value));
    }
  }, []);

  const cargarSugerencias = useCallback(async () => {
    const { value } = await Preferences.get({ key: SUGERENCIAS_STORAGE_KEY });
    if (value) {
      setSugerencias(JSON.parse(value));
    }
  }, []);

  useIonViewWillEnter(() => {
    cargarAgencias();
    cargarTiposMantenimiento();
    cargarSugerencias();
  });

  // Re-cargar agencias cuando el usuario se resuelve (puede ser null inicialmente)
  useEffect(() => {
    if (user) {
      cargarAgencias();
    }
  }, [cargarAgencias]);

  const agenciaSeleccionada = agencias.find((a) => a.id === agenciaId);
  const tipoSeleccionado = tiposMantenimiento.find((t) => t.id === tipoMantenimientoId);
  const sugerenciasFiltradas = tipoSeleccionado
    ? sugerencias.filter((s) => s.tipoMantenimiento.toLowerCase() === tipoSeleccionado.nombre.toLowerCase())
    : [];

  const progreso = useMemo(() => {
    let completados = 0;
    const total = 5;
    if (agenciaId) completados++;
    if (tipoMantenimientoId) completados++;
    if (nombreEquipo.trim()) completados++;
    if (proveedor.trim()) completados++;
    if (mantenimientoRealizado.trim()) completados++;
    return Math.round((completados / total) * 100);
  }, [agenciaId, tipoMantenimientoId, nombreEquipo, proveedor, mantenimientoRealizado]);

  const aplicarSugerencia = (texto: string) => {
    setMantenimientoRealizado((prev) => {
      if (prev.trim()) {
        return prev.trim() + '\n' + texto;
      }
      return texto;
    });
    setShowSugerencias(false);
  };

  const marcarTocado = (campo: string) => {
    setTouched((prev) => ({ ...prev, [campo]: true }));
  };

  const tomarFoto = async (categoria: keyof FotosCategorized) => {
    if (fotosCat[categoria]) {
      setAlertHeader('Foto existente');
      setAlertMessage('Ya hay una foto en esta categoría. Elimínala primero para tomar otra.');
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
        setFotosCat((prev) => ({ ...prev, [categoria]: image.base64String! }));
        const label = categoria === 'antes' ? 'Antes' : categoria === 'durante' ? 'Durante' : 'Después';
        setToastMessage(`Foto "${label}" capturada`);
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

  const eliminarFoto = (categoria: keyof FotosCategorized) => {
    setFotosCat((prev) => ({ ...prev, [categoria]: null }));
    setToastMessage('Foto eliminada');
    setShowToast(true);
  };

  const formularioValido = (): boolean => {
    return (
      agenciaId.length > 0 &&
      tipoMantenimientoId.length > 0 &&
      nombreEquipo.trim().length > 0 &&
      proveedor.trim().length > 0 &&
      mantenimientoRealizado.trim().length > 0
    );
  };

  const PATRON_EQUIPO = /^[A-Z]{2}-\d{2}-\d{4}$/;

  const validarPatronEquipo = (): boolean => {
    return PATRON_EQUIPO.test(nombreEquipo.trim());
  };

  const validarCodigoAgencia = (): boolean => {
    const agencia = agencias.find((a) => a.id === agenciaId);
    if (!agencia) return false;
    const codigo = agencia.codigo.toUpperCase();
    const inicioEquipo = nombreEquipo.trim().substring(0, codigo.length).toUpperCase();
    return inicioEquipo === codigo;
  };

  const limpiarFormulario = () => {
    setAgenciaId('');
    setTipoMantenimientoId('');
    setNombreEquipo('');
    setComputadorId(undefined);
    setEquipos([]);
    setEquiposModoManual(false);
    setProveedor('');
    setMantenimientoRealizado('');
    setObservaciones('');
    setFotosCat({ antes: null, durante: null, despues: null });
    setTouched({});
  };

  const guardarRegistro = async () => {
    if (!formularioValido()) {
      setTouched({
        agenciaId: true,
        tipoMantenimientoId: true,
        nombreEquipo: true,
        proveedor: true,
        mantenimientoRealizado: true,
      });
      setAlertHeader('Campos incompletos');
      setAlertMessage('Por favor completa todos los campos obligatorios antes de guardar.');
      setShowAlert(true);
      return;
    }

    if (!validarPatronEquipo()) {
      setAlertHeader('Formato inválido');
      setAlertMessage(
        'El nombre del equipo debe seguir el patrón: XX-00-0000 (dos letras, guion, dos números, guion, cuatro números). Ejemplo: AR-01-0001'
      );
      setShowAlert(true);
      return;
    }

    if (!validarCodigoAgencia()) {
      const agencia = agencias.find((a) => a.id === agenciaId);
      setAlertHeader('Código no corresponde');
      setAlertMessage(
        `El nombre del equipo debe iniciar con el código de la agencia "${agencia?.codigo}". Ejemplo: ${agencia?.codigo}-01-0001`
      );
      setShowAlert(true);
      return;
    }

    // Verificar duplicados
    const { value: registrosGuardados } = await Preferences.get({ key: STORAGE_KEY });
    const registrosExistentes: Mantenimiento[] = registrosGuardados ? JSON.parse(registrosGuardados) : [];
    const duplicado = registrosExistentes.find(
      (r) => r.nombreEquipo.toUpperCase() === nombreEquipo.trim().toUpperCase()
    );
    if (duplicado) {
      setAlertHeader('Equipo duplicado');
      setAlertMessage(
        `Ya existe un registro con el nombre de equipo "${nombreEquipo.trim()}". Registrado el ${duplicado.fecha} a las ${duplicado.hora}. Usa un nombre diferente.`
      );
      setShowAlert(true);
      return;
    }

    setLoading(true);
    setLoadingMessage('Guardando registro localmente...');

    try {
      const { fecha, hora } = obtenerFechaHora();

      // Construir array de fotos para compatibilidad y objeto categorizado
      const fotosArray: string[] = [];
      if (fotosCat.antes) fotosArray.push(fotosCat.antes);
      if (fotosCat.durante) fotosArray.push(fotosCat.durante);
      if (fotosCat.despues) fotosArray.push(fotosCat.despues);

      const nuevoRegistro: Mantenimiento = {
        id: generarId(),
        nombreEquipo: nombreEquipo.trim(),
        computadorId,
        proveedor: proveedor.trim(),
        mantenimientoRealizado: mantenimientoRealizado.trim(),
        observaciones: observaciones.trim(),
        fecha,
        hora,
        fotos: fotosArray,
        fotosCategorized: { ...fotosCat },
        sincronizado: false,
        agenciaId,
        tipoMantenimientoId,
      };

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

          {/* Barra de progreso */}
          <div className="form-progress">
            <div className="form-progress__bar">
              <div
                className="form-progress__fill"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <span className="form-progress__text">{progreso}% completado</span>
          </div>

          {/* ═══════ SECCIÓN 1: Ubicación ═══════ */}
          <div className="form-section">
            <div className="form-section__header">
              <div className="form-section__icon form-section__icon--blue">
                <IonIcon icon={locationOutline} />
              </div>
              <div>
                <h3 className="form-section__title">Ubicación</h3>
                <p className="form-section__subtitle">¿Dónde se realiza el mantenimiento?</p>
              </div>
            </div>

            <div className="form-section__body">
              {/* Campo: Agencia */}
              <div className="form-field">
                <label className="form-field__label">
                  Agencia <span className="form-field__required">*</span>
                </label>
                <AgenciaDropdown
                  agencias={agencias}
                  value={agenciaId}
                  onChange={(val) => {
                    setAgenciaId(val);
                    cargarEquipos(val);
                  }}
                  onBlur={() => marcarTocado('agenciaId')}
                />
                {touched.agenciaId && agenciaId === '' && (
                  <div className="form-field__error">Selecciona una agencia</div>
                )}
              </div>

              {/* Campo: Tipo de Mantenimiento */}
              <div className="form-field">
                <label className="form-field__label">
                  Tipo de Mantenimiento <span className="form-field__required">*</span>
                </label>
                <select
                  className="neo-select"
                  value={tipoMantenimientoId}
                  onChange={(e) => setTipoMantenimientoId(e.target.value)}
                  onBlur={() => marcarTocado('tipoMantenimientoId')}
                >
                  <option value="">-- Selecciona un tipo --</option>
                  {tiposMantenimiento.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
                {touched.tipoMantenimientoId && tipoMantenimientoId === '' && (
                  <div className="form-field__error">Selecciona un tipo de mantenimiento</div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════ SECCIÓN 2: Equipo ═══════ */}
          <div className="form-section">
            <div className="form-section__header">
              <div className="form-section__icon form-section__icon--green">
                <IonIcon icon={constructOutline} />
              </div>
              <div>
                <h3 className="form-section__title">Equipo</h3>
                <p className="form-section__subtitle">Identificación del equipo intervenido</p>
              </div>
            </div>

            <div className="form-section__body">
              {/* Campo: Nombre del equipo */}
              <div className="form-field">
                <label className="form-field__label">
                  Equipo <span className="form-field__required">*</span>
                </label>

                {loadingEquipos ? (
                  <div className="equipos-loading">
                    <IonIcon icon={refreshOutline} className="equipos-loading__icon" />
                    <span>Cargando equipos...</span>
                  </div>
                ) : equiposModoManual ? (
                  <>
                    <div className="equipos-offline-notice">
                      <IonIcon icon={warningOutline} />
                      <span>Sin conexión a la API. Escribe el código manualmente.</span>
                    </div>
                    <input
                      className="neo-input neo-input-uppercase"
                      value={nombreEquipo}
                      onChange={(e) => {
                        setNombreEquipo(e.target.value.toUpperCase());
                        setComputadorId(undefined);
                      }}
                      onBlur={() => marcarTocado('nombreEquipo')}
                      placeholder={agenciaId ? `Ej: ${agencias.find(a => a.id === agenciaId)?.codigo || ''}-01-0001` : 'Primero selecciona una agencia'}
                    />
                    {agenciaId && (
                      <button
                        className="equipos-retry-btn"
                        onClick={() => cargarEquipos(agenciaId)}
                      >
                        <IonIcon icon={refreshOutline} /> Reintentar conexión
                      </button>
                    )}
                  </>
                ) : (
                  <div className="equipo-autocomplete">
                    <input
                      className="neo-input neo-input-uppercase"
                      value={nombreEquipo}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setNombreEquipo(val);
                        const eq = equipos.find(eq => eq.Codigo === val);
                        setComputadorId(eq?.id);
                      }}
                      onBlur={() => marcarTocado('nombreEquipo')}
                      placeholder={agenciaId ? `Buscar equipo... (${equipos.length} disponibles)` : 'Primero selecciona una agencia'}
                      disabled={!agenciaId}
                    />
                    {nombreEquipo.trim() !== '' && (() => {
                      const filtrados = equipos.filter(eq =>
                        eq.Codigo.toUpperCase().includes(nombreEquipo.trim())
                      );
                      if (filtrados.length === 0 || (filtrados.length === 1 && filtrados[0].Codigo === nombreEquipo)) return null;
                      return (
                        <div className="equipo-autocomplete__list">
                          {filtrados.map((eq) => (
                            <button
                              key={eq.id}
                              className="equipo-autocomplete__item"
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setNombreEquipo(eq.Codigo);
                                setComputadorId(eq.id);
                              }}
                            >
                              <span className="equipo-autocomplete__code">{eq.Codigo}</span>
                              <span className="equipo-autocomplete__resp">{eq.Responsable || eq.responsable_nombre || 'Sin responsable'}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {touched.nombreEquipo && nombreEquipo.trim() === '' && (
                  <div className="form-field__error">Selecciona o ingresa un equipo</div>
                )}
                {touched.nombreEquipo && nombreEquipo.trim() !== '' && !PATRON_EQUIPO.test(nombreEquipo.trim()) && (
                  <div className="form-field__error">Formato inválido. Usa: XX-00-0000 (ej: AR-01-0001)</div>
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
            </div>
          </div>

          {/* ═══════ SECCIÓN 3: Detalles ═══════ */}
          <div className="form-section">
            <div className="form-section__header">
              <div className="form-section__icon form-section__icon--orange">
                <IonIcon icon={documentTextOutline} />
              </div>
              <div>
                <h3 className="form-section__title">Detalles</h3>
                <p className="form-section__subtitle">Describe el trabajo realizado</p>
              </div>
            </div>

            <div className="form-section__body">
              {/* Campo: Mantenimiento Realizado */}
              <div className="form-field">
                <div className="form-field__label-row">
                  <label className="form-field__label">
                    Mantenimiento Realizado <span className="form-field__required">*</span>
                  </label>
                  <button
                    className="form-field__suggest-btn"
                    onClick={() => {
                      if (!tipoMantenimientoId) {
                        setAlertHeader('Selecciona un tipo');
                        setAlertMessage('Primero selecciona el tipo de mantenimiento para ver las sugerencias correspondientes.');
                        setShowAlert(true);
                        return;
                      }
                      if (sugerenciasFiltradas.length === 0) {
                        setToastMessage(`No hay sugerencias para "${tipoSeleccionado?.nombre}". Agrega en Configuración.`);
                        setShowToast(true);
                        return;
                      }
                      setShowSugerencias(true);
                    }}
                    title="Sugerencias"
                  >
                    <IonIcon icon={bulb} />
                  </button>
                </div>
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

              {/* Campo: Observaciones (opcional) */}
              <div className="form-field">
                <label className="form-field__label">
                  Observaciones <span className="form-field__optional">(opcional)</span>
                </label>
                <textarea
                  className="neo-textarea"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Daños encontrados, piezas faltantes, recomendaciones..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Modal de sugerencias */}
          {showSugerencias && (
            <div className="sugerencias-overlay" onClick={() => setShowSugerencias(false)}>
              <div className="sugerencias-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sugerencias-modal__header">
                  <h3>💡 Sugerencias — {tipoSeleccionado?.nombre}</h3>
                  <button className="sugerencias-modal__close" onClick={() => setShowSugerencias(false)}>
                    <IonIcon icon={close} />
                  </button>
                </div>
                <p className="sugerencias-modal__hint">Toca una sugerencia para agregarla al campo</p>
                <div className="sugerencias-modal__list">
                  {sugerenciasFiltradas.map((sug) => (
                    <button
                      key={sug.id}
                      className="sugerencias-modal__item"
                      onClick={() => aplicarSugerencia(sug.texto)}
                    >
                      {sug.texto}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════ SECCIÓN 4: Evidencia fotográfica ═══════ */}
          <div className="form-section">
            <div className="form-section__header">
              <div className="form-section__icon form-section__icon--purple">
                <IonIcon icon={cameraOutline} />
              </div>
              <div>
                <h3 className="form-section__title">Evidencia Fotográfica</h3>
                <p className="form-section__subtitle">Captura antes, durante y después</p>
              </div>
            </div>

            <div className="form-section__body">
              <div className="form-photos__categorized">
                {(['antes', 'durante', 'despues'] as const).map((cat) => {
                  const labels = { antes: 'Antes', durante: 'Durante', despues: 'Después' };
                  const icons = { antes: '🔴', durante: '🟡', despues: '🟢' };
                  const foto = fotosCat[cat];
                  return (
                    <div key={cat} className={`form-photos__slot form-photos__slot--${cat}`}>
                      <div className="form-photos__slot-label">
                        {icons[cat]} {labels[cat]}
                      </div>
                      {foto ? (
                        <div className="form-photos__item">
                          <img
                            className="form-photos__img"
                            src={`data:image/jpeg;base64,${foto}`}
                            alt={`Foto ${labels[cat]}`}
                          />
                          <button
                            className="form-photos__delete-btn"
                            onClick={() => eliminarFoto(cat)}
                          >
                            <IonIcon icon={close} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="form-photos__add-btn"
                          onClick={() => tomarFoto(cat)}
                        >
                          <IonIcon icon={camera} />
                          <span>Tomar</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Botón guardar */}
          <button
            className={`form-save-btn ${progreso === 100 ? 'form-save-btn--ready' : ''}`}
            onClick={guardarRegistro}
          >
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
