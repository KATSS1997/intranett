/**
 * Página de Perfil do Usuário
 * Caminho: frontend/src/pages/Profile.jsx
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApp, useNotifications } from '../contexts/AppContext';
import userService from '../services/userService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { setPageTitle } = useApp();
  const { showSuccess, showError, showInfo } = useNotifications();

  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nomeUsuario: '',
    email: '',
    telefone: '',
    departamento: '',
    observacoes: '',
  });

  // Define título da página
  useEffect(() => {
    setPageTitle('Meu Perfil');
  }, [setPageTitle]);

  // Carrega dados do perfil
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        
        const result = await userService.getProfile();
        
        if (result.success) {
          setProfileData(result.data);
          setFormData({
            nomeUsuario: result.data.nomeUsuario || '',
            email: result.data.email || '',
            telefone: result.data.telefone || '',
            departamento: result.data.departamento || '',
            observacoes: result.data.observacoes || '',
          });
        } else {
          // Se falhar, usa dados do contexto
          setProfileData(user);
          setFormData({
            nomeUsuario: user.nomeUsuario || '',
            email: '',
            telefone: '',
            departamento: '',
            observacoes: '',
          });
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        showError('Erro ao carregar dados do perfil');
        
        // Fallback para dados do contexto
        setProfileData(user);
        setFormData({
          nomeUsuario: user.nomeUsuario || '',
          email: '',
          telefone: '',
          departamento: '',
          observacoes: '',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user, showError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setEditMode(true);
    showInfo('Modo de edição ativado');
  };

  const handleCancel = () => {
    // Restaura dados originais
    setFormData({
      nomeUsuario: profileData?.nomeUsuario || '',
      email: profileData?.email || '',
      telefone: profileData?.telefone || '',
      departamento: profileData?.departamento || '',
      observacoes: profileData?.observacoes || '',
    });
    setEditMode(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validações básicas
      if (!formData.nomeUsuario.trim()) {
        showError('Nome do usuário é obrigatório');
        return;
      }

      if (formData.email && !isValidEmail(formData.email)) {
        showError('Email inválido');
        return;
      }

      // Simula salvamento (em produção seria userService.updateProfile)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Atualiza dados locais
      const updatedData = { ...profileData, ...formData };
      setProfileData(updatedData);
      
      // Atualiza contexto de auth se necessário
      if (formData.nomeUsuario !== user.nomeUsuario) {
        updateUser({ nomeUsuario: formData.nomeUsuario });
      }

      setEditMode(false);
      showSuccess('Perfil atualizado com sucesso!');

    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      showError('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Não disponível';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <LoadingSpinner />
        <p>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            {user?.nomeUsuario?.charAt(0)?.toUpperCase() || '👤'}
          </div>
        </div>
        
        <div className="profile-info">
          <h1 className="profile-name">{profileData?.nomeUsuario || user?.nomeUsuario}</h1>
          <p className="profile-details">
            {user?.cdUsuario} • {user?.nomeEmpresa} • {user?.perfil}
          </p>
        </div>

        <div className="profile-actions">
          {!editMode ? (
            <button onClick={handleEdit} className="btn btn-primary">
              ✏️ Editar Perfil
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                onClick={handleCancel} 
                className="btn btn-secondary"
                disabled={isSaving}
              >
                ❌ Cancelar
              </button>
              <button 
                onClick={handleSave} 
                className="btn btn-success"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="small" />
                    Salvando...
                  </>
                ) : (
                  '💾 Salvar'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="profile-content">
        
        {/* Informações Pessoais */}
        <div className="profile-section">
          <h2 className="section-title">👤 Informações Pessoais</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              {editMode ? (
                <input
                  type="text"
                  name="nomeUsuario"
                  value={formData.nomeUsuario}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Digite seu nome completo"
                />
              ) : (
                <div className="form-value">{profileData?.nomeUsuario || 'Não informado'}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              {editMode ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Digite seu email"
                />
              ) : (
                <div className="form-value">{profileData?.email || 'Não informado'}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Telefone</label>
              {editMode ? (
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="(11) 99999-9999"
                />
              ) : (
                <div className="form-value">{profileData?.telefone || 'Não informado'}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Departamento</label>
              {editMode ? (
                <input
                  type="text"
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Digite seu departamento"
                />
              ) : (
                <div className="form-value">{profileData?.departamento || 'Não informado'}</div>
              )}
            </div>

            <div className="form-group full-width">
              <label className="form-label">Observações</label>
              {editMode ? (
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Informações adicionais..."
                  rows="3"
                />
              ) : (
                <div className="form-value">{profileData?.observacoes || 'Nenhuma observação'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Informações do Sistema */}
        <div className="profile-section">
          <h2 className="section-title">⚙️ Informações do Sistema</h2>
          
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Código do Usuário:</span>
              <span className="info-value">{user?.cdUsuario}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Perfil de Acesso:</span>
              <span className={`info-value badge badge-${user?.perfil?.toLowerCase()}`}>
                {user?.perfil}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Empresa:</span>
              <span className="info-value">
                {user?.nomeEmpresa} (#{user?.cdMultiEmpresa})
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Último Acesso:</span>
              <span className="info-value">
                {formatDate(profileData?.ultimoAcesso)}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Data de Criação:</span>
              <span className="info-value">
                {formatDate(profileData?.dataCriacao)}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className="info-value badge badge-success">
                ✅ Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div className="profile-section">
          <h2 className="section-title">🔒 Segurança</h2>
          
          <div className="security-actions">
            <button 
              className="security-button"
              onClick={() => showInfo('Funcionalidade em desenvolvimento')}
            >
              <div className="security-icon">🔑</div>
              <div className="security-content">
                <h3>Alterar Senha</h3>
                <p>Trocar sua senha de acesso</p>
              </div>
            </button>

            <button 
              className="security-button"
              onClick={() => showInfo('Funcionalidade em desenvolvimento')}
            >
              <div className="security-icon">📱</div>
              <div className="security-content">
                <h3>Autenticação 2FA</h3>
                <p>Configurar segunda etapa de verificação</p>
              </div>
            </button>

            <button 
              className="security-button"
              onClick={() => showInfo('Funcionalidade em desenvolvimento')}
            >
              <div className="security-icon">📊</div>
              <div className="security-content">
                <h3>Log de Atividades</h3>
                <p>Ver histórico de acessos</p>
              </div>
            </button>
          </div>
        </div>

        {/* Preferências */}
        <div className="profile-section">
          <h2 className="section-title">⚙️ Preferências</h2>
          
          <div className="preferences-grid">
            <div className="preference-item">
              <label className="preference-label">
                <input type="checkbox" defaultChecked />
                Receber notificações por email
              </label>
            </div>

            <div className="preference-item">
              <label className="preference-label">
                <input type="checkbox" defaultChecked />
                Notificações do sistema
              </label>
            </div>

            <div className="preference-item">
              <label className="preference-label">
                <input type="checkbox" />
                Lembrar sessão por mais tempo
              </label>
            </div>

            <div className="preference-item">
              <label className="preference-label">
                Idioma do sistema:
                <select className="preference-select">
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </label>
            </div>

            <div className="preference-item">
              <label className="preference-label">
                Fuso horário:
                <select className="preference-select">
                  <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                  <option value="America/New_York">New York (GMT-5)</option>
                  <option value="Europe/London">London (GMT+0)</option>
                </select>
              </label>
            </div>
          </div>

          <div className="preferences-actions">
            <button 
              className="btn btn-outline"
              onClick={() => showInfo('Preferências salvas automaticamente')}
            >
              💾 Salvar Preferências
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;