import React from 'react';

const LoadingScreen = ({ message = 'Carregando...' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Arial',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{ marginBottom: '20px', fontSize: '24px' }}>⏳</div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingScreen;