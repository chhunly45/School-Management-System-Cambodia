import React from 'react';

interface HelmetProps {
  title?: string;
  children?: React.ReactNode;
}

export const HelmetProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const Helmet: React.FC<HelmetProps> = ({ title, children }) => {
  if (typeof title === 'string') {
    document.title = title;
  }

  // Render children directly so tests can query meta/link/script tags.
  return <>{children}</>;
};

export default {
  HelmetProvider,
  Helmet,
};
