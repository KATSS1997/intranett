/**
 * Router Principal da Aplicação
 * Caminho: frontend/src/router/AppRouter.jsx
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthLoading, useIsAuthenticated } from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';

// Componentes de Layout
import PublicLayout from '../components/layouts/PublicLayout';
import PrivateLayout from '../components/layouts/PrivateLayout';

// Guards de Rota
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import AuthGuard from '../guards/AuthGuard';
import RoleGuard from '../guards/RoleGuard';

// Páginas Públicas
import LoginPage from '../pages/Login';
import NotFoundPage from '../pages/NotFound';

// Páginas Privadas
import DashboardPage from '../pages/Dashboard';
import ProfilePage from '../pages/Profile';
import UsersPage from '../pages/Users';
import AdminPage from '../pages/Admin';

// Loading Component
import LoadingScreen from '../components/common/LoadingScreen';

const AppRouter = () => {
  const { isInitializing, isReady } = useAuthLoading();
  const isAuthenticated = useIsAuthenticated();

  // Mostra loading enquanto inicializa autenticação
  if (isInitializing || !isReady) {
    return <LoadingScreen message="Inicializando aplicação..." />;
  }

  return (
    <Routes>
      {/* ================================ */}
      {/* ROTAS PÚBLICAS */}
      {/* ================================ */}
      
      {/* Login - apenas para usuários não autenticados */}
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          </PublicRoute>
        }
      />

      {/* ================================ */}
      {/* ROTAS PRIVADAS */}
      {/* ================================ */}
      
      {/* Dashboard - rota padrão para usuários autenticados */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <PrivateRoute>
            <PrivateLayout>
              <DashboardPage />
            </PrivateLayout>
          </PrivateRoute>
        }
      />

      {/* Perfil do usuário */}
      <Route
        path={ROUTES.PROFILE}
        element={
          <PrivateRoute>
            <PrivateLayout>
              <ProfilePage />
            </PrivateLayout>
          </PrivateRoute>
        }
      />

      {/* Gestão de usuários - apenas managers+ */}
      <Route
        path={ROUTES.USERS}
        element={
          <PrivateRoute>
            <AuthGuard requiredRoles={['admin', 'administrador', 'manager', 'gerente']}>
              <PrivateLayout>
                <UsersPage />
              </PrivateLayout>
            </AuthGuard>
          </PrivateRoute>
        }
      />

      {/* Área administrativa - apenas admins */}
      <Route
        path={ROUTES.ADMIN}
        element={
          <PrivateRoute>
            <RoleGuard requiredRoles={['admin', 'administrador']}>
              <PrivateLayout>
                <AdminPage />
              </PrivateLayout>
            </RoleGuard>
          </PrivateRoute>
        }
      />

      {/* Rotas específicas por empresa */}
      <Route
        path="/company/:companyId/*"
        element={
          <PrivateRoute>
            <AuthGuard allowedCompanies={[1, 2, 3]}>
              <PrivateLayout>
                <CompanyRoutes />
              </PrivateLayout>
            </AuthGuard>
          </PrivateRoute>
        }
      />

      {/* ================================ */}
      {/* REDIRECTS E FALLBACKS */}
      {/* ================================ */}
      
      {/* Redirect da home baseado na autenticação */}
      <Route
        path={ROUTES.HOME}
        element={
          isAuthenticated ? 
            <Navigate to={ROUTES.DASHBOARD} replace /> : 
            <Navigate to={ROUTES.LOGIN} replace />
        }
      />

      {/* 404 - Página não encontrada */}
      <Route
        path={ROUTES.NOT_FOUND}
        element={
          <PublicLayout>
            <NotFoundPage />
          </PublicLayout>
        }
      />

      {/* Catch all - redireciona para 404 */}
      <Route
        path="*"
        element={<Navigate to={ROUTES.NOT_FOUND} replace />}
      />
    </Routes>
  );
};

// Componente para rotas específicas da empresa
const CompanyRoutes = () => {
  return (
    <Routes>
      <Route path="dashboard" element={<div>Dashboard da Empresa</div>} />
      <Route path="reports" element={<div>Relatórios da Empresa</div>} />
      <Route path="settings" element={
        <RoleGuard requiredRoles={['admin']}>
          <div>Configurações da Empresa (Admin)</div>
        </RoleGuard>
      } />
      <Route path="*" element={<Navigate to="../dashboard" replace />} />
    </Routes>
  );
};

export default AppRouter;