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
import {
  SugerenciaMantenimiento,
  TipoMantenimiento,
  SUGERENCIAS_STORAGE_KEY,
  TIPOS_MANTENIMIENTO_STORAGE_KEY,
} from '../types';
import './GestionSugerencias.css';

const SUGERENCIAS_INICIALES: SugerenciaMantenimiento[] = [
  // Preventivo
  { id: '1', tipoMantenimiento: 'Preventivo', texto: 'Limpieza interna y externa del equipo, remoción de polvo acumulado en ventiladores, disipadores y componentes internos con aire comprimido' },
  { id: '2', tipoMantenimiento: 'Preventivo', texto: 'Revisión y ajuste de conexiones internas (cables SATA, alimentación, RAM, tarjetas de expansión) verificando que estén correctamente asentadas' },
  { id: '3', tipoMantenimiento: 'Preventivo', texto: 'Aplicación de pasta térmica nueva en procesador y limpieza del disipador de calor para optimizar la transferencia térmica' },
  { id: '4', tipoMantenimiento: 'Preventivo', texto: 'Actualización de sistema operativo, drivers de dispositivos y firmware del BIOS/UEFI a las últimas versiones estables disponibles' },
  { id: '5', tipoMantenimiento: 'Preventivo', texto: 'Ejecución de diagnóstico completo de disco duro (S.M.A.R.T.) y verificación de integridad del sistema de archivos' },
  { id: '6', tipoMantenimiento: 'Preventivo', texto: 'Verificación y limpieza de puertos USB, VGA, HDMI, RJ-45 y demás conectores externos del equipo' },
  { id: '7', tipoMantenimiento: 'Preventivo', texto: 'Revisión del estado de la batería (en portátiles), calibración y verificación de ciclos de carga restantes' },
  { id: '8', tipoMantenimiento: 'Preventivo', texto: 'Inspección visual del estado de capacitores, soldaduras y componentes de la placa base en busca de señales de deterioro' },
  { id: '9', tipoMantenimiento: 'Preventivo', texto: 'Desfragmentación de disco duro mecánico (HDD) u optimización de unidad de estado sólido (SSD) mediante comando TRIM' },
  { id: '10', tipoMantenimiento: 'Preventivo', texto: 'Limpieza y lubricación de ventiladores internos, verificación de velocidades de rotación y niveles de ruido' },

  // Correctivo
  { id: '11', tipoMantenimiento: 'Correctivo', texto: 'Reemplazo de disco duro dañado por unidad nueva (HDD/SSD), reinstalación de sistema operativo y restauración de datos desde respaldo' },
  { id: '12', tipoMantenimiento: 'Correctivo', texto: 'Sustitución de fuente de poder defectuosa, verificación de voltajes de salida y prueba de estabilidad bajo carga' },
  { id: '13', tipoMantenimiento: 'Correctivo', texto: 'Reparación de conector de carga dañado en equipo portátil, soldadura de pines y verificación de continuidad eléctrica' },
  { id: '14', tipoMantenimiento: 'Correctivo', texto: 'Reemplazo de módulos de memoria RAM defectuosos detectados mediante prueba de diagnóstico (MemTest86)' },
  { id: '15', tipoMantenimiento: 'Correctivo', texto: 'Reparación de falla en pantalla (portátil): reemplazo de cable flex, inversor o panel LCD/LED según diagnóstico' },
  { id: '16', tipoMantenimiento: 'Correctivo', texto: 'Eliminación de malware/virus, limpieza profunda del sistema con herramientas especializadas y restauración de configuración de seguridad' },
  { id: '17', tipoMantenimiento: 'Correctivo', texto: 'Reemplazo de teclado dañado por derrame de líquidos, limpieza de circuitos afectados y prueba de funcionamiento completo' },
  { id: '18', tipoMantenimiento: 'Correctivo', texto: 'Reparación de sistema de refrigeración: reemplazo de ventilador defectuoso, limpieza de ductos de aire y reemplazo de pasta térmica' },
  { id: '19', tipoMantenimiento: 'Correctivo', texto: 'Corrección de falla en placa base: diagnóstico de componentes dañados (capacitores, reguladores de voltaje) y reparación o reemplazo' },
  { id: '20', tipoMantenimiento: 'Correctivo', texto: 'Restauración de sistema operativo corrupto: reparación del sector de arranque (MBR/GPT), archivos de sistema y registro de Windows' },

  // Predictivo
  { id: '21', tipoMantenimiento: 'Predictivo', texto: 'Análisis de datos S.M.A.R.T. del disco duro para predicción de fallas inminentes y planificación de reemplazo preventivo' },
  { id: '22', tipoMantenimiento: 'Predictivo', texto: 'Monitoreo de temperaturas de CPU y GPU bajo carga mediante software especializado para detectar degradación del sistema de refrigeración' },
  { id: '23', tipoMantenimiento: 'Predictivo', texto: 'Análisis de rendimiento del sistema (benchmark) comparando resultados con línea base para identificar degradación de componentes' },
  { id: '24', tipoMantenimiento: 'Predictivo', texto: 'Inspección termográfica con cámara infrarroja para identificar puntos calientes anormales en placa base y fuente de poder' },
  { id: '25', tipoMantenimiento: 'Predictivo', texto: 'Análisis de logs del sistema operativo y visor de eventos para identificar patrones de errores recurrentes que indiquen fallas futuras' },
  { id: '26', tipoMantenimiento: 'Predictivo', texto: 'Medición de voltajes de la fuente de poder con multímetro digital en todas las líneas (3.3V, 5V, 12V) para detectar variaciones fuera de rango' },
  { id: '27', tipoMantenimiento: 'Predictivo', texto: 'Prueba de estrés de memoria RAM extendida (mínimo 4 pasadas) para detectar errores intermitentes que indiquen degradación del módulo' },
  { id: '28', tipoMantenimiento: 'Predictivo', texto: 'Evaluación del estado de la batería (portátiles) mediante análisis de ciclos de carga, capacidad real vs. diseño y tasa de degradación' },
];

