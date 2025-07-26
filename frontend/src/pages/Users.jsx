/**
 * Página de Gestão de Usuários
 * Caminho: frontend/src/pages/Users.jsx
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { usePermissions } from '../hooks/useAuth';

const Users = () => {
  const { setPageTitle, showInfo } = useApp();
  const { isAdmin, isManager } = usePermissions();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setPageTitle('Gestão de Usuários');
  }, [setPageTitle]);

  // Mock data para demonstração
  useEffect(() => {
    setUsers([
      {
        id: 1,
        cdUsuario: 'admin',
        nomeUsuario: 'Administrador',
        perfil: 'admin',
        empresa: 'Empresa Teste LTDA',
        ativo: true,
      },
      {
        id: 2,
        cdUsuario: 'user1',
        nomeUsuario: 'Usuário Comum',
        perfil: 'user',
        empresa: 'Empresa Teste LTDA',
        ativo: true,
      },
    ]);
  }, []);

  const handleAddUser = () => {
    showInfo('Funcionalidade de adicionar usuário em desenvolvimento');
  };

  if (!isManager) {
    return (
      <div className="access-denied">
        <h2>🚫 Acesso Negado</h2>
        <p>Você não tem permissão para acessar a gestão de usuários.</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>👥 Gestão de Usuários</h1>
        <p>Gerencie os usuários do sistema</p>
      </div>

      <div className="page-actions">
        {isAdmin && (
          <button onClick={handleAddUser} className="btn btn-primary">
            ➕ Adicionar Usuário
          </button>
        )}
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Perfil</th>
              <th>Empresa</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.cdUsuario}</td>
                <td>{user.nomeUsuario}</td>
                <td>
                  <span className={`badge badge-${user.perfil}`}>
                    {user.perfil}
                  </span>
                </td>
                <td>{user.empresa}</td>
                <td>
                  <span className={`badge ${user.ativo ? 'badge-success' : 'badge-error'}`}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => showInfo('Editar usuário em desenvolvimento')}
                    className="btn btn-sm btn-secondary"
                  >
                    ✏️ Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;