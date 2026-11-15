/**
 * Página de Vagas Internas
 * Caminho: frontend/src/pages/VagasInternas.jsx
 */

import React, { useState, useEffect } from 'react';

const VagasInternas = () => {
  const [vagas, setVagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVaga, setEditingVaga] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Todas');
  const [formData, setFormData] = useState({
    titulo: '',
    setor: '',
    descricao: '',
    requisitos: '',
    beneficios: '',
    status: 'Aberta',
    dataPublicacao: new Date().toISOString().split('T')[0]
  });

  const statusOptions = ['Aberta', 'Fechada', 'Preenchida'];
  const statusColors = {
    'Aberta': '#27ae60',
    'Fechada': '#95a5a6',
    'Preenchida': '#e74c3c'
  };

  useEffect(() => {
    loadVagas();
    checkAdmin();
  }, []);

  const checkAdmin = () => {
    const user = JSON.parse(localStorage.getItem('userData') || '{}');
    setIsAdmin(user.perfil === 'admin' || user.perfil === 'administrador');
  };

  const loadVagas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/vagas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVagas(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
      // Mock data
      setVagas([
        {
          id: 1,
          titulo: 'Analista de Sistemas Sênior',
          setor: 'TI',
          descricao: 'Buscamos profissional experiente em desenvolvimento web com foco em React e Node.js',
          requisitos: '• 5+ anos de experiência\n• React.js avançado\n• Node.js\n• Banco de dados SQL\n• Inglês intermediário',
          beneficios: '• Vale refeição\n• Plano de saúde\n• Home office 2x/semana\n• Bônus anual',
          status: 'Aberta',
          dataPublicacao: '2025-10-25'
        },
        {
          id: 2,
          titulo: 'Coordenador de Marketing',
          setor: 'Marketing',
          descricao: 'Oportunidade para liderar nossa equipe de marketing digital',
          requisitos: '• 3+ anos em marketing digital\n• Experiência com gestão de equipe\n• Google Ads e Meta Ads\n• Excel avançado',
          beneficios: '• Vale alimentação\n• Plano de saúde e odontológico\n• Participação nos lucros\n• Gympass',
          status: 'Aberta',
          dataPublicacao: '2025-10-28'
        },
        {
          id: 3,
          titulo: 'Assistente Financeiro',
          setor: 'Financeiro',
          descricao: 'Vaga para auxiliar nas rotinas do departamento financeiro',
          requisitos: '• Ensino superior cursando ou completo\n• Conhecimento em Excel\n• Experiência com contas a pagar/receber',
          beneficios: '• Vale transporte\n• Vale refeição\n• Plano de saúde',
          status: 'Preenchida',
          dataPublicacao: '2025-10-15'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingVaga 
        ? `http://localhost:5000/api/vagas/${editingVaga.id}`
        : 'http://localhost:5000/api/vagas';
      
      const response = await fetch(url, {
        method: editingVaga ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert(editingVaga ? 'Vaga atualizada!' : 'Vaga publicada!');
        setShowModal(false);
        setEditingVaga(null);
        setFormData({ 
          titulo: '', 
          setor: '', 
          descricao: '', 
          requisitos: '', 
          beneficios: '', 
          status: 'Aberta',
          dataPublicacao: new Date().toISOString().split('T')[0]
        });
        loadVagas();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar vaga');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja excluir esta vaga?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/vagas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Vaga excluída!');
        loadVagas();
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const handleEdit = (vaga) => {
    setEditingVaga(vaga);
    setFormData({
      titulo: vaga.titulo,
      setor: vaga.setor,
      descricao: vaga.descricao,
      requisitos: vaga.requisitos,
      beneficios: vaga.beneficios,
      status: vaga.status,
      dataPublicacao: vaga.dataPublicacao
    });
    setShowModal(true);
  };

  const filteredVagas = selectedStatus === 'Todas' 
    ? vagas 
    : vagas.filter(v => v.status === selectedStatus);

  // Ordenar por data (mais recentes primeiro)
  const sortedVagas = [...filteredVagas].sort((a, b) => 
    new Date(b.dataPublicacao) - new Date(a.dataPublicacao)
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1>💼 Vagas Internas</h1>
          <p style={styles.subtitle}>Oportunidades de crescimento na empresa</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} style={styles.addButton}>
            ➕ Nova Vaga
          </button>
        )}
      </div>

      {/* Filtro de Status */}
      <div style={styles.filterBar}>
        <button
          onClick={() => setSelectedStatus('Todas')}
          style={{
            ...styles.filterButton,
            ...(selectedStatus === 'Todas' ? styles.filterButtonActive : {})
          }}
        >
          Todas ({vagas.length})
        </button>
        {statusOptions.map(status => {
          const count = vagas.filter(v => v.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              style={{
                ...styles.filterButton,
                ...(selectedStatus === status ? styles.filterButtonActive : {}),
                borderLeft: `4px solid ${statusColors[status]}`
              }}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {/* Lista de Vagas */}
      {loading ? (
        <div style={styles.loading}>Carregando...</div>
      ) : sortedVagas.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📭</div>
          <p>Nenhuma vaga disponível no momento</p>
        </div>
      ) : (
        <div style={styles.vagasList}>
          {sortedVagas.map(vaga => (
            <div key={vaga.id} style={styles.vagaCard}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>
                  <h2 style={styles.titulo}>{vaga.titulo}</h2>
                  <div style={styles.meta}>
                    <span style={styles.setor}>🏢 {vaga.setor}</span>
                    <span style={styles.data}>
                      📅 {new Date(vaga.dataPublicacao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div style={styles.cardActions}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: statusColors[vaga.status]
                  }}>
                    {vaga.status}
                  </span>
                  {isAdmin && (
                    <div style={styles.adminActions}>
                      <button onClick={() => handleEdit(vaga)} style={styles.editBtn}>✏️</button>
                      <button onClick={() => handleDelete(vaga.id)} style={styles.deleteBtn}>🗑️</button>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.cardBody}>
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>📋 Descrição</h3>
                  <p style={styles.text}>{vaga.descricao}</p>
                </div>

                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>✅ Requisitos</h3>
                  <pre style={styles.list}>{vaga.requisitos}</pre>
                </div>

                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>🎁 Benefícios</h3>
                  <pre style={styles.list}>{vaga.beneficios}</pre>
                </div>
              </div>

              {vaga.status === 'Aberta' && (
                <div style={styles.cardFooter}>
                  <p style={styles.interestText}>
                    Interessado? Entre em contato com o RH para mais informações!
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{editingVaga ? 'Editar Vaga' : 'Nova Vaga'}</h2>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label>Título da Vaga:</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  style={styles.input}
                  placeholder="Ex: Analista de Sistemas Pleno"
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Setor:</label>
                  <input
                    type="text"
                    value={formData.setor}
                    onChange={(e) => setFormData({...formData, setor: e.target.value})}
                    style={styles.input}
                    placeholder="Ex: TI"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label>Status:</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={styles.input}
                    required
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label>Data de Publicação:</label>
                <input
                  type="date"
                  value={formData.dataPublicacao}
                  onChange={(e) => setFormData({...formData, dataPublicacao: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Descrição:</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  style={{...styles.input, minHeight: '80px'}}
                  placeholder="Breve descrição da vaga..."
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Requisitos (use • para cada item):</label>
                <textarea
                  value={formData.requisitos}
                  onChange={(e) => setFormData({...formData, requisitos: e.target.value})}
                  style={{...styles.input, minHeight: '120px'}}
                  placeholder="• Requisito 1&#10;• Requisito 2&#10;• Requisito 3"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Benefícios (use • para cada item):</label>
                <textarea
                  value={formData.beneficios}
                  onChange={(e) => setFormData({...formData, beneficios: e.target.value})}
                  style={{...styles.input, minHeight: '100px'}}
                  placeholder="• Benefício 1&#10;• Benefício 2&#10;• Benefício 3"
                  required
                />
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveBtn}>
                  {editingVaga ? 'Atualizar' : 'Publicar'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowModal(false);
                    setEditingVaga(null);
                    setFormData({ 
                      titulo: '', 
                      setor: '', 
                      descricao: '', 
                      requisitos: '', 
                      beneficios: '', 
                      status: 'Aberta',
                      dataPublicacao: new Date().toISOString().split('T')[0]
                    });
                  }}
                  style={styles.cancelBtn}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#7f8c8d',
    marginTop: '5px'
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#2980b9',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  filterBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '25px',
    overflowX: 'auto',
    padding: '10px 0'
  },
  filterButton: {
    padding: '10px 20px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    transition: 'all 0.3s'
  },
  filterButtonActive: {
    backgroundColor: '#ecf0f1',
    fontWeight: 'bold'
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: '#7f8c8d'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#95a5a6'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  vagasList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px'
  },
  vagaCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'all 0.3s'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #ecf0f1'
  },
  cardTitle: {
    flex: 1
  },
  titulo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '0 0 10px 0'
  },
  meta: {
    display: 'flex',
    gap: '20px',
    fontSize: '14px',
    color: '#7f8c8d'
  },
  setor: {
    fontWeight: '500'
  },
  data: {},
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '13px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },
  adminActions: {
    display: 'flex',
    gap: '8px'
  },
  editBtn: {
    padding: '6px 12px',
    backgroundColor: '#f39c12',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  deleteBtn: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  section: {
    paddingLeft: '15px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: '10px'
  },
  text: {
    fontSize: '15px',
    color: '#555',
    lineHeight: '1.6',
    margin: 0
  },
  list: {
    fontSize: '14px',
    color: '#555',
    lineHeight: '1.8',
    margin: 0,
    fontFamily: 'inherit',
    whiteSpace: 'pre-wrap'
  },
  cardFooter: {
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '1px solid #ecf0f1',
    backgroundColor: '#e8f8f5',
    padding: '15px',
    borderRadius: '6px'
  },
  interestText: {
    margin: 0,
    fontSize: '14px',
    color: '#16a085',
    fontWeight: '500'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '650px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  form: {
    marginTop: '20px'
  },
  formGroup: {
    marginBottom: '20px',
    flex: 1
  },
  formRow: {
    display: 'flex',
    gap: '15px'
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    marginTop: '5px',
    fontFamily: 'inherit'
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '25px'
  },
  saveBtn: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#2980b9',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px'
  }
};

export default VagasInternas;