import type { SpecialistPlace } from '../data/types';

export type PanelId =
  | { kind: 'project'; id: string }
  | { kind: 'agent'; name: string }
  | { kind: 'town-hall' }
  | { kind: 'quest-board' }
  | { kind: 'quest-note'; key: string }
  | { kind: 'chronicle' }
  | { kind: 'tally' }
  | { kind: 'place'; id: 'gatehouse' | 'tavern' | SpecialistPlace }
  | { kind: 'pipeline' }
  | { kind: 'legend' };

export type OpenPanel = (panel: PanelId, trigger: Element | null) => void;
