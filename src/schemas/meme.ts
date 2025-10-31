/**
 * Meme Schema - Represents information packets spreading through the network
 */

export type ContentType = 
  | 'political_conspiracy'
  | 'health_misinformation'
  | 'factual_news'
  | 'neutral';

export interface MemeAttributes {
  political_bias: number;       // -1 (left) to +1 (right)
  emotional_intensity: number;  // 0 to 1
  factual_accuracy: number;     // 0 to 1
  complexity: number;           // 0 to 1
  virality_factor: number;      // 0 to 1
  source_credibility: number;   // 0 to 1
}

export interface Meme {
  id: string;
  content_type: ContentType;
  title: string;
  attributes: MemeAttributes;
  timestamp: number;
  generation: number;           // 0 = original, 1+ = variant
  parent_id: string | null;     // For tracking mutations
}

export const MEME_PRESETS: Record<ContentType, Partial<MemeAttributes>> = {
  political_conspiracy: {
    political_bias: 0.8,
    emotional_intensity: 0.9,
    factual_accuracy: 0.2,
    complexity: 0.3,
    virality_factor: 0.8,
    source_credibility: 0.3,
  },
  health_misinformation: {
    political_bias: 0.0,
    emotional_intensity: 0.7,
    factual_accuracy: 0.3,
    complexity: 0.4,
    virality_factor: 0.6,
    source_credibility: 0.4,
  },
  factual_news: {
    political_bias: 0.0,
    emotional_intensity: 0.3,
    factual_accuracy: 0.9,
    complexity: 0.6,
    virality_factor: 0.3,
    source_credibility: 0.9,
  },
  neutral: {
    political_bias: 0.0,
    emotional_intensity: 0.5,
    factual_accuracy: 0.5,
    complexity: 0.5,
    virality_factor: 0.5,
    source_credibility: 0.5,
  },
};