const GestionSugerencias: React.FC = () => {
  const [sugerencias, setSugerencias] = useState<SugerenciaMantenimiento[]>([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState<TipoMantenimiento[]>([]);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [showEditAlert, setShowEditAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [sugerenciaSeleccionada, setSugerenciaSeleccionada] = useState<SugerenciaMantenimiento | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const cargarDatos = useCallback(async () => {
    const { value: tiposValue } = await Preferences.get({ key: TIPOS_MANTENIMIENTO_STORAGE_KEY });
    if (tiposValue) {
      setTiposMantenimiento(JSON.parse(tiposValue));
    }

    const { value } = await Preferences.get({ key: SUGERENCIAS_STORAGE_KEY });
    if (value) {
      setSugerencias(JSON.parse(value));
    } else {
      await Preferences.set({
        key: SUGERENCIAS_STORAGE_KEY,
        value: JSON.stringify(SUGERENCIAS_INICIALES),
      });
      setSugerencias(SUGERENCIAS_INICIALES);
    }
  }, []);

  useIonViewWillEnter(() => {
    cargarDatos();
  });

  const guardarSugerencias = async (nuevas: SugerenciaMantenimiento[]) => {
    await Preferences.set({
      key: SUGERENCIAS_STORAGE_KEY,
      value: JSON.stringify(nuevas),
    });
    setSugerencias(nuevas);
  };

  const agregarSugerencia = async (tipo: string, texto: string) => {
    if (!tipo.trim() || !texto.trim()) return;

    const nueva: SugerenciaMantenimiento = {
      id: crypto.randomUUID(),
      tipoMantenimiento: tipo.trim(),
      texto: texto.trim(),
    };

    const actualizadas = [...sugerencias, nueva];
    await guardarSugerencias(actualizadas);
    setToastMessage('Sugerencia creada');
    setShowToast(true);
  };

  const editarSugerencia = async (tipo: string, texto: string) => {
    if (!sugerenciaSeleccionada || !tipo.trim() || !texto.trim()) return;

    const actualizadas = sugerencias.map((s) =>
      s.id === sugerenciaSeleccionada.id ? { ...s, tipoMantenimiento: tipo.trim(), texto: texto.trim() } : s
    );
    await guardarSugerencias(actualizadas);
    setToastMessage('Sugerencia actualizada');
    setShowToast(true);
  };

  const eliminarSugerencia = async () => {
    if (!sugerenciaSeleccionada) return;
    const actualizadas = sugerencias.filter((s) => s.id !== sugerenciaSeleccionada.id);
    await guardarSugerencias(actualizadas);
    setToastMessage('Sugerencia eliminada');
    setShowToast(true);
    setSugerenciaSeleccionada(null);
  };

  const sugerenciasFiltradas = filtroTipo
    ? sugerencias.filter((s) => s.tipoMantenimiento === filtroTipo)
    : sugerencias;

  const tiposUnicos = Array.from(new Set(sugerencias.map((s) => s.tipoMantenimiento)));

  return (
    <IonPage>
      <IonHeader className="sugerencias-header" mode="md">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/configuracion" text="Volver" />
          </IonButtons>
          <IonTitle>Sugerencias</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="sugerencias-container">
          <button className="sugerencias-add-btn" onClick={() => setShowAddAlert(true)}>
            <IonIcon icon={add} />
            Nueva Sugerencia
          </button>

          {/* Filtro por tipo */}
          <div className="sugerencias-filtro">
            <select
              className="sugerencias-filtro__select"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="">Todos los tipos ({sugerencias.length})</option>
              {tiposUnicos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo} ({sugerencias.filter((s) => s.tipoMantenimiento === tipo).length})
                </option>
              ))}
            </select>
          </div>

          {sugerenciasFiltradas.length === 0 ? (
            <div className="sugerencias-empty">
              <p>No hay sugerencias{filtroTipo ? ` para "${filtroTipo}"` : ''}</p>
            </div>
          ) : (
            <div className="sugerencias-list">
              {sugerenciasFiltradas.map((sug) => (
                <div key={sug.id} className="sugerencia-card">
                  <div className="sugerencia-card__info">
                    <span className="sugerencia-card__tipo">{sug.tipoMantenimiento}</span>
                    <span className="sugerencia-card__texto">{sug.texto}</span>
                  </div>
                  <div className="sugerencia-card__actions">
                    <button
                      className="sugerencia-btn sugerencia-btn--edit"
                      onClick={() => {
                        setSugerenciaSeleccionada(sug);
                        setShowEditAlert(true);
                      }}
                    >
                      <IonIcon icon={pencil} />
                    </button>
                    <button
                      className="sugerencia-btn sugerencia-btn--delete"
                      onClick={() => {
                        setSugerenciaSeleccionada(sug);
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

        {/* Alert: Agregar sugerencia */}
        <IonAlert
          isOpen={showAddAlert}
          onDidDismiss={() => setShowAddAlert(false)}
          header="Nueva Sugerencia"
          inputs={[
            {
              name: 'tipo',
              type: 'text',
              placeholder: 'Tipo (ej: Preventivo)',
              attributes: {
                list: 'tipos-list',
              },
            },
            {
              name: 'texto',
              type: 'textarea',
              placeholder: 'Descripción técnica del mantenimiento...',
              attributes: {
                rows: 4,
              },
            },
          ]}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Crear',
              handler: (data) => {
                if (!data.tipo?.trim() || !data.texto?.trim()) {
                  setToastMessage('Completa ambos campos');
                  setShowToast(true);
                  return false;
                }
                agregarSugerencia(data.tipo, data.texto);
              },
            },
          ]}
        />

        {/* Alert: Editar sugerencia */}
        <IonAlert
          isOpen={showEditAlert}
          onDidDismiss={() => setShowEditAlert(false)}
          header="Editar Sugerencia"
          inputs={[
            {
              name: 'tipo',
              type: 'text',
              value: sugerenciaSeleccionada?.tipoMantenimiento || '',
              placeholder: 'Tipo',
            },
            {
              name: 'texto',
              type: 'textarea',
              value: sugerenciaSeleccionada?.texto || '',
              placeholder: 'Descripción técnica...',
              attributes: {
                rows: 4,
              },
            },
          ]}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Guardar',
              handler: (data) => {
                if (!data.tipo?.trim() || !data.texto?.trim()) {
                  setToastMessage('Completa ambos campos');
                  setShowToast(true);
                  return false;
                }
                editarSugerencia(data.tipo, data.texto);
              },
            },
          ]}
        />

        {/* Alert: Confirmar eliminar */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Eliminar Sugerencia"
          message={`¿Eliminar esta sugerencia de "${sugerenciaSeleccionada?.tipoMantenimiento}"?`}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Eliminar',
              role: 'destructive',
              handler: () => {
                eliminarSugerencia();
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

export default GestionSugerencias;
