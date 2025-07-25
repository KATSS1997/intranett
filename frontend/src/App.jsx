/**
 * Componente principal da aplicação
 * Caminho: frontend/src/App.jsx
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import AppRouter from './router/AppRouter';
import GlobalComponents from './components/common/GlobalComponents';
import './styles/globals.css';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <div className="app">
            {/* Router principal */}
            <AppRouter />
            
            {/* Componentes globais (notificações, loading, etc.) */}
            <GlobalComponents />
          </div>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;