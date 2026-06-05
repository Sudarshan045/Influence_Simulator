import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { SimulationHistoryProvider } from './context/SimulationHistoryContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { registerGlobalHandlers } from './utils/errorLogger.js';
import './index.css';

// Register global window error + unhandled promise rejection handlers
// This must run BEFORE the React tree mounts.
registerGlobalHandlers();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Top-level boundary: catches catastrophic failures outside any route boundary */}
    <ErrorBoundary context="Application" variant="page">
      <AuthProvider>
        <NotificationProvider>
          <SimulationHistoryProvider>
            <App />
          </SimulationHistoryProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
