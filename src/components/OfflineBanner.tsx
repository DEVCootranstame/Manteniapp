import React, { useState, useEffect } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { cloudOfflineOutline, cloudDoneOutline, syncOutline } from 'ionicons/icons';
import { useNetwork } from '../hooks/useNetwork';
import './OfflineBanner.css';

const OfflineBanner: React.FC = () => {
  const { isOnline, pendingCount, isSyncing, lastSynced, syncNow } = useNetwork();
  const [showSynced, setShowSynced] = useState(false);

  useEffect(() => {
    if (lastSynced) {
      setShowSynced(true);
      const t = setTimeout(() => setShowSynced(false), 3500);
      return () => clearTimeout(t);
    }
  }, [lastSynced]);

  if (isOnline && pendingCount === 0 && !showSynced) return null;

  if (showSynced && isOnline && pendingCount === 0) {
    return (
      <div className="offline-banner offline-banner--synced">
        <IonIcon icon={cloudDoneOutline} />
        <span>Solicitudes sincronizadas ✓</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="offline-banner offline-banner--offline">
        <IonIcon icon={cloudOfflineOutline} />
        <span>
          Sin conexión
          {pendingCount > 0 ? ` · ${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}` : ''}
        </span>
      </div>
    );
  }

  // Online but still has pending items (e.g. error state)
  if (pendingCount > 0) {
    return (
      <button className="offline-banner offline-banner--pending" onClick={syncNow} disabled={isSyncing}>
        {isSyncing ? <IonSpinner name="crescent" /> : <IonIcon icon={syncOutline} />}
        <span>
          {isSyncing
            ? 'Sincronizando...'
            : `${pendingCount} solicitud${pendingCount > 1 ? 'es' : ''} pendiente${pendingCount > 1 ? 's' : ''} — Tocar para enviar`}
        </span>
      </button>
    );
  }

  return null;
};

export default OfflineBanner;
