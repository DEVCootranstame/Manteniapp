import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonSearchbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonLoading,
  IonAlert,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonViewWillEnter,
} from '@ionic/react';
import { add, cloudUpload, downloadOutline, refreshOutline, businessOutline } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { supabase } from '../supabaseClient';
import { useHistory } from 'react-router-dom';
import { decode } from 'base64-arraybuffer';
import { Mantenimiento, Agencia, STORAGE_KEY, AGENCIAS_STORAGE_KEY } from '../types';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();
  const [registros, setRegistros] = useState<Mantenimiento[]>([]);
  const [filteredRegistros, setFilteredRegistros] = useState<Mantenimiento[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [filtroAgencia, setFiltroAgencia] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertHeader, setAlertHeader] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);

  const cargarAgencias = useCallback(async () => {
    const { value } = await Preferences.get({ key: AGENCIAS_STORAGE_KEY });
    if (value) {
      setAgencias(JSON.parse(value));
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
  });

  useEffect(() => {
    cargarRegistros();
    cargarAgencias();
  }, [cargarRegistros, cargarAgencias]);

  useEffect(() => {
    let resultado = registros;

    // Filtro por agencia
    if (filtroAgencia) {
      resultado = resultado.filter((r) => r.agenciaId === filtroAgencia);
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
  }, [searchText, registros, filtroAgencia]);

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

        const urlsFotos: string[] = [];

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
            urlsFotos.push('');
            continue;
          }

          const { data: publicUrlData } = supabase.storage
            .from('fotos-mantenimiento')
            .getPublicUrl(filePath);

          urlsFotos.push(publicUrlData.publicUrl);
        }

        const agencia = agencias.find((a) => a.id === registro.agenciaId);
        const ubicacion = agencia?.ubicaciones.find((u) => u.id === registro.ubicacionId);

        const insertPayload: Record<string, string | null> = {
          nombre_equipo: registro.nombreEquipo,
          proveedor: registro.proveedor,
          mantenimiento_realizado: registro.mantenimientoRealizado,
          observaciones: registro.observaciones,
          fecha: registro.fecha,
          hora: registro.hora,
          foto_1_url: urlsFotos[0] && urlsFotos[0] !== '' ? urlsFotos[0] : null,
          foto_2_url: urlsFotos[1] && urlsFotos[1] !== '' ? urlsFotos[1] : null,
          foto_3_url: urlsFotos[2] && urlsFotos[2] !== '' ? urlsFotos[2] : null,
          agencia_codigo: agencia?.codigo || null,
          agencia_nombre: agencia?.nombre || null,
          ubicacion_nombre: ubicacion?.nombre || null,
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
        'Observaciones', 'Fecha', 'Hora', 'Foto_1', 'Foto_2', 'Foto_3', 'Sincronizado',
      ];

      const escapeCsv = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const rows = registros.map((r) => {
        const fotoLabel = (idx: number) => {
          if (!r.fotos[idx]) return 'Sin foto';
          return r.sincronizado ? 'Sincronizada en Supabase' : 'Pendiente de sincronizar';
        };

        return [
          escapeCsv(r.id), escapeCsv(r.nombreEquipo), escapeCsv(r.proveedor),
          escapeCsv(r.mantenimientoRealizado), escapeCsv(r.observaciones),
          escapeCsv(r.fecha), escapeCsv(r.hora),
          fotoLabel(0), fotoLabel(1), fotoLabel(2),
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

  /* ======================== LIMPIAR SINCRONIZADOS ======================== */
  const limpiarSincronizados = async () => {
    const pendientes = registros.filter((r) => !r.sincronizado);
    await Preferences.set({
      key: STORAGE_KEY,
      value: JSON.stringify(pendientes),
    });
    setRegistros(pendientes);
    setFilteredRegistros(pendientes);
    mostrarToast(`Se eliminaron ${registros.length - pendientes.length} registros sincronizados`);
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

        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value || '')}
          placeholder="Buscar equipo, proveedor, fecha..."
          debounce={300}
          animated
          className="neo-searchbar"
        />

        {/* Filtro por agencia + acceso a gestión */}
        <div className="home-agencia-bar">
          <select
            className="neo-select-sm"
            value={filtroAgencia}
            onChange={(e) => setFiltroAgencia(e.target.value)}
          >
            <option value="">Todas las agencias</option>
            {agencias.map((a) => (
              <option key={a.id} value={a.id}>
                {a.codigo} - {a.nombre}
              </option>
            ))}
          </select>
          <button
            className="agencia-config-btn"
            onClick={() => history.push('/agencias')}
          >
            <IonIcon icon={businessOutline} />
          </button>
        </div>

        {/* Stats + acciones */}
        <div className="neo-card neo-animate">
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

          {sincronizados > 0 && (
            <button className="neo-btn home-btn-clean" onClick={limpiarSincronizados}>
              <IonIcon icon={refreshOutline} />
              Limpiar {sincronizados} sincronizados
            </button>
          )}
        </div>

        {/* Lista de registros */}
        {filteredRegistros.length === 0 ? (
          <div className="home-empty">
            <div className="home-empty__icon">📋</div>
            <h3 className="home-empty__title">No hay registros</h3>
            <p className="home-empty__subtitle">Presiona + para agregar un mantenimiento</p>
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
                <span
                  className={`neo-badge ${registro.sincronizado ? 'neo-badge-green' : 'neo-badge-orange'}`}
                >
                  {registro.sincronizado ? '✓ Sync' : '⏳ Pendiente'}
                </span>
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
                <div className="home-card-photos">
                  {registro.fotos.map((foto, index) => (
                    <div key={index} className="neo-photo home-card-photo">
                      <img
                        src={foto.startsWith('data:') ? foto : `data:image/jpeg;base64,${foto}`}
                        alt={`Foto ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        <div className="home-spacer" />

        <IonFab vertical="bottom" horizontal="end" slot="fixed" className="neo-fab">
          <IonFabButton onClick={() => history.push('/formulario')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

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
