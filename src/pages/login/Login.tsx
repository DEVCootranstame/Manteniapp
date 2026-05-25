import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonLoading,
  IonToast,
} from '@ionic/react';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const { login } = useAuth();
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      history.replace('/welcome');
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Error al iniciar sesión';
      const isNetworkError = raw.toLowerCase().includes('unable to resolve') ||
        raw.toLowerCase().includes('network') ||
        raw.toLowerCase().includes('fetch') ||
        raw.toLowerCase().includes('failed to fetch') ||
        raw.toLowerCase().includes('no address');
      const message = isNetworkError
        ? 'Sin conexión. Verifica tu internet e intenta de nuevo.'
        : raw;
      setError(message);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="login-content">
        <div className="login-container">
          <div className="login-logo">
            <h1 className="login-title">C.H.I.P</h1>
            <p className="login-subtitle">Sistema de Gestión de Equipos</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="login-field">
              <label className="login-label">Correo electrónico</label>
              <input
                type="email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@correo.com"
                autoComplete="email"
              />
            </div>

            <div className="login-field">
              <label className="login-label">Contraseña</label>
              <input
                type="password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              Iniciar Sesión
            </button>

            <p className="login-copyright">© Cootranstame 2026</p>
          </form>
        </div>

        <IonLoading isOpen={loading} message="Iniciando sesión..." />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={error}
          duration={3000}
          position="bottom"
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
