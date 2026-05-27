import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { useAuth } from './AuthContext';
import { Agencia } from '../types';
import { AgenciasService } from '../services/agencias.service';

const FILTER_STORAGE_KEY = 'agencia_filter_selected';

interface AgenciaFilterContextType {
  agenciaSeleccionada: Agencia | null;
  agenciaFilterId: string;
  agenciasDisponibles: Agencia[];
  setFilterAgencia: (id: string) => void;
  isFilterActive: boolean;
  getFilteredAgenciaId: () => number | undefined;
}

const AgenciaFilterContext = createContext<AgenciaFilterContextType | undefined>(undefined);

export const AgenciaFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [agenciaFilterId, setAgenciaFilterId] = useState<string>('todas');
  const [agenciasDisponibles, setAgenciasDisponibles] = useState<Agencia[]>([]);

  const isAdmin = user?.role === 'admin';

  // Cargar selección guardada
  useEffect(() => {
    const loadFilter = async () => {
      const { value } = await Preferences.get({ key: FILTER_STORAGE_KEY });
      if (value && value !== 'todas') {
        setAgenciaFilterId(value);
      }
    };
    if (isAdmin) {
      loadFilter();
    }
  }, [isAdmin]);

  // Cargar agencias disponibles para admin
  useEffect(() => {
    const load = async () => {
      if (isAdmin && user) {
        try {
          const data = await AgenciasService.getAgencias();
          setAgenciasDisponibles(data);
        } catch {
          // API no disponible, el filtro no se muestra
        }
      }
    };
    load();
  }, [isAdmin, user]);

  const setFilterAgencia = useCallback((id: string) => {
    setAgenciaFilterId(id);
    Preferences.set({ key: FILTER_STORAGE_KEY, value: id });
  }, []);

  const agenciaSeleccionada = agenciasDisponibles.find(a => a.id === agenciaFilterId) || null;

  const isFilterActive = !!isAdmin;

  const getFilteredAgenciaId = useCallback((): number | undefined => {
    if (!isAdmin) {
      // Non-admin siempre usa su propia agencia
      return user?.agencia_id;
    }
    // Admin: si seleccionó "todas", no filtra
    if (agenciaFilterId === 'todas') return undefined;
    return parseInt(agenciaFilterId, 10) || undefined;
  }, [isAdmin, agenciaFilterId, user]);

  return (
    <AgenciaFilterContext.Provider
      value={{
        agenciaSeleccionada,
        agenciaFilterId,
        agenciasDisponibles,
        setFilterAgencia,
        isFilterActive,
        getFilteredAgenciaId,
      }}
    >
      {children}
    </AgenciaFilterContext.Provider>
  );
};

export const useAgenciaFilter = () => {
  const context = useContext(AgenciaFilterContext);
  if (!context) {
    throw new Error('useAgenciaFilter must be used within AgenciaFilterProvider');
  }
  return context;
};
