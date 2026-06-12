import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IonPage, IonContent, IonIcon, IonLoading, IonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  arrowBackOutline, desktopOutline, hardwareChipOutline,
  businessOutline, chevronDownOutline, informationCircleOutline,
  personOutline, locationOutline, constructOutline,
} from 'ionicons/icons';
import { useAuth } from '../../context/AuthContext';
import { AgenciasService } from '../../services/agencias.service';
import { CatalogsService, Marca, TipoPc, Ubicacion, ResponsableSearch } from '../../services/catalogs.service';
import { SolicitudesService } from '../../services/solicitudes.service';
import { Agencia } from '../../types';
import './CrearEquipo.css';

const ESTADOS = ['Activo', 'Baja', 'Reparacion', 'Prestado'];
const ESTADOS_INVENTARIO = ['Nuevo', 'Usado', 'Obsoleto'];

/* ── Custom Select Dropdown (mismo estilo que agencia) ── */
interface SelectOption { value: string; label: string; }
const CustomSelect: React.FC<{
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}> = ({ label, options, value, onChange, placeholder = '-- Seleccionar --' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div className="crear-equipo-field" ref={ref}>
      <label className="crear-equipo-field__label">{label}</label>
      <button
        className="crear-equipo-agencia-dropdown__btn"
        type="button"
        onClick={() => setOpen(v => !v)}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <IonIcon icon={chevronDownOutline} className={open ? 'crear-equipo-chevron--open' : ''} />
      </button>
      {open && (
        <div className="crear-equipo-agencia-dropdown__list">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              className={`crear-equipo-agencia-dropdown__option ${o.value === value ? 'crear-equipo-agencia-dropdown__option--active' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CrearEquipo: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();

  // Catalogs
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [tiposPc, setTiposPc] = useState<TipoPc[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);

  // Responsable search
  const [respSearch, setRespSearch] = useState('');
  const [respResults, setRespResults] = useState<ResponsableSearch[]>([]);
  const [respSelected, setRespSelected] = useState<ResponsableSearch | null>(null);
  const [showRespResults, setShowRespResults] = useState(false);
  const respTimeout = useRef<any>(null);

  // Agencia dropdown
  const [agenciaOpen, setAgenciaOpen] = useState(false);
  const agenciaRef = useRef<HTMLDivElement>(null);

  // Form state
  const [form, setForm] = useState({
    codigo: '',
    modelo: '',
    serial: '',
    marca_id: '',
    tipoPc_id: '',
    estado: 'Activo',
    estado_inventario: 'Nuevo',
    garantia: '',
    fecha_garantia: '',
    agencia_id: '',
    ubicacion_id: '',
    responsable_id: '',
    procesador: '',
    ram: '',
    disco_duro: '',
    serial_monitor: '',
    serial_teclado: '',
    serial_mouse: '',
    observaciones: '',
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; color: string }>({ show: false, message: '', color: '' });

  // Load catalogs
  useEffect(() => {
    const load = async () => {
      try {
        const [ag, ma, tp, ub] = await Promise.all([
          AgenciasService.getAgenciasForUser(user),
          CatalogsService.getMarcas(),
          CatalogsService.getTiposPc(),
          CatalogsService.getUbicaciones(),
        ]);
        setAgencias(ag);
        setMarcas(ma);
        setTiposPc(tp);
        setUbicaciones(ub);
        // Pre-select agencia if only one
        if (ag.length === 1) {
          setForm(f => ({ ...f, agencia_id: ag[0].id }));
        }
      } catch (e) {
        console.error('Error loading catalogs:', e);
      }
    };
    load();
  }, [user]);

  // Close agencia dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (agenciaRef.current && !agenciaRef.current.contains(e.target as Node)) {
        setAgenciaOpen(false);
      }
    };
    if (agenciaOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [agenciaOpen]);

  // Responsable search with debounce
  const handleRespSearch = useCallback((val: string) => {
    setRespSearch(val);
    setRespSelected(null);
    setForm(f => ({ ...f, responsable_id: '' }));
    if (respTimeout.current) clearTimeout(respTimeout.current);
    if (val.length < 2) {
      setRespResults([]);
      setShowRespResults(false);
      return;
    }
    respTimeout.current = setTimeout(async () => {
      try {
        const results = await CatalogsService.searchResponsables(val);
        setRespResults(results);
        setShowRespResults(true);
      } catch {
        setRespResults([]);
      }
    }, 400);
  }, []);

  const selectResponsable = (r: ResponsableSearch) => {
    setRespSelected(r);
    setRespSearch(r.nombre);
    setForm(f => ({ ...f, responsable_id: String(r.id) }));
    setShowRespResults(false);
  };

  const setField = (key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.codigo.trim()) {
      setToast({ show: true, message: 'El código es obligatorio', color: 'warning' });
      return;
    }
    if (!form.agencia_id) {
      setToast({ show: true, message: 'Selecciona una agencia', color: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const datos_equipo: Record<string, any> = {};
      datos_equipo.Codigo = form.codigo.trim();
      if (form.modelo.trim()) datos_equipo.modelo = form.modelo.trim();
      if (form.serial.trim()) datos_equipo.serial = form.serial.trim();
      if (form.marca_id) datos_equipo.marca_id = Number(form.marca_id);
      if (form.tipoPc_id) datos_equipo.tipoPc_id = Number(form.tipoPc_id);
      datos_equipo.estado = form.estado;
      datos_equipo.estado_inventario = form.estado_inventario;
      if (form.garantia) datos_equipo.garantia = Number(form.garantia);
      if (form.fecha_garantia) datos_equipo.fecha_garantia = form.fecha_garantia;
      datos_equipo.agencia_id = Number(form.agencia_id);
      if (form.ubicacion_id) datos_equipo.ubicacion_id = Number(form.ubicacion_id);
      if (form.responsable_id) datos_equipo.responsable_id = Number(form.responsable_id);
      if (form.procesador.trim()) datos_equipo.procesador = form.procesador.trim();
      if (form.ram.trim()) datos_equipo.ram = form.ram.trim();
      if (form.disco_duro.trim()) datos_equipo.disco_duro = form.disco_duro.trim();
      if (form.serial_monitor.trim()) datos_equipo.serial_monitor = form.serial_monitor.trim();
      if (form.serial_teclado.trim()) datos_equipo.serial_teclado = form.serial_teclado.trim();
      if (form.serial_mouse.trim()) datos_equipo.serial_mouse = form.serial_mouse.trim();
      if (form.observaciones.trim()) datos_equipo.observaciones = form.observaciones.trim();

      const payload = {
        tipo: 'crear_equipo' as const,
        agencia_id: Number(form.agencia_id),
        creado_por: user!.id,
        observaciones: form.observaciones.trim() || undefined,
        datos_equipo,
      };
      console.log('CREAR_EQUIPO payload:', JSON.stringify(payload));
      await SolicitudesService.createSolicitud(payload);

      setToast({ show: true, message: 'Solicitud enviada. El equipo será creado al ser aprobada.', color: 'success' });
      setTimeout(() => history.goBack(), 1500);
    } catch (e: any) {
      console.error('CREAR_EQUIPO error:', e.message, JSON.stringify(e));
      setToast({ show: true, message: e.message || 'Error al enviar solicitud', color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const selectedAgencia = agencias.find(a => a.id === form.agencia_id);

  return (
    <IonPage>
      <IonContent className="crear-equipo-content" fullscreen>
        {/* Header */}
        <div className="crear-equipo-header">
          <button className="crear-equipo-header__back" onClick={() => history.goBack()}>
            <IonIcon icon={arrowBackOutline} />
          </button>
          <h1 className="crear-equipo-header__title">Nuevo Equipo</h1>
        </div>

        {/* Info note */}
        <div className="crear-equipo-info">
          <IonIcon icon={informationCircleOutline} />
          <span>Se enviará como solicitud. El equipo se creará al ser aprobado desde el dashboard.</span>
        </div>

        {/* Información básica */}
        <div className="crear-equipo-section">
          <h3 className="crear-equipo-section__title">
            <IonIcon icon={desktopOutline} />
            Información Básica
          </h3>

          <div className="crear-equipo-field">
            <label className="crear-equipo-field__label">Código *</label>
            <input
              className="crear-equipo-field__input"
              placeholder="Ej: PC-001"
              value={form.codigo}
              onChange={e => setField('codigo', e.target.value)}
            />
          </div>

          <div className="crear-equipo-row">
            <div className="crear-equipo-field">
              <label className="crear-equipo-field__label">Modelo</label>
              <input
                className="crear-equipo-field__input"
                placeholder="Modelo"
                value={form.modelo}
                onChange={e => setField('modelo', e.target.value)}
              />
            </div>
            <div className="crear-equipo-field">
              <label className="crear-equipo-field__label">Serial</label>
              <input
                className="crear-equipo-field__input"
                placeholder="Serial"
                value={form.serial}
                onChange={e => setField('serial', e.target.value)}
              />
            </div>
          </div>

          <div className="crear-equipo-row">
            <CustomSelect
              label="Marca"
              placeholder="-- Marca --"
              value={form.marca_id}
              onChange={v => setField('marca_id', v)}
              options={marcas.map(m => ({ value: String(m.id), label: m.nombre }))}
            />
            <CustomSelect
              label="Tipo PC"
              placeholder="-- Tipo --"
              value={form.tipoPc_id}
              onChange={v => setField('tipoPc_id', v)}
              options={tiposPc.map(t => ({ value: String(t.id), label: t.nombre }))}
            />
          </div>

          <div className="crear-equipo-row">
            <CustomSelect
              label="Estado"
              value={form.estado}
              onChange={v => setField('estado', v)}
              options={ESTADOS.map(e => ({ value: e, label: e }))}
            />
            <CustomSelect
              label="Estado Inventario"
              value={form.estado_inventario}
              onChange={v => setField('estado_inventario', v)}
              options={ESTADOS_INVENTARIO.map(e => ({ value: e, label: e }))}
            />
          </div>

          <div className="crear-equipo-row">
            <div className="crear-equipo-field">
              <label className="crear-equipo-field__label">Garantía (meses)</label>
              <input
                className="crear-equipo-field__input"
                type="number"
                placeholder="12"
                value={form.garantia}
                onChange={e => setField('garantia', e.target.value)}
              />
            </div>
            <div className="crear-equipo-field">
              <label className="crear-equipo-field__label">Fecha Garantía</label>
              <input
                className="crear-equipo-field__input"
                type="date"
                value={form.fecha_garantia}
                onChange={e => setField('fecha_garantia', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Ubicación y Asignación */}
        <div className="crear-equipo-section">
          <h3 className="crear-equipo-section__title">
            <IonIcon icon={locationOutline} />
            Ubicación y Asignación
          </h3>

          {/* Agencia dropdown */}
          <div className="crear-equipo-field" ref={agenciaRef}>
            <label className="crear-equipo-field__label">Agencia *</label>
            <button
              className="crear-equipo-agencia-dropdown__btn"
              type="button"
              onClick={() => setAgenciaOpen(v => !v)}
            >
              <IonIcon icon={businessOutline} />
              <span>{selectedAgencia ? `${selectedAgencia.codigo} - ${selectedAgencia.nombre}` : '-- Selecciona agencia --'}</span>
              <IonIcon icon={chevronDownOutline} />
            </button>
            {agenciaOpen && (
              <div className="crear-equipo-agencia-dropdown__list">
                {agencias.length === 0 ? (
                  <div className="crear-equipo-agencia-dropdown__option" style={{ color: '#94a3b8' }}>Cargando...</div>
                ) : agencias.map(a => (
                  <button
                    key={a.id}
                    type="button"
                    className={`crear-equipo-agencia-dropdown__option ${a.id === form.agencia_id ? 'crear-equipo-agencia-dropdown__option--active' : ''}`}
                    onClick={() => { setField('agencia_id', a.id); setAgenciaOpen(false); }}
                  >
                    {a.codigo} - {a.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          <CustomSelect
            label="Ubicación"
            placeholder="-- Ubicación --"
            value={form.ubicacion_id}
            onChange={v => setField('ubicacion_id', v)}
            options={ubicaciones.map(u => ({ value: String(u.id), label: u.nombre }))}
          />

          {/* Responsable search */}
          <div className="crear-equipo-field crear-equipo-responsable-search">
            <label className="crear-equipo-field__label">Responsable</label>
            <input
              className="crear-equipo-field__input"
              placeholder="Buscar por nombre o cédula..."
              value={respSearch}
              onChange={e => handleRespSearch(e.target.value)}
              onFocus={() => { if (respResults.length > 0) setShowRespResults(true); }}
              onBlur={() => setTimeout(() => setShowRespResults(false), 200)}
            />
            {showRespResults && respResults.length > 0 && (
              <div className="crear-equipo-responsable-search__results">
                {respResults.map(r => (
                  <button
                    key={r.id}
                    className="crear-equipo-responsable-search__item"
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => selectResponsable(r)}
                  >
                    {r.nombre}
                    <small>CC: {r.numero_documento} {r.cargo ? `• ${r.cargo}` : ''}</small>
                  </button>
                ))}
              </div>
            )}
            {respSelected && (
              <small style={{ color: '#6366F1', marginTop: 4, display: 'block' }}>
                ✓ {respSelected.nombre} — CC {respSelected.numero_documento}
              </small>
            )}
          </div>
        </div>

        {/* Especificaciones técnicas */}
        <div className="crear-equipo-section">
          <h3 className="crear-equipo-section__title">
            <IonIcon icon={hardwareChipOutline} />
            Especificaciones Técnicas
          </h3>

          <div className="crear-equipo-row">
            <div className="crear-equipo-field">
              <label className="crear-equipo-field__label">Procesador</label>
              <input
                className="crear-equipo-field__input"
                placeholder="Ej: Intel i5-12400"
                value={form.procesador}
                onChange={e => setField('procesador', e.target.value)}
              />
            </div>
            <div className="crear-equipo-field">
              <label className="crear-equipo-field__label">RAM</label>
              <input
                className="crear-equipo-field__input"
                placeholder="Ej: 16GB"
                value={form.ram}
                onChange={e => setField('ram', e.target.value)}
              />
            </div>
          </div>

          <div className="crear-equipo-field">
            <label className="crear-equipo-field__label">Disco Duro</label>
            <input
              className="crear-equipo-field__input"
              placeholder="Ej: SSD 512GB"
              value={form.disco_duro}
              onChange={e => setField('disco_duro', e.target.value)}
            />
          </div>
        </div>

        {/* Periféricos */}
        <div className="crear-equipo-section">
          <h3 className="crear-equipo-section__title">
            <IonIcon icon={constructOutline} />
            Periféricos
          </h3>

          <div className="crear-equipo-field">
            <label className="crear-equipo-field__label">Serial Monitor</label>
            <input
              className="crear-equipo-field__input"
              placeholder="Serial del monitor"
              value={form.serial_monitor}
              onChange={e => setField('serial_monitor', e.target.value)}
            />
          </div>

          <div className="crear-equipo-row">
            <div className="crear-equipo-field">
              <label className="crear-equipo-field__label">Serial Teclado</label>
              <input
                className="crear-equipo-field__input"
                placeholder="Serial teclado"
                value={form.serial_teclado}
                onChange={e => setField('serial_teclado', e.target.value)}
              />
            </div>
            <div className="crear-equipo-field">
              <label className="crear-equipo-field__label">Serial Mouse</label>
              <input
                className="crear-equipo-field__input"
                placeholder="Serial mouse"
                value={form.serial_mouse}
                onChange={e => setField('serial_mouse', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="crear-equipo-section">
          <div className="crear-equipo-field">
            <label className="crear-equipo-field__label">Observaciones</label>
            <textarea
              className="crear-equipo-field__textarea"
              placeholder="Notas adicionales..."
              value={form.observaciones}
              onChange={e => setField('observaciones', e.target.value)}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          className="crear-equipo-submit"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Enviar Solicitud de Equipo'}
        </button>

        <IonLoading isOpen={loading} message="Enviando solicitud..." />
        <IonToast
          isOpen={toast.show}
          message={toast.message}
          color={toast.color}
          duration={3000}
          onDidDismiss={() => setToast({ ...toast, show: false })}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default CrearEquipo;
