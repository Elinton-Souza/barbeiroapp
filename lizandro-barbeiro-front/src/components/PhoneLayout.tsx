import React from 'react';

export const PhoneLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="desktop-stage">
      <div className="phone-frame">
        <div className="phone-notch" />
        <main className="phone-screen">{children}</main>
      </div>
    </div>
  );
};