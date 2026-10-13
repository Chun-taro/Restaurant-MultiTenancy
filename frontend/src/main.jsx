import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { getStoredTheme, applyTheme } from './utils/theme';

// Apply saved theme immediately before React render
const storedTheme = getStoredTheme();
applyTheme(storedTheme.themeId, storedTheme.customPrimary, storedTheme.customAccent);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
