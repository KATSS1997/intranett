/**
 * Página de Agendamento de Salas
 * Caminho: frontend/src/pages/AgendamentoSalas.jsx
 */

import React, { useState, useEffect } from 'react';

const AgendamentoSalas = () => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSala, setSelectedSala] = useState('Todas');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sala: 'Sala 1',
    data: new Date().toISOString().split('T')[0],
    horaInicio: '08:00',
    horaFim: '09:00',
    motivo: '',
    responsavel: ''
  });

  const salas = ['Sala 1', 'Sala 2', 'Sala 3', 'Auditório'];
  const horarios = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  useEffect(() => {
    loadAgendamentos();
  }, [selectedDate]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userData') || '{}');
    setFormData(prev => ({
      ...prev,
      responsavel: user.nomeUsuario || user.nm_usuario || ''
    }));
  }, []);

  const loadAgendamentos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/agendamentos?data=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAgendamentos(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      // Mock data
      setAgendamentos([
        { id: 1, sala: 'Sala 1', data: selectedDate, horaInicio: '09:00', horaFim: '10:00', motivo: 'Reunião de equipe', responsavel: 'João Silva' },
        { id: 2, sala: 'Auditório', data: selectedDate, horaInicio: '14:00', horaFim: '16:00', motivo: 'Treinamento', responsavel: 'Maria Santos' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar horários
    if (formData.horaInicio >= formData.horaFim) {
      alert('Hora de início deve ser menor que hora de fim!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/agendamentos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert('Sala agendada com sucesso!');
        setShowModal(false);
        setFormData({
          sala: 'Sala 1',
          data: new Date().toISOString().split('T')[0],
          horaInicio: '08:00',
          horaFim: '09:00',
          motivo: '',
          responsavel: formData.responsavel
        });
        loadAgendamentos();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao agendar sala');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao agendar sala');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja cancelar este agendamento?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/agendamentos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert('Agendamento cancelado!');
        loadAgendamentos();
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const getSalaColor = (sala) => {
    const colors = {
      'Sala 1': '#3498db',
      'Sala 2': '#2ecc71',
      'Sala 3': '#f39c12',
      'Auditório': '#e74c3c'
    };
    return colors[sala] || '#95a5a6';
  };

  const filteredAgendamentos = selectedSala === 'Todas' 
    ? agendamentos 
    : agendamentos.filter(ag => ag.sala === selectedSala);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📅 Agendamento de Salas</h1>
        <button onClick={() => setShowModal(true)} style={styles.addButton}>
          ➕ Nova Reserva
        </button>
      </div>

      {/* Filtros */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label>Data:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={styles.dateInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <label>Sala:</label>
          <select 
            value={selectedSala}
            onChange={(e) => setSelectedSala(e.target.value)}
            style={styles.select}
          >
            <option value="Todas">Todas as Salas</option>
            {salas.map(sala => (
              <option key={sala} value={sala}>{sala}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Legenda de cores */}
      <div style={styles.legend}>
        {salas.map(sala => (
          <div key={sala} style={styles.legendItem}>
            <div style={{...styles.colorBox, backgroundColor: getSalaColor(sala)}}></div>
            <span>{sala}</span>
          </div>
        ))}
      </div>

      {/* Timeline de Agendamentos */}
      {loading ? (
        <div style={styles.loading}>Carregando...</div>
      ) : (
        <div style={styles.timeline}>
          <div style={styles.timeColumn}>
            <div style={styles.timeHeader}>Horário</div>
            {horarios.map(hora => (
              <div key={hora} style={styles.timeSlot}>{hora}</div>
            ))}
          </div>

          {salas.map(sala => {
            if (selectedSala !== 'Todas' && selectedSala !== sala) return null;
            
            return (
              <div key={sala} style={styles.salaColumn}>
                <div style={{...styles.salaHeader, backgroundColor: getSalaColor(sala)}}>
                  {sala}
                </div>
                
                <div style={styles.slotsContainer}>
                  {horarios.map((hora, index) => {
                    const agendamento = filteredAgendamentos.find(ag => 
                      ag.sala === sala && 
                      ag.horaInicio === hora
                    );
                    
                    return (
                      <div key={hora} style={styles.timeSlot}>
                        {agendamento ? (
                          <div style={{
                            ...styles.agendamentoCard,
                            backgroundColor: getSalaColor(sala),
                            height: calculateHeight(agendamento.horaInicio, agendamento.horaFim)
                          }}>
                            <div style={styles.agendamentoContent}>
                              <strong>{agendamento.horaInicio} - {agendamento.horaFim}</strong>
                              <p>{agendamento.motivo}</p>
                              <small>{agendamento.responsavel}</small>
                            </div>
                            <button 
                              onClick={() => handleDelete(agendamento.id)}
                              style={styles.deleteAgBtn}
                              title="Cancelar"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={styles.emptySlot}>Livre</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Agendamento */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Nova Reserva de Sala</h2>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label>Sala:</label>
                <select
                  value={formData.sala}
                  onChange={(e) => setFormData({...formData, sala: e.target.value})}
                  style={styles.input}
                  required
                >
                  {salas.map(sala => (
                    <option key={sala} value={sala}>{sala}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label>Data:</label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({...formData, data: e.target.value})}
                  style={styles.input}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label>Hora Início:</label>
                  <select
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({...formData, horaInicio: e.target.value})}
                    style={styles.input}
                    required
                  >
                    {horarios.map(hora => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label>Hora Fim:</label>
                  <select
                    value={formData.horaFim}
                    onChange={(e) => setFormData({...formData, horaFim: e.target.value})}
                    style={styles.input}
                    required
                  >
                    {horarios.map(hora => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label>Motivo:</label>
                <textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                  style={{...styles.input, minHeight: '80px'}}
                  placeholder="Descrição da reunião/evento..."
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Responsável:</label>
                <input
                  type="text"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveBtn}>Agendar</button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
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

// Função auxiliar para calcular altura do card baseado na duração
const calculateHeight = (inicio, fim) => {
  const [hI, mI] = inicio.split(':').map(Number);
  const [hF, mF] = fim.split(':').map(Number);
  const minutos = (hF * 60 + mF) - (hI * 60 + mI);
  const slots = minutos / 60;
  return `${slots * 60}px`; // 60px por hora
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
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  filters: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  dateInput: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px'
  },
  select: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minWidth: '150px'
  },
  legend: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  colorBox: {
    width: '20px',
    height: '20px',
    borderRadius: '4px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px'
  },
  timeline: {
    display: 'flex',
    gap: '2px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflowX: 'auto'
  },
  timeColumn: {
    minWidth: '80px'
  },
  timeHeader: {
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    borderBottom: '2px solid #ddd'
  },
  timeSlot: {
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid #ecf0f1',
    fontSize: '14px'
  },
  salaColumn: {
    flex: 1,
    minWidth: '200px'
  },
  salaHeader: {
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    borderRadius: '4px 4px 0 0'
  },
  slotsContainer: {
    position: 'relative'
  },
  emptySlot: {
    fontSize: '12px',
    color: '#bdc3c7'
  },
  agendamentoCard: {
    position: 'relative',
    padding: '8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    margin: '2px',
    cursor: 'pointer'
  },
  agendamentoContent: {
    overflow: 'hidden'
  },
  deleteAgBtn: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    background: 'rgba(0,0,0,0.3)',
    border: 'none',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
    backgroundColor: '#3498db',
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

export default AgendamentoSalas;