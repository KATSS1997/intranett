import React from 'react';

const PublicLayout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {children}
    </div>
  );
};

export default PublicLayout;