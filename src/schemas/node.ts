/**
 * Node Schema - Represents a person in the social network
 */

export type NodeState = 'susceptible' | 'exposed' | 'infected' | 'resistant';

export type IdentityClass = 
  | 'urban_professional'
  | 'university_student'
  | 'rural_traditional'
  | 'suburban_family'
  | 'tech_worker';

export interface NodeAttributes {
  political_leaning: number;        // -1 (left) to +1 (right)
  emotional_susceptibility: number; // 0 to 1
  critical_thinking: number;        // 0 to 1
  education_level: number;          // 0 to 1
  social_activity: number;          // 0 to 1
}

export interface Node {
  id: string;
  identity_class: IdentityClass;
  attributes: NodeAttributes;
  trust_network: Record<string, number>; // nodeId -> trust weight (0-1)
  current_beliefs: string[];            // Meme IDs
  exposure_history: string[];           // Meme IDs seen
  state: NodeState;
  
  // Graph position (for visualization)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface IdentityClassProfile {
  political_leaning: [number, number];
  critical_thinking: [number, number];
  emotional_susceptibility: [number, number];
  education_level: [number, number];
  social_activity: [number, number];
}

export const IDENTITY_PROFILES: Record<IdentityClass, IdentityClassProfile> = {
  urban_professional: {
    political_leaning: [-0.2, 0.2],
    critical_thinking: [0.7, 0.9],
    emotional_susceptibility: [0.3, 0.5],
    education_level: [0.7, 0.9],
    social_activity: [0.6, 0.8],
  },
  university_student: {
    political_leaning: [-0.4, 0.4],
    critical_thinking: [0.6, 0.8],
    emotional_susceptibility: [0.6, 0.8],
    education_level: [0.6, 0.9],
    social_activity: [0.7, 0.9],
  },
  rural_traditional: {
    political_leaning: [0.4, 0.8],
    critical_thinking: [0.4, 0.6],
    emotional_susceptibility: [0.5, 0.7],
    education_level: [0.3, 0.6],
    social_activity: [0.3, 0.5],
  },
  suburban_family: {
    political_leaning: [-0.1, 0.3],
    critical_thinking: [0.5, 0.7],
    emotional_susceptibility: [0.4, 0.6],
    education_level: [0.5, 0.7],
    social_activity: [0.4, 0.6],
  },
  tech_worker: {
    political_leaning: [-0.5, 0.1],
    critical_thinking: [0.8, 1.0],
    emotional_susceptibility: [0.2, 0.4],
    education_level: [0.8, 1.0],
    social_activity: [0.5, 0.7],
  },
};

