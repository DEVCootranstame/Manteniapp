import React, { createContext, useContext, useState, useCallback } from 'react';
import { IonToast } from '@ionic/react';

interface ToastContextType {
  showToast: (message: string, color?: 'success' | 'danger' | 'warning' | 'primary') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState('');
  const [color, setColor] = useState<'success' | 'danger' | 'warning' | 'primary'>('danger');
  const [isOpen, setIsOpen] = useState(false);

  const showToast = useCallback((msg: string, c: 'success' | 'danger' | 'warning' | 'primary' = 'danger') => {
    setMessage(msg);
    setColor(c);
    setIsOpen(true);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <IonToast
        isOpen={isOpen}
        message={message}
        duration={3000}
        color={color}
        position="top"
        onDidDismiss={() => setIsOpen(false)}
        buttons={[{ text: 'X', role: 'cancel' }]}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
