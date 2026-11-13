import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './art/tokens.css';
import './art/motion.css';
import './ui/app.css';
import { App } from './ui/App';
import { ErrorBoundary } from './ui/ErrorBoundary';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
