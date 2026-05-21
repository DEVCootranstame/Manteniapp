import React from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth.types';
import { IonLoading } from '@ionic/react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  redirectTo?: string;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children, redirectTo = '/home' }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <IonLoading isOpen={true} message="Cargando..." />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Redirect to={redirectTo} />;
  }

  return <>{children}</>;
};

export default RoleGuard;
