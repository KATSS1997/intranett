/**
 * Página de Ramais
 * Caminho: frontend/src/pages/Ramais.jsx
 */

import React, { useState, useEffect } from 'react';

const Ramais = () => {
  const [ramais, setRamais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRamal, setEditingRamal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSetor, setSelectedSetor] = useState('Todos');
  const [formData, setFormData] = useState({
    nome: '',
    ramal: '',
    setor: 'TI',
    cargo: '',
    email: '',
    celular: ''
  });

  const setores = ['TI', 'RH', 'Financeiro', 'Comercial', 'Marketing', 'Operações', 'Diretoria'];

  useEffect(() => {
    loadRamais();
    checkAdmin();
  }, []);

  const checkAdmin = () => {
    const user = JSON.parse(localStorage.getItem('userData') || '{}');
    setIsAdmin(user.perfil === 'admin' || user.perfil === 'administrador');
  };

  const loadRamais = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/ramais', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRamais(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar ramais:', error);
      // Mock data
      setRamais([
        { id: 1, nome: 'João Silva', ramal: '2001', setor: 'TI', cargo: 'Analista de Sistemas', email: 'joao.silva@empresa.com', celular: '(11) 98765-4321' },
        { id: 2, nome: 'Maria Santos', ramal: '2002', setor: 'RH', cargo: 'Gerente de RH', email: 'maria.santos@empresa.com', celular: '(11) 98765-4322' },
        { id: 3, nome: 'Pedro Costa', ramal: '2003', setor: 'Financeiro', cargo: 'Contador', email: 'pedro.costa@empresa.com', celular: '(11) 98765-4323' },
        { id: 4, nome: 'Ana Paula', ramal: '2004', setor: 'Comercial', cargo: 'Vendedora', email: 'ana.paula@empresa.com', celular: '(11) 98765-4324' },
        { id: 5, nome: 'Carlos Eduardo', ramal: '2005', setor: 'Marketing', cargo: 'Designer', email: 'carlos.eduardo@empresa.com', celular: '(11) 98765-4325' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingRamal 
        ? `http://localhost:5000/api/ramais/${editingRamal.id}`
        : 'http://localhost:5000/api/ramais';
      
      const response = await fetch(url, {
        method: editingRamal ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert(editingRamal ? 'Ramal atualizado!' : 'Ramal cadastrado!');
        setShowModal(false);
        setEditingRamal(null);
        setFormData({ nome: '', ramal: '', setor: 'TI', cargo: '', email: '', celular: '' });
        loadRamais();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar ramal');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja excluir este ramal?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/ramais/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Ramal excluído!');
        loadRamais();
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const handleEdit = (ramal) => {
    setEditingRamal(ramal);
    setFormData({
      nome: ramal.nome,
      ramal: ramal.ramal,
      setor: ramal.setor,
      cargo: ramal.cargo,
      email: ramal.email,
      celular: ramal.celular
    });
    setShowModal(true);
  };

  // Filtrar e buscar
  const filteredRamais = ramais
    .filter(r => selectedSetor === 'Todos' || r.setor === selectedSetor)
    .filter(r => 
      r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ramal.includes(searchTerm) ||
      r.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cargo.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.nome.localeCompare(b.nome));

  // Agrupar por setor
  const ramaisPorSetor = filteredRamais.reduce((acc, ramal) => {
    if (!acc[ramal.setor]) acc[ramal.setor] = [];
    acc[ramal.setor].push(ramal);
    return acc;
  }, {});

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📞 Lista de Ramais</h1>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} style={styles.addButton}>
            ➕ Adicionar Ramal
          </button>
        )}
      </div>

      {/* Barra de Busca e Filtros */}
      <div style={styles.searchBar}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="🔍 Buscar por nome, ramal, setor ou cargo..."
          style={styles.searchInput}
        />

        <select
          value={selectedSetor}
          onChange={(e) => setSelectedSetor(e.target.value)}
          style={styles.select}
        >
          <option value="Todos">Todos os Setores</option>
          {setores.map(setor => (
            <option key={setor} value={setor}>{setor}</option>
          ))}
        </select>
      </div>

      {/* Total de Ramais */}
      <div style={styles.stats}>
        <span>Total: {filteredRamais.length} ramais</span>
        {selectedSetor !== 'Todos' && (
          <span style={styles.filterTag}>
            Filtrado por: {selectedSetor}
            <button 
              onClick={() => setSelectedSetor('Todos')}
              style={styles.clearFilter}
            >
              ✕
            </button>
          </span>
        )}
      </div>

      {/* Lista de Ramais */}
      {loading ? (
        <div style={styles.loading}>Carregando...</div>
      ) : filteredRamais.length === 0 ? (
        <div style={styles.empty}>Nenhum ramal encontrado</div>
      ) : (
        <div style={styles.ramalsList}>
          {Object.keys(ramaisPorSetor).sort().map(setor => (
            <div key={setor} style={styles.setorGroup}>
              <h2 style={styles.setorTitle}>{setor}</h2>
              
              <div style={styles.cardsGrid}>
                {ramaisPorSetor[setor].map(ramal => (
                  <div key={ramal.id} style={styles.ramalCard}>
                    <div style={styles.cardHeader}>
                      <div>
                        <h3 style={styles.cardName}>{ramal.nome}</h3>
                        <p style={styles.cardCargo}>{ramal.cargo}</p>
                      </div>
                      {isAdmin && (
                        <div style={styles.cardActions}>
                          <button onClick={() => handleEdit(ramal)} style={styles.editBtn}>✏️</button>
                          <button onClick={() => handleDelete(ramal.id)} style={styles.deleteBtn}>🗑️</button>
                        </div>
                      )}
                    </div>

                    <div style={styles.cardInfo}>
                      <div style={styles.infoRow}>
                        <span style={styles.icon}>📞</span>
                        <span style={styles.ramalNumber}>{ramal.ramal}</span>
                      </div>

                      {ramal.celular && (
                        <div style={styles.infoRow}>
                          <span style={styles.icon}>📱</span>
                          <a href={`tel:${ramal.celular}`} style={styles.link}>{ramal.celular}</a>
                        </div>
                      )}

                      {ramal.email && (
                        <div style={styles.infoRow}>
                          <span style={styles.icon}>✉️</span>
                          <a href={`mailto:${ramal.email}`} style={styles.link}>{ramal.email}</a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{editingRamal ? 'Editar Ramal' : 'Novo Ramal'}</h2>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label>Nome Completo:</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Ramal:</label>
                  <input
                    type="text"
                    value={formData.ramal}
                    onChange={(e) => setFormData({...formData, ramal: e.target.value})}
                    style={styles.input}
                    placeholder="2001"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label>Setor:</label>
                  <select
                    value={formData.setor}
                    onChange={(e) => setFormData({...formData, setor: e.target.value})}
                    style={styles.input}
                    required
                  >
                    {setores.map(setor => (
                      <option key={setor} value={setor}>{setor}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label>Cargo:</label>
                <input
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                  style={styles.input}
                  placeholder="Ex: Analista de Sistemas"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>E-mail:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={styles.input}
                  placeholder="email@empresa.com"
                />
              </div>

              <div style={styles.formGroup}>
                <label>Celular:</label>
                <input
                  type="text"
                  value={formData.celular}
                  onChange={(e) => setFormData({...formData, celular: e.target.value})}
                  style={styles.input}
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveBtn}>
                  {editingRamal ? 'Atualizar' : 'Salvar'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowModal(false);
                    setEditingRamal(null);
                    setFormData({ nome: '', ramal: '', setor: 'TI', cargo: '', email: '', celular: '' });
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
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#16a085',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  searchBar: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  searchInput: {
    flex: 1,
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '15px'
  },
  select: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '15px',
    minWidth: '200px'
  },
  stats: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#7f8c8d'
  },
  filterTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '5px 12px',
    backgroundColor: '#ecf0f1',
    borderRadius: '20px',
    fontSize: '13px'
  },
  clearFilter: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#95a5a6'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px'
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#95a5a6',
    fontSize: '16px'
  },
  ramalsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
  },
  setorGroup: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  setorTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#2c3e50',
    paddingBottom: '10px',
    borderBottom: '2px solid #16a085'
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '15px'
  },
  ramalCard: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #ecf0f1',
    transition: 'all 0.3s',
    cursor: 'pointer'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  cardName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '0 0 5px 0'
  },
  cardCargo: {
    fontSize: '13px',
    color: '#7f8c8d',
    margin: 0
  },
  cardActions: {
    display: 'flex',
    gap: '6px'
  },
  editBtn: {
    padding: '4px 8px',
    backgroundColor: '#f39c12',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  deleteBtn: {
    padding: '4px 8px',
    backgroundColor: '#e74c3c',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  cardInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px'
  },
  icon: {
    fontSize: '16px',
    width: '20px'
  },
  ramalNumber: {
    fontWeight: 'bold',
    color: '#16a085',
    fontSize: '16px'
  },
  link: {
    color: '#3498db',
    textDecoration: 'none',
    fontSize: '13px'
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
    borderRadius: '8px',
    padding: '30px',
    maxWidth: '500px',
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
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    marginTop: '5px'
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '25px'
  },
  saveBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#16a085',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px'
  }
};

export default Ramais;