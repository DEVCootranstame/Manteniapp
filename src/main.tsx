import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

/* PWA Elements: permite usar la cámara en el navegador */
import { defineCustomElements } from '@ionic/pwa-elements/loader';
defineCustomElements(window);

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);