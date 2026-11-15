/**
 * Página de Cardápio
 * Caminho: frontend/src/pages/Cardapio.jsx
 */

import React, { useState, useEffect } from 'react';

const Cardapio = () => {
  const [cardapio, setCardapio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    diaSemana: 'Segunda-feira',
    categoria: 'Almoço',
    prato: '',
    descricao: ''
  });

  const diasSemana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
  const categorias = ['Café da Manhã', 'Almoço', 'Café da Tarde', 'Jantar'];

  useEffect(() => {
    loadCardapio();
    checkAdmin();
  }, []);

  const checkAdmin = () => {
    const user = JSON.parse(localStorage.getItem('userData') || '{}');
    setIsAdmin(user.perfil === 'admin' || user.perfil === 'administrador');
  };

  const loadCardapio = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/cardapio', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCardapio(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar cardápio:', error);
      // Mock data para demonstração
      setCardapio([
        { id: 1, diaSemana: 'Segunda-feira', categoria: 'Almoço', prato: 'Arroz, Feijão, Frango', descricao: 'Frango grelhado com arroz integral' },
        { id: 2, diaSemana: 'Segunda-feira', categoria: 'Café da Manhã', prato: 'Pão, Café, Frutas', descricao: 'Pão francês, café com leite e salada de frutas' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingItem 
        ? `http://localhost:5000/api/cardapio/${editingItem.id}`
        : 'http://localhost:5000/api/cardapio';
      
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert(editingItem ? 'Cardápio atualizado!' : 'Cardápio cadastrado!');
        setShowModal(false);
        setEditingItem(null);
        setFormData({ diaSemana: 'Segunda-feira', categoria: 'Almoço', prato: '', descricao: '' });
        loadCardapio();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar cardápio');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      diaSemana: item.diaSemana,
      categoria: item.categoria,
      prato: item.prato,
      descricao: item.descricao
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja excluir este item?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/cardapio/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert('Item excluído!');
        loadCardapio();
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🍽️ Cardápio da Semana</h1>
        {isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            style={styles.addButton}
          >
            ➕ Adicionar Item
          </button>
        )}
      </div>

      {loading ? (
        <div style={styles.loading}>Carregando...</div>
      ) : (
        <div style={styles.weekGrid}>
          {diasSemana.map(dia => (
            <div key={dia} style={styles.dayCard}>
              <h2 style={styles.dayTitle}>{dia}</h2>
              
              {categorias.map(categoria => {
                const items = cardapio.filter(
                  item => item.diaSemana === dia && item.categoria === categoria
                );
                
                return (
                  <div key={categoria} style={styles.categorySection}>
                    <h3 style={styles.categoryTitle}>{categoria}</h3>
                    {items.length > 0 ? (
                      items.map(item => (
                        <div key={item.id} style={styles.menuItem}>
                          <div style={styles.menuContent}>
                            <strong>{item.prato}</strong>
                            <p style={styles.description}>{item.descricao}</p>
                          </div>
                          {isAdmin && (
                            <div style={styles.actions}>
                              <button onClick={() => handleEdit(item)} style={styles.editBtn}>✏️</button>
                              <button onClick={() => handleDelete(item.id)} style={styles.deleteBtn}>🗑️</button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p style={styles.empty}>Sem cardápio</p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? 'Editar Item' : 'Novo Item do Cardápio'}</h2>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label>Dia da Semana:</label>
                <select 
                  value={formData.diaSemana}
                  onChange={(e) => setFormData({...formData, diaSemana: e.target.value})}
                  style={styles.input}
                  required
                >
                  {diasSemana.map(dia => (
                    <option key={dia} value={dia}>{dia}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label>Categoria:</label>
                <select 
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  style={styles.input}
                  required
                >
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label>Prato:</label>
                <input
                  type="text"
                  value={formData.prato}
                  onChange={(e) => setFormData({...formData, prato: e.target.value})}
                  style={styles.input}
                  placeholder="Ex: Arroz, Feijão, Frango"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Descrição:</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  style={{...styles.input, minHeight: '80px'}}
                  placeholder="Detalhes do prato..."
                />
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveBtn}>
                  {editingItem ? 'Atualizar' : 'Salvar'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    setFormData({ diaSemana: 'Segunda-feira', categoria: 'Almoço', prato: '', descricao: '' });
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
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px'
  },
  weekGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px'
  },
  dayCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  dayTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#2c3e50',
    borderBottom: '3px solid #3498db',
    paddingBottom: '10px'
  },
  categorySection: {
    marginBottom: '20px'
  },
  categoryTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: '10px'
  },
  menuItem: {
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  menuContent: {
    flex: 1
  },
  description: {
    fontSize: '14px',
    color: '#7f8c8d',
    margin: '5px 0 0 0'
  },
  empty: {
    fontSize: '14px',
    color: '#95a5a6',
    fontStyle: 'italic'
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  editBtn: {
    padding: '6px 10px',
    backgroundColor: '#f39c12',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  deleteBtn: {
    padding: '6px 10px',
    backgroundColor: '#e74c3c',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
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
    marginBottom: '20px'
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
    backgroundColor: '#27ae60',
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

export default Cardapio;