import { EmbeddingProvider } from './types';
import { tokenizeArabicText } from '../vectorEngine';

/**
 * Deterministic string hashing function (polynomial rolling hash).
 */
function hashString(str: string, seed: number = 0): number {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash * 33) ^ char;
  }
  return hash >>> 0;
}

/**
 * Local deterministic vectorizer using the Feature Hashing Trick (Vowpal Wabbit style).
 * Highly optimized for client-side offline use, producing L2-normalized 256-dimensional vectors.
 */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  readonly providerId = 'local';
  readonly providerName = 'المُوجّه المحلي (خوارزمية Hash-Feature)';
  readonly dimension = 256;

  async getEmbedding(text: string): Promise<number[]> {
    const tokens = tokenizeArabicText(text);
    const vector = new Array(this.dimension).fill(0);

    if (tokens.length === 0) {
      // Return a stable small vector
      vector[0] = 1.0;
      return vector;
    }

    // Hash tokens into buckets
    for (const token of tokens) {
      const idx = hashString(token) % this.dimension;
      const signHash = hashString(token, 42) % 2;
      const sign = signHash === 0 ? 1 : -1;
      
      // Increment count (we use term frequency within the chunk)
      vector[idx] += sign * (1 / tokens.length);
    }

    // Apply L2-normalization: v_norm = v / sqrt(sum(v_i^2))
    let sumSq = 0;
    for (let i = 0; i < this.dimension; i++) {
      sumSq += vector[i] * vector[i];
    }

    const norm = Math.sqrt(sumSq);
    if (norm > 0) {
      for (let i = 0; i < this.dimension; i++) {
        vector[i] = vector[i] / norm;
      }
    } else {
      vector[0] = 1.0;
    }

    return vector;
  }

  async getEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.getEmbedding(text)));
  }
}
