/**
 * Componente de Login - VERSÃO CORRIGIDA
 * Caminho: frontend/src/components/Login.jsx
 */

import { useState } from 'react';
import authService from '../services/authService';

const Login = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({
        cdUsuario: '',
        password: '',
        cdMultiEmpresa: 1
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Limpar erro ao digitar
        if (error) {
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validação básica
        if (!formData.cdUsuario.trim()) {
            setError('Código do usuário é obrigatório');
            return;
        }
        
        if (!formData.password.trim()) {
            setError('Senha é obrigatória');
            return;
        }

        if (!formData.cdMultiEmpresa) {
            setError('Código da empresa é obrigatório');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('🔐 Tentando login com dados:', {
                cdUsuario: formData.cdUsuario,
                cdMultiEmpresa: formData.cdMultiEmpresa
            });

            const result = await authService.login(
                formData.cdUsuario,
                formData.password,
                formData.cdMultiEmpresa
            );

            if (result.success) {
                console.log('✅ Login bem-sucedido!');
                
                // Callback de sucesso
                if (onLoginSuccess) {
                    onLoginSuccess(result.data.user);
                }
                
                // Opcional: redirecionamento pode ser feito pelo componente pai
                // window.location.href = '/dashboard';
                
            } else {
                console.warn('❌ Login falhou:', result.message);
                setError(result.message || 'Credenciais inválidas');
            }

        } catch (error) {
            console.error('❌ Erro inesperado no login:', error);
            setError('Erro inesperado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>🏢 Intranet - Login</h2>
                    <p>Entre com suas credenciais</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {/* Campo Usuário */}
                    <div className="form-group">
                        <label htmlFor="cdUsuario">
                            👤 Código do Usuário
                        </label>
                        <input
                            type="text"
                            id="cdUsuario"
                            name="cdUsuario"
                            value={formData.cdUsuario}
                            onChange={handleChange}
                            placeholder="Ex: f011349"
                            disabled={loading}
                            className={error && !formData.cdUsuario.trim() ? 'error' : ''}
                        />
                    </div>

                    {/* Campo Senha */}
                    <div className="form-group">
                        <label htmlFor="password">
                            🔒 Senha
                        </label>
                        <div className="password-input">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Digite sua senha"
                                disabled={loading}
                                className={error && !formData.password.trim() ? 'error' : ''}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={loading}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {/* Campo Empresa */}
                    <div className="form-group">
                        <label htmlFor="cdMultiEmpresa">
                            🏭 Código da Empresa
                        </label>
                        <select
                            id="cdMultiEmpresa"
                            name="cdMultiEmpresa"
                            value={formData.cdMultiEmpresa}
                            onChange={handleChange}
                            disabled={loading}
                        >
                            <option value={1}>1 - Empresa Principal</option>
                            <option value={2}>2 - Empresa Secundária</option>
                            {/* Adicionar mais empresas conforme necessário */}
                        </select>
                    </div>

                    {/* Mensagem de erro */}
                    {error && (
                        <div className="error-message">
                            ❌ {error}
                        </div>
                    )}

                    {/* Botão de Login */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`login-button ${loading ? 'loading' : ''}`}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Entrando...
                            </>
                        ) : (
                            <>
                                🚀 Entrar
                            </>
                        )}
                    </button>
                </form>

                {/* Informações adicionais */}
                <div className="login-footer">
                    <p>
                        <small>
                            💡 Em caso de problemas, contate o suporte técnico
                        </small>
                    </p>
                </div>
            </div>

            {/* CSS Styles */}
            <style jsx>{`
                .login-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                }

                .login-card {
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    width: 100%;
                    max-width: 400px;
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .login-header h2 {
                    color: #333;
                    margin-bottom: 0.5rem;
                }

                .login-header p {
                    color: #666;
                    margin: 0;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #333;
                }

                .form-group input,
                .form-group select {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.3s ease;
                }

                .form-group input:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .form-group input.error,
                .form-group select.error {
                    border-color: #e74c3c;
                    background-color: #fef5f5;
                }

                .password-input {
                    position: relative;
                }

                .toggle-password {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                }

                .toggle-password:hover {
                    opacity: 1;
                }

                .error-message {
                    background: #fef5f5;
                    color: #e74c3c;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    border-left: 4px solid #e74c3c;
                }

                .login-button {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .login-button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }

                .login-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    transform: none;
                }

                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid transparent;
                    border-top: 2px solid currentColor;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .login-footer {
                    text-align: center;
                    margin-top: 2rem;
                    color: #666;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 480px) {
                    .login-card {
                        padding: 1.5rem;
                        margin: 10px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Login;