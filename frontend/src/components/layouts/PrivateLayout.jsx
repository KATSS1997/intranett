import React from 'react';

const PrivateLayout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh' }}>
      {children}
    </div>
  );
};

export default PrivateLayout;