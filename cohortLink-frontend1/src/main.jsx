import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import '@mantine/core/styles.css';
import './index.css';
import App from './App.jsx';

const theme = createTheme({
  fontFamily: "'Inter', system-ui, sans-serif",
  primaryColor: 'blue',
  defaultRadius: 'md',
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <MantineProvider theme={theme} forceColorScheme="light">
            <App />
          </MantineProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
