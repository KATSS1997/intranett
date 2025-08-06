import React from 'react';

const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '32px'
  };

  return (
    <div style={{
      width: sizeMap[size],
      height: sizeMap[size],
      border: '2px solid #f3f3f3',
      borderTop: '2px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      display: 'inline-block'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;