/**
 * Página de Comunicação - Mural de Avisos
 * Caminho: frontend/src/pages/Comunicacao.jsx
 */

import React, { useState, useEffect } from 'react';

const Comunicacao = () => {
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAviso, setEditingAviso] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [formData, setFormData] = useState({
    titulo: '',
    mensagem: '',
    categoria: 'Informativo',
    anexo: '',
    dataExpiracao: ''
  });

  const categorias = ['Urgente', 'Importante', 'Informativo', 'Evento', 'Lembrete'];

  useEffect(() => {
    loadAvisos();
    checkAdmin();
  }, []);

  const checkAdmin = () => {
    const user = JSON.parse(localStorage.getItem('userData') || '{}');
    setIsAdmin(user.perfil === 'admin' || user.perfil === 'administrador');
  };

  const loadAvisos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/comunicacao', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvisos(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar avisos:', error);
      // Mock data
      setAvisos([
        { 
          id: 1, 
          titulo: 'Manutenção Programada',
          mensagem: 'Haverá manutenção no sistema dia 10/11 das 18h às 22h',
          categoria: 'Urgente',
          autor: 'TI',
          data: '2025-10-30',
          comentarios: []
        },
        { 
          id: 2, 
          titulo: 'Confraternização de Fim de Ano',
          mensagem: 'Save the date! Dia 20/12 teremos nossa festa de fim de ano!',
          categoria: 'Evento',
          autor: 'RH',
          data: '2025-10-29',
          comentarios: [
            { id: 1, autor: 'João', texto: 'Animado!' }
          ]
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
      const user = JSON.parse(localStorage.getItem('userData') || '{}');
      
      const payload = {
        ...formData,
        autor: user.nomeUsuario || user.nm_usuario || 'Admin'
      };

      const url = editingAviso 
        ? `http://localhost:5000/api/comunicacao/${editingAviso.id}`
        : 'http://localhost:5000/api/comunicacao';
      
      const response = await fetch(url, {
        method: editingAviso ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        alert(editingAviso ? 'Aviso atualizado!' : 'Aviso publicado!');
        setShowModal(false);
        setEditingAviso(null);
        setFormData({ titulo: '', mensagem: '', categoria: 'Informativo', anexo: '', dataExpiracao: '' });
        loadAvisos();
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao publicar aviso');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja excluir este aviso?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/comunicacao/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Aviso excluído!');
        loadAvisos();
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const handleComment = async (avisoId, comentario) => {
    if (!comentario.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('userData') || '{}');
      
      const response = await fetch(`http://localhost:5000/api/comunicacao/${avisoId}/comentarios`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          texto: comentario,
          autor: user.nomeUsuario || user.nm_usuario || 'Usuário'
        })
      });
      
      if (response.ok) {
        loadAvisos();
      }
    } catch (error) {
      console.error('Erro ao comentar:', error);
    }
  };

  const getCategoryColor = (categoria) => {
    const colors = {
      'Urgente': '#e74c3c',
      'Importante': '#f39c12',
      'Informativo': '#3498db',
      'Evento': '#9b59b6',
      'Lembrete': '#1abc9c'
    };
    return colors[categoria] || '#95a5a6';
  };

  const getCategoryIcon = (categoria) => {
    const icons = {
      'Urgente': '🚨',
      'Importante': '⚠️',
      'Informativo': 'ℹ️',
      'Evento': '📅',
      'Lembrete': '📌'
    };
    return icons[categoria] || '📢';
  };

  // Ordenar: Urgentes primeiro
  const sortedAvisos = [...avisos].sort((a, b) => {
    if (a.categoria === 'Urgente' && b.categoria !== 'Urgente') return -1;
    if (a.categoria !== 'Urgente' && b.categoria === 'Urgente') return 1;
    return new Date(b.data) - new Date(a.data);
  });

  const filteredAvisos = selectedCategory === 'Todos' 
    ? sortedAvisos 
    : sortedAvisos.filter(av => av.categoria === selectedCategory);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>💬 Comunicação Interna</h1>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} style={styles.addButton}>
            ➕ Novo Aviso
          </button>
        )}
      </div>

      {/* Filtro de Categorias */}
      <div style={styles.filterBar}>
        <button
          onClick={() => setSelectedCategory('Todos')}
          style={{
            ...styles.filterButton,
            ...(selectedCategory === 'Todos' ? styles.filterButtonActive : {})
          }}
        >
          Todos
        </button>
        {categorias.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              ...styles.filterButton,
              ...(selectedCategory === cat ? styles.filterButtonActive : {}),
              borderLeft: `4px solid ${getCategoryColor(cat)}`
            }}
          >
            {getCategoryIcon(cat)} {cat}
          </button>
        ))}
      </div>

      {/* Lista de Avisos */}
      {loading ? (
        <div style={styles.loading}>Carregando...</div>
      ) : filteredAvisos.length === 0 ? (
        <div style={styles.empty}>Nenhum aviso encontrado</div>
      ) : (
        <div style={styles.avisosList}>
          {filteredAvisos.map(aviso => (
            <AvisoCard 
              key={aviso.id} 
              aviso={aviso}
              isAdmin={isAdmin}
              onEdit={() => {
                setEditingAviso(aviso);
                setFormData({
                  titulo: aviso.titulo,
                  mensagem: aviso.mensagem,
                  categoria: aviso.categoria,
                  anexo: aviso.anexo || '',
                  dataExpiracao: aviso.dataExpiracao || ''
                });
                setShowModal(true);
              }}
              onDelete={() => handleDelete(aviso.id)}
              onComment={handleComment}
              getCategoryColor={getCategoryColor}
              getCategoryIcon={getCategoryIcon}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{editingAviso ? 'Editar Aviso' : 'Novo Aviso'}</h2>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label>Categoria:</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  style={styles.input}
                  required
                >
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{getCategoryIcon(cat)} {cat}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label>Título:</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  style={styles.input}
                  placeholder="Título do aviso..."
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Mensagem:</label>
                <textarea
                  value={formData.mensagem}
                  onChange={(e) => setFormData({...formData, mensagem: e.target.value})}
                  style={{...styles.input, minHeight: '120px'}}
                  placeholder="Escreva o aviso aqui..."
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Anexo (URL):</label>
                <input
                  type="url"
                  value={formData.anexo}
                  onChange={(e) => setFormData({...formData, anexo: e.target.value})}
                  style={styles.input}
                  placeholder="https://..."
                />
              </div>

              <div style={styles.formGroup}>
                <label>Data de Expiração:</label>
                <input
                  type="date"
                  value={formData.dataExpiracao}
                  onChange={(e) => setFormData({...formData, dataExpiracao: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveBtn}>
                  {editingAviso ? 'Atualizar' : 'Publicar'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowModal(false);
                    setEditingAviso(null);
                    setFormData({ titulo: '', mensagem: '', categoria: 'Informativo', anexo: '', dataExpiracao: '' });
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

// Componente de Card de Aviso
const AvisoCard = ({ aviso, isAdmin, onEdit, onDelete, onComment, getCategoryColor, getCategoryIcon }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  return (
    <div style={{
      ...styles.avisoCard,
      borderLeft: `5px solid ${getCategoryColor(aviso.categoria)}`
    }}>
      <div style={styles.avisoHeader}>
        <div>
          <span style={{
            ...styles.categoryBadge,
            backgroundColor: getCategoryColor(aviso.categoria)
          }}>
            {getCategoryIcon(aviso.categoria)} {aviso.categoria}
          </span>
          <span style={styles.avisoDate}>{new Date(aviso.data).toLocaleDateString('pt-BR')}</span>
        </div>
        {isAdmin && (
          <div style={styles.avisoActions}>
            <button onClick={onEdit} style={styles.editBtn}>✏️</button>
            <button onClick={onDelete} style={styles.deleteBtn}>🗑️</button>
          </div>
        )}
      </div>

      <h3 style={styles.avisoTitle}>{aviso.titulo}</h3>
      <p style={styles.avisoMessage}>{aviso.mensagem}</p>

      {aviso.anexo && (
        <a href={aviso.anexo} target="_blank" rel="noopener noreferrer" style={styles.anexoLink}>
          📎 Ver anexo
        </a>
      )}

      <div style={styles.avisoFooter}>
        <span style={styles.avisoAutor}>Por: {aviso.autor}</span>
        <button 
          onClick={() => setShowComments(!showComments)}
          style={styles.commentBtn}
        >
          💬 {aviso.comentarios?.length || 0} comentários
        </button>
      </div>

      {showComments && (
        <div style={styles.commentsSection}>
          {aviso.comentarios?.map((com, idx) => (
            <div key={idx} style={styles.comment}>
              <strong>{com.autor}:</strong> {com.texto}
            </div>
          ))}
          
          <div style={styles.newCommentBox}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              style={styles.commentInput}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onComment(aviso.id, newComment);
                  setNewComment('');
                }
              }}
            />
            <button
              onClick={() => {
                onComment(aviso.id, newComment);
                setNewComment('');
              }}
              style={styles.sendCommentBtn}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1000px',
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
    backgroundColor: '#8e44ad',
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
    marginBottom: '20px',
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
    padding: '40px',
    fontSize: '18px'
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#95a5a6',
    fontSize: '16px'
  },
  avisosList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  avisoCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  avisoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  categoryBadge: {
    padding: '5px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    marginRight: '10px'
  },
  avisoDate: {
    fontSize: '12px',
    color: '#7f8c8d'
  },
  avisoActions: {
    display: 'flex',
    gap: '8px'
  },
  editBtn: {
    padding: '6px 10px',
    backgroundColor: '#f39c12',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  deleteBtn: {
    padding: '6px 10px',
    backgroundColor: '#e74c3c',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  avisoTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#2c3e50'
  },
  avisoMessage: {
    fontSize: '15px',
    color: '#34495e',
    lineHeight: '1.6',
    marginBottom: '15px',
    whiteSpace: 'pre-wrap'
  },
  anexoLink: {
    color: '#3498db',
    textDecoration: 'none',
    fontSize: '14px',
    display: 'inline-block',
    marginBottom: '15px'
  },
  avisoFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '15px',
    borderTop: '1px solid #ecf0f1'
  },
  avisoAutor: {
    fontSize: '13px',
    color: '#7f8c8d',
    fontStyle: 'italic'
  },
  commentBtn: {
    padding: '6px 12px',
    backgroundColor: '#ecf0f1',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  commentsSection: {
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #ecf0f1'
  },
  comment: {
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    marginBottom: '8px',
    fontSize: '14px'
  },
  newCommentBox: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  commentInput: {
    flex: 1,
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px'
  },
  sendCommentBtn: {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
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
    maxWidth: '600px',
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
    backgroundColor: '#8e44ad',
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

export default Comunicacao;