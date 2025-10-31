/**
 * Meme Pipeline - High-level functions for meme operations
 */

import { Meme, MemeAttributes, ContentType, MEME_PRESETS } from '../schemas/meme';

/**
 * Create a meme with default attributes
 */
export function createMeme(
  contentType: ContentType,
  title: string,
  customAttributes?: Partial<MemeAttributes>
): Meme {
  const baseAttributes = MEME_PRESETS[contentType];
  
  const attributes: MemeAttributes = {
    political_bias: 0,
    emotional_intensity: 0.5,
    factual_accuracy: 0.5,
    complexity: 0.5,
    virality_factor: 0.5,
    source_credibility: 0.5,
    ...baseAttributes,
    ...customAttributes,
  };

  return {
    id: `meme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content_type: contentType,
    title,
    attributes,
    timestamp: Date.now(),
    generation: 0,
    parent_id: null,
  };
}

/**
 * Create a meme variant (mutation)
 */
export function createMemeVariant(parentMeme: Meme, mutationFactor: number = 0.1): Meme {
  const mutate = (value: number) => {
    const change = (Math.random() - 0.5) * 2 * mutationFactor;
    return Math.max(0, Math.min(1, value + change));
  };

  const newAttributes: MemeAttributes = {
    political_bias: mutate(parentMeme.attributes.political_bias),
    emotional_intensity: mutate(parentMeme.attributes.emotional_intensity),
    factual_accuracy: mutate(parentMeme.attributes.factual_accuracy),
    complexity: mutate(parentMeme.attributes.complexity),
    virality_factor: mutate(parentMeme.attributes.virality_factor),
    source_credibility: mutate(parentMeme.attributes.source_credibility),
  };

  return {
    id: `meme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content_type: parentMeme.content_type,
    title: `${parentMeme.title} (variant)`,
    attributes: newAttributes,
    timestamp: Date.now(),
    generation: parentMeme.generation + 1,
    parent_id: parentMeme.id,
  };
}

/**
 * Get available meme presets
 */
export function getMemePresets(): Array<{ type: ContentType; description: string }> {
  return [
    {
      type: 'political_conspiracy',
      description: 'High virality, low accuracy, politically biased',
    },
    {
      type: 'health_misinformation',
      description: 'Emotional, moderate virality, low-medium accuracy',
    },
    {
      type: 'factual_news',
      description: 'High accuracy, low virality, neutral bias',
    },
    {
      type: 'neutral',
      description: 'Balanced attributes across all dimensions',
    },
  ];
}

