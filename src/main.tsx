import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

/* PWA Elements: permite usar la cámara en el navegador */
import { defineCustomElements } from '@ionic/pwa-elements/loader';
defineCustomElements(window);

// Configurar StatusBar en Android/iOS
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false });
  StatusBar.setStyle({ style: Style.Light });
  StatusBar.setBackgroundColor({ color: '#E8EDF2' });
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);