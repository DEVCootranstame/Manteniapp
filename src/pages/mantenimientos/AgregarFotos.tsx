import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonIcon, IonLoading, IonAlert, IonToast } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { arrowBackOutline, cameraOutline, camera, close, cloudUploadOutline, imageOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../supabaseClient';
import { Mantenimiento, STORAGE_KEY } from '../../types';
import './AgregarFotos.css';

const CATS = ['antes', 'durante', 'despues'] as const;
type Cat = typeof CATS[number];
const LABELS: Record<Cat, string> = { antes: 'Antes', durante: 'Durante', despues: 'Después' };
const ICONS: Record<Cat, string> = { antes: '🔴', durante: '🟡', despues: '🟢' };

const AgregarFotos: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();

  const [registro, setRegistro] = useState<Mantenimiento | null>(null);
  const [fotos, setFotos] = useState<Record<Cat, string | null>>({ antes: null, durante: null, despues: null });
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertHeader, setAlertHeader] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    Preferences.get({ key: STORAGE_KEY }).then(({ value }) => {
      if (!value) return;
      const lista: Mantenimiento[] = JSON.parse(value);
      const found = lista.find(r => r.id === id);
      if (found) setRegistro(found);
    });
  }, [id]);

  const tomarFoto = async (cat: Cat) => {
    if (fotos[cat]) return;
    try {
      const image = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
        correctOrientation: true,
        width: 1280,
        height: 1280,
      });
      if (image.base64String) {
        setFotos(prev => ({ ...prev, [cat]: image.base64String! }));
        setToastMsg(`Foto "${LABELS[cat]}" lista`);
        setShowToast(true);
      }
    } catch (e: any) {
      if (!e?.message?.includes('cancel') && !e?.message?.includes('User cancelled')) {
        setAlertHeader('Error');
        setAlertMsg(`No se pudo obtener la foto: ${e?.message || 'Error desconocido'}`);
        setShowAlert(true);
      }
    }
  };

  const eliminarFoto = (cat: Cat) => setFotos(prev => ({ ...prev, [cat]: null }));

  const hayAlMenosUna = Object.values(fotos).some(Boolean);

  const subirFotos = async () => {
    if (!registro) return;
    if (!hayAlMenosUna) {
      setAlertHeader('Sin fotos');
      setAlertMsg('Agrega al menos una foto antes de guardar.');
      setShowAlert(true);
      return;
    }

    setSubiendo(true);
    try {
      const urlsFotos: Partial<Record<Cat, string>> = {};
      const catMap: Record<Cat, 'foto_1_url' | 'foto_2_url' | 'foto_3_url'> = {
        antes: 'foto_1_url',
        durante: 'foto_2_url',
        despues: 'foto_3_url',
      };

      for (const cat of CATS) {
        const base64 = fotos[cat];
        if (!base64) continue;

        setProgreso(`Subiendo foto "${LABELS[cat]}"...`);
        const pureBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
        const blob = new Blob([decode(pureBase64)], { type: 'image/jpeg' });
        const filePath = `mantenimientos/${registro.id}_foto_${cat}_${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('fotos-mantenimiento')
          .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

        if (uploadError) {
          console.error(`Error subiendo ${cat}:`, uploadError);
          continue;
        }

        const { data } = supabase.storage.from('fotos-mantenimiento').getPublicUrl(filePath);
        urlsFotos[cat] = data.publicUrl;
      }

      if (Object.keys(urlsFotos).length === 0) {
        throw new Error('No se pudo subir ninguna foto. Verifica tu conexión.');
      }

      setProgreso('Actualizando registro...');

      // Actualizar en Supabase
      const patch: Record<string, string | null> = {
        foto_1_url: urlsFotos.antes ?? null,
        foto_2_url: urlsFotos.durante ?? null,
        foto_3_url: urlsFotos.despues ?? null,
      };
      const { error: patchError } = await supabase
        .from('mantenimientos')
        .update(patch)
        .eq('id', registro.id);

      if (patchError) throw new Error(`Error actualizando BD: ${patchError.message}`);

      // Actualizar en Preferences
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (value) {
        const lista: Mantenimiento[] = JSON.parse(value);
        const idx = lista.findIndex(r => r.id === registro.id);
        if (idx !== -1) {
          lista[idx] = {
            ...lista[idx],
            foto_1_url: urlsFotos.antes ?? lista[idx].foto_1_url ?? null,
            foto_2_url: urlsFotos.durante ?? lista[idx].foto_2_url ?? null,
            foto_3_url: urlsFotos.despues ?? lista[idx].foto_3_url ?? null,
          };
          await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(lista) });
        }
      }

      const subidas = Object.keys(urlsFotos).length;
      setToastMsg(`${subidas} foto${subidas > 1 ? 's' : ''} guardada${subidas > 1 ? 's' : ''} correctamente`);
      setShowToast(true);
      setTimeout(() => history.replace('/home'), 1800);
    } catch (e: any) {
      setAlertHeader('Error al subir');
      setAlertMsg(e?.message || 'No se pudo subir las fotos. Intenta de nuevo.');
      setShowAlert(true);
    } finally {
      setSubiendo(false);
      setProgreso('');
    }
  };

  return (
    <IonPage>
      <IonContent className="agfoto-content" fullscreen>

        {/* Header */}
        <div className="agfoto-header">
          <button className="agfoto-header__back" onClick={() => history.goBack()}>
            <IonIcon icon={arrowBackOutline} />
          </button>
          <div className="agfoto-header__info">
            <h1 className="agfoto-header__title">Agregar Fotos</h1>
            {registro && <p className="agfoto-header__code">{registro.nombreEquipo}</p>}
          </div>
          <div className="agfoto-header__icon-wrap">
            <IonIcon icon={cameraOutline} />
          </div>
        </div>

        {registro && (
          <div className="agfoto-meta">
            <span>📅 {registro.fecha}</span>
            <span>🔧 {registro.proveedor}</span>
          </div>
        )}

        <div className="agfoto-form">

          {/* Info banner */}
          <div className="agfoto-banner">
            <IonIcon icon={imageOutline} />
            <div>
              <p className="agfoto-banner__title">Agregar evidencia fotográfica</p>
              <p className="agfoto-banner__desc">Puedes tomar foto con la cámara o seleccionar desde la galería.</p>
            </div>
          </div>

          {/* Slots de fotos */}
          <div className="agfoto-slots">
            {CATS.map(cat => (
              <div key={cat} className="agfoto-slot">
                <p className="agfoto-slot__label">
                  {ICONS[cat]} {LABELS[cat]}
                  <span className="agfoto-slot__optional"> (opcional)</span>
                </p>
                {fotos[cat] ? (
                  <div className="agfoto-foto-item">
                    <img
                      src={`data:image/jpeg;base64,${fotos[cat]}`}
                      alt={LABELS[cat]}
                      className="agfoto-foto-item__img"
                    />
                    <button className="agfoto-foto-item__delete" onClick={() => eliminarFoto(cat)}>
                      <IonIcon icon={close} />
                    </button>
                  </div>
                ) : (
                  <button className="agfoto-add-btn" onClick={() => tomarFoto(cat)}>
                    <IonIcon icon={camera} />
                    <span>Cámara / Galería</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Botón subir */}
          <button
            className={`agfoto-submit ${hayAlMenosUna ? 'agfoto-submit--ready' : ''}`}
            onClick={subirFotos}
            disabled={subiendo}
          >
            <IonIcon icon={cloudUploadOutline} />
            Subir Fotos
          </button>

        </div>

        <IonLoading isOpen={subiendo} message={progreso || 'Subiendo...'} />

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

export default AgregarFotos;
