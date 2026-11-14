import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../art/tokens.css';
import '../ui/app.css';
import { BuildingPreview } from './BuildingPreview';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <BuildingPreview />
    </StrictMode>,
  );
}
