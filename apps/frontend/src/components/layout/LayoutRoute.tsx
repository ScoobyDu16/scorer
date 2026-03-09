import React from 'react';
import { Route } from 'react-router-dom';

interface LayoutRouteProps {
  title?: string;
  actions?: React.ReactNode;
  element: React.ReactElement;
  path: string;
}

export const LayoutRoute: React.FC<LayoutRouteProps> = ({ title, actions, element, path }) => {
  return (
    <Route 
      path={path} 
      element={React.cloneElement(element, { title, actions })}
    />
  );
};
