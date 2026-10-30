import { ResearchDocument, Collaborator } from './types';

export const ADMIN_USER: Collaborator = {
  id: 'user-sunil',
  name: 'Sunil Paudel',
  email: 'sunil@researchlab.np',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'owner',
  color: '#6366f1', // Indigo
  isOnline: true,
};

// Clean fresh start: Only Admin exists initially. All mock members removed.
// New members can only be added dynamically by Admin Sunil.
export const RESEARCH_PERSONAS: Collaborator[] = [
  ADMIN_USER,
];

// Clean fresh start: No pre-seeded active papers.
// Admin Sunil creates research papers from the launch dashboard.
export const INITIAL_DOCUMENTS: ResearchDocument[] = [];
