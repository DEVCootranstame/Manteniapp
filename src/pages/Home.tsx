import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonSearchbar,
  IonIcon,
  IonLoading,
  IonAlert,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonViewWillEnter,
} from '@ionic/react';
import { add, cloudUpload, downloadOutline, filterOutline, closeOutline, settingsOutline, construct } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { supabase } from '../supabaseClient';
import { useHistory } from 'react-router-dom';
import { decode } from 'base64-arraybuffer';
import { Mantenimiento, Agencia, TipoMantenimiento, STORAGE_KEY, AGENCIAS_STORAGE_KEY, TIPOS_MANTENIMIENTO_STORAGE_KEY } from '../types';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();
  const [registros, setRegistros] = useState<Mantenimiento[]>([]);
  const [filteredRegistros, setFilteredRegistros] = useState<Mantenimiento[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState<TipoMantenimiento[]>([]);
  const [filtroAgencia, setFiltroAgencia] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('pendientes');
  const [showFiltros, setShowFiltros] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertHeader, setAlertHeader] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [fabOpen, setFabOpen] = useState<boolean>(false);

  const cargarAgencias = useCallback(async () => {
    const { value } = await Preferences.get({ key: AGENCIAS_STORAGE_KEY });
    if (value) {
      setAgencias(JSON.parse(value));
    }
  }, []);

  const cargarTiposMantenimiento = useCallback(async () => {
    const { value } = await Preferences.get({ key: TIPOS_MANTENIMIENTO_STORAGE_KEY });
    if (value) {
      setTiposMantenimiento(JSON.parse(value));
    }
  }, []);

  const cargarRegistros = useCallback(async () => {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (value) {
        const datos: Mantenimiento[] = JSON.parse(value);
        setRegistros(datos);
        setFilteredRegistros(datos);
      } else {
        setRegistros([]);
        setFilteredRegistros([]);
      }
    } catch (error) {
      console.error('Error al cargar registros:', error);
      setRegistros([]);
      setFilteredRegistros([]);
    }
  }, []);

  useIonViewWillEnter(() => {
    cargarRegistros();
    cargarAgencias();
    cargarTiposMantenimiento();
  });

  useEffect(() => {
    cargarRegistros();
    cargarAgencias();
    cargarTiposMantenimiento();
  }, [cargarRegistros, cargarAgencias]);

  useEffect(() => {
    let resultado = registros;

    // Filtro por estado (por defecto solo pendientes)
    if (filtroEstado === 'pendientes') {
      resultado = resultado.filter((r) => !r.sincronizado);
    } else if (filtroEstado === 'sincronizados') {
      resultado = resultado.filter((r) => r.sincronizado);
    }

    // Filtro por agencia
    if (filtroAgencia) {
      resultado = resultado.filter((r) => r.agenciaId === filtroAgencia);
    }

    // Filtro por tipo de mantenimiento
    if (filtroTipo) {
      resultado = resultado.filter((r) => r.tipoMantenimientoId === filtroTipo);
    }

    // Filtro por texto
    if (searchText.trim() !== '') {
      const query = searchText.toLowerCase();
      resultado = resultado.filter(
        (r) =>
          r.nombreEquipo.toLowerCase().includes(query) ||
          r.proveedor.toLowerCase().includes(query) ||
          r.mantenimientoRealizado.toLowerCase().includes(query) ||
          r.observaciones.toLowerCase().includes(query) ||
          r.fecha.toLowerCase().includes(query)
      );
    }

    setFilteredRegistros(resultado);
  }, [searchText, registros, filtroAgencia, filtroTipo, filtroEstado]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await cargarRegistros();
    event.detail.complete();
  };

  const mostrarAlerta = (header: string, message: string) => {
    setAlertHeader(header);
    setAlertMessage(message);
    setShowAlert(true);
  };

  const mostrarToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  /* ======================== SINCRONIZACIÓN ======================== */
  const sincronizarConSupabase = async () => {
    const pendientes = registros.filter((r) => !r.sincronizado);
    if (pendientes.length === 0) {
      mostrarAlerta('Sin pendientes', 'No hay registros pendientes de sincronizar.');
      return;
    }

    setLoading(true);
    setLoadingMessage('Sincronizando registros...');

    let exitosos = 0;
    let fallidos = 0;
    const registrosActualizados = [...registros];

    for (const registro of pendientes) {
      try {
        setLoadingMessage(
          `Subiendo: ${registro.nombreEquipo} (${exitosos + fallidos + 1}/${pendientes.length})`
        );

        const urlsFotos: Record<string, string> = {};
        const categorias = ['antes', 'durante', 'despues'] as const;

        if (registro.fotosCategorized) {
          for (const cat of categorias) {
            const base64Data = registro.fotosCategorized[cat];
            if (!base64Data) continue;

            const pureBase64 = base64Data.includes(',')
              ? base64Data.split(',')[1]
              : base64Data;

            const fileName = `${registro.id}_foto_${cat}_${Date.now()}.jpg`;
            const filePath = `mantenimientos/${fileName}`;
            const arrayBuffer = decode(pureBase64);

            const { error: uploadError } = await supabase.storage
              .from('fotos-mantenimiento')
              .upload(filePath, arrayBuffer, {
                contentType: 'image/jpeg',
                upsert: false,
              });

            if (uploadError) {
              console.error(`Error subiendo foto ${cat}:`, uploadError);
              continue;
            }

            const { data: publicUrlData } = supabase.storage
              .from('fotos-mantenimiento')
              .getPublicUrl(filePath);

            urlsFotos[cat] = publicUrlData.publicUrl;
          }
        } else {
          // Compatibilidad con registros antiguos sin categorización
          for (let i = 0; i < registro.fotos.length; i++) {
            const base64Data = registro.fotos[i];
            const pureBase64 = base64Data.includes(',')
              ? base64Data.split(',')[1]
              : base64Data;

            const fileName = `${registro.id}_foto_${i + 1}_${Date.now()}.jpg`;
            const filePath = `mantenimientos/${fileName}`;
            const arrayBuffer = decode(pureBase64);

            const { error: uploadError } = await supabase.storage
              .from('fotos-mantenimiento')
              .upload(filePath, arrayBuffer, {
                contentType: 'image/jpeg',
                upsert: false,
              });

            if (uploadError) {
              console.error(`Error subiendo foto ${i + 1}:`, uploadError);
              continue;
            }

            const { data: publicUrlData } = supabase.storage
              .from('fotos-mantenimiento')
              .getPublicUrl(filePath);

            urlsFotos[categorias[i]] = publicUrlData.publicUrl;
          }
        }

        const agencia = agencias.find((a) => a.id === registro.agenciaId);
        const ubicacion = agencia?.ubicaciones.find((u) => u.id === registro.ubicacionId);
        const tipoMant = tiposMantenimiento.find((t) => t.id === registro.tipoMantenimientoId);

        const insertPayload: Record<string, string | null> = {
          nombre_equipo: registro.nombreEquipo,
          proveedor: registro.proveedor,
          mantenimiento_realizado: registro.mantenimientoRealizado,
          observaciones: registro.observaciones,
          fecha: registro.fecha,
          hora: registro.hora,
          foto_1_url: urlsFotos.antes || null,
          foto_2_url: urlsFotos.durante || null,
          foto_3_url: urlsFotos.despues || null,
          agencia_codigo: agencia?.codigo || null,
          agencia_nombre: agencia?.nombre || null,
          ubicacion_nombre: ubicacion?.nombre || null,
          tipo_mantenimiento: tipoMant?.nombre || null,
        };

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(registro.id)) {
          insertPayload.id = registro.id;
        }

        const { error: insertError } = await supabase.from('mantenimientos').insert(insertPayload);

        if (insertError) {
          console.error('Error insertando registro:', insertError);
          fallidos++;
          continue;
        }

        const index = registrosActualizados.findIndex((r) => r.id === registro.id);
        if (index !== -1) {
          registrosActualizados[index] = { ...registrosActualizados[index], sincronizado: true };
        }
        exitosos++;
      } catch (error) {
        console.error('Error en sincronización:', error);
        fallidos++;
      }
    }

    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(registrosActualizados),
    });

    setRegistros(registrosActualizados);
    setFilteredRegistros(registrosActualizados);
    setLoading(false);

    mostrarAlerta(
      'Sincronización completa',
      `Exitosos: ${exitosos}\nFallidos: ${fallidos}\nTotal procesados: ${pendientes.length}`
    );
  };

  /* ======================== EXPORTAR CSV ======================== */
  const exportarCSV = async () => {
    if (registros.length === 0) {
      mostrarAlerta('Sin datos', 'No hay registros para exportar.');
      return;
    }

    setLoading(true);
    setLoadingMessage('Generando archivo CSV...');

    try {
      const headers = [
        'ID', 'Nombre_Equipo', 'Proveedor', 'Mantenimiento_Realizado',
        'Observaciones', 'Fecha', 'Hora', 'Foto_Antes', 'Foto_Durante', 'Foto_Despues', 'Sincronizado',
      ];

      const escapeCsv = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const rows = registros.map((r) => {
        const fotoLabel = (cat: 'antes' | 'durante' | 'despues', fallbackIdx: number) => {
          const tiene = r.fotosCategorized ? !!r.fotosCategorized[cat] : !!r.fotos[fallbackIdx];
          if (!tiene) return 'Sin foto';
          return r.sincronizado ? 'Sincronizada en Supabase' : 'Pendiente de sincronizar';
        };

        return [
          escapeCsv(r.id), escapeCsv(r.nombreEquipo), escapeCsv(r.proveedor),
          escapeCsv(r.mantenimientoRealizado), escapeCsv(r.observaciones),
          escapeCsv(r.fecha), escapeCsv(r.hora),
          fotoLabel('antes', 0), fotoLabel('durante', 1), fotoLabel('despues', 2),
          r.sincronizado ? 'Sí' : 'No',
        ];
      });

      const csvContent =
        '\uFEFF' + headers.join(',') + '\n' + rows.map((row) => row.join(',')).join('\n');

      const fechaActual = new Date().toISOString().split('T')[0];
      const nombreArchivo = `ManteniApp_Reporte_${fechaActual}.csv`;

      const result = await Filesystem.writeFile({
        path: nombreArchivo,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      setLoading(false);

      await Share.share({
        title: 'Reporte de Mantenimientos - ManteniApp',
        text: `Reporte generado el ${fechaActual}. Total de registros: ${registros.length}.`,
        url: result.uri,
        dialogTitle: 'Compartir reporte CSV',
      });

      mostrarToast('Archivo CSV generado correctamente');
    } catch (error: any) {
      setLoading(false);
      console.error('Error exportando CSV:', error);
      if (error?.message?.includes('cancel') || error?.message?.includes('dismissed')) {
        mostrarToast('Exportación cancelada');
      } else {
        mostrarAlerta('Error', `No se pudo exportar el CSV: ${error?.message || 'Error desconocido'}`);
      }
    }
  };

  const totalRegistros = registros.length;
  const pendientesSinc = registros.filter((r) => !r.sincronizado).length;
  const sincronizados = registros.filter((r) => r.sincronizado).length;

  /* ======================== RENDER ======================== */
  return (
    <IonPage>
      <IonHeader className="neo-header" mode="md">
        <IonToolbar>
          <div className="home-header-content">
            <div className="home-logo-text">ManteniApp</div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Stats + acciones */}
        <div className="neo-card neo-animate home-stats-card">
          <div className="home-stats-row">
            <div className="home-stat">
              <div className="home-stat__number home-stat__number--blue">{totalRegistros}</div>
              <div className="home-stat__label">Total</div>
            </div>
            <div className="home-stat-divider" />
            <div className="home-stat">
              <div className="home-stat__number home-stat__number--orange">{pendientesSinc}</div>
              <div className="home-stat__label">Pendientes</div>
            </div>
            <div className="home-stat-divider" />
            <div className="home-stat">
              <div className="home-stat__number home-stat__number--green">{sincronizados}</div>
              <div className="home-stat__label">Sincronizados</div>
            </div>
          </div>

          <div className="home-actions">
            <button
              className={`neo-btn neo-btn-green ${pendientesSinc === 0 ? 'home-btn-disabled' : ''}`}
              onClick={sincronizarConSupabase}
              disabled={pendientesSinc === 0}
            >
              <IonIcon icon={cloudUpload} />
              Sincronizar
            </button>
            <button
              className={`neo-btn neo-btn-primary ${totalRegistros === 0 ? 'home-btn-disabled' : ''}`}
              onClick={exportarCSV}
              disabled={totalRegistros === 0}
            >
              <IonIcon icon={downloadOutline} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Barra de búsqueda + botón filtro */}
        <div className="home-search-bar">
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value || '')}
            placeholder="Buscar equipo, proveedor, fecha..."
            debounce={300}
            animated
            className="neo-searchbar home-searchbar-inline"
          />
          <button
            className={`home-filter-btn ${(filtroAgencia || filtroTipo || filtroEstado !== 'pendientes') ? 'home-filter-btn--active' : ''}`}
            onClick={() => setShowFiltros(!showFiltros)}
          >
            <IonIcon icon={showFiltros ? closeOutline : filterOutline} />
          </button>
        </div>

        {/* Panel de filtros */}
        {showFiltros && (
          <div className="home-filtros-panel neo-card neo-animate">
            <div className="home-filtros-grid">
              <div className="home-filtro-field">
                <label className="home-filtro-label">Estado</label>
                <select
                  className="neo-select-sm"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="pendientes">Pendientes</option>
                  <option value="sincronizados">Sincronizados</option>
                  <option value="todos">Todos</option>
                </select>
              </div>

              <div className="home-filtro-field">
                <label className="home-filtro-label">Agencia</label>
                <select
                  className="neo-select-sm"
                  value={filtroAgencia}
                  onChange={(e) => setFiltroAgencia(e.target.value)}
                >
                  <option value="">Todas</option>
                  {agencias.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.codigo} - {a.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="home-filtro-field">
                <label className="home-filtro-label">Tipo</label>
                <select
                  className="neo-select-sm"
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <option value="">Todos</option>
                  {tiposMantenimiento.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              className="home-filtros-clear"
              onClick={() => {
                setFiltroAgencia('');
                setFiltroTipo('');
                setFiltroEstado('pendientes');
              }}
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Lista de registros */}
        {filteredRegistros.length === 0 ? (
          <div className="home-empty">
            <div className="home-empty__icon">📋</div>
            <h3 className="home-empty__title">No hay registros</h3>
            <p className="home-empty__subtitle">
              {filtroEstado === 'pendientes'
                ? 'No hay mantenimientos pendientes. Presiona + para agregar uno.'
                : 'No se encontraron registros con los filtros aplicados.'}
            </p>
          </div>
        ) : (
          filteredRegistros.map((registro, idx) => (
            <div
              key={registro.id}
              className="neo-card neo-animate"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="home-card-header">
                <div>
                  <div className="home-card-title">{registro.nombreEquipo}</div>
                  <div className="home-card-subtitle">{registro.proveedor}</div>
                </div>
                <div className="home-card-badges">
                  <span
                    className={`neo-badge ${registro.sincronizado ? 'neo-badge-green' : 'neo-badge-orange'}`}
                  >
                    {registro.sincronizado ? '✓ Sync' : '⏳ Pendiente'}
                  </span>
                  {(() => {
                    const tipo = tiposMantenimiento.find((t) => t.id === registro.tipoMantenimientoId);
                    return tipo ? (
                      <span className="neo-badge neo-badge-tipo">{tipo.nombre}</span>
                    ) : null;
                  })()}
                </div>
              </div>

              <div className="home-card-divider" />

              <div className="home-card-section">
                <div className="home-card-section__label home-card-section__label--blue">
                  Mantenimiento
                </div>
                <p className="home-card-section__text">{registro.mantenimientoRealizado}</p>
              </div>

              <div className="home-card-section home-card-section--obs">
                <div className="home-card-section__label home-card-section__label--purple">
                  Observaciones
                </div>
                <p className="home-card-section__text">{registro.observaciones}</p>
              </div>

              <div className="home-card-meta">
                <span>📅 {registro.fecha}</span>
                <span>🕐 {registro.hora}</span>
              </div>

              {registro.fotos.length > 0 && (
                <div className="home-card-photos home-card-photos--categorized">
                  {registro.fotosCategorized ? (
                    <>
                      {(['antes', 'durante', 'despues'] as const).map((cat) => {
                        const foto = registro.fotosCategorized![cat];
                        if (!foto) return null;
                        const labels = { antes: '🔴 Antes', durante: '🟡 Durante', despues: '🟢 Después' };
                        return (
                          <div key={cat} className="neo-photo home-card-photo home-card-photo--labeled">
                            <img
                              src={foto.startsWith('data:') ? foto : `data:image/jpeg;base64,${foto}`}
                              alt={labels[cat]}
                            />
                            <span className="home-card-photo__label">{labels[cat]}</span>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    registro.fotos.map((foto, index) => (
                      <div key={index} className="neo-photo home-card-photo">
                        <img
                          src={foto.startsWith('data:') ? foto : `data:image/jpeg;base64,${foto}`}
                          alt={`Foto ${index + 1}`}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}

        <div className="home-spacer" />

        {/* Overlay para cerrar FAB */}
        {fabOpen && (
          <div className="fab-overlay" onClick={() => setFabOpen(false)} />
        )}

        {/* FAB expandible estilo Nequi */}
        <div className={`fab-speed-dial ${fabOpen ? 'fab-speed-dial--open' : ''}`}>
          {fabOpen && (
            <div className="fab-speed-dial__options">
              <button
                className="fab-speed-dial__option"
                onClick={() => { setFabOpen(false); history.push('/configuracion'); }}
              >
                <span className="fab-speed-dial__label">Configuración</span>
                <div className="fab-speed-dial__icon-btn fab-speed-dial__icon-btn--config">
                  <IonIcon icon={settingsOutline} />
                </div>
              </button>
              <button
                className="fab-speed-dial__option"
                onClick={() => { setFabOpen(false); history.push('/formulario'); }}
              >
                <span className="fab-speed-dial__label">Nuevo Mantenimiento</span>
                <div className="fab-speed-dial__icon-btn fab-speed-dial__icon-btn--create">
                  <IonIcon icon={construct} />
                </div>
              </button>
            </div>
          )}
          <button
            className={`fab-speed-dial__main ${fabOpen ? 'fab-speed-dial__main--open' : ''}`}
            onClick={() => setFabOpen(!fabOpen)}
          >
            <IonIcon icon={fabOpen ? closeOutline : add} />
          </button>
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
          duration={2500}
          position="bottom"
          color="dark"
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
