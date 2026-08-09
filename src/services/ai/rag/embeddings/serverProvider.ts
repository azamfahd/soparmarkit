import { EmbeddingProvider } from './types';

/**
 * Online embedding provider calling our server-side proxy route.
 * Generates high-quality 768-dimensional dense neural embeddings using Gemini API (gemini-embedding-2-preview).
 */
export class ServerEmbeddingProvider implements EmbeddingProvider {
  readonly providerId = 'server';
  readonly providerName = 'المُوجّه السحابي الذكي (Gemini)';
  readonly dimension = 768;

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `خطأ سيرفر: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.embedding) {
        return result.embedding;
      } else {
        throw new Error(result.error || 'استجابة غير صالحة من السيرفر');
      }
    } catch (error: any) {
      console.warn('Server embedding failed, routing to coordinator fallback:', error);
      throw error; // Bubble up for fallback coordinator
    }
  }

  async getEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texts }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `خطأ سيرفر: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.embeddings) {
        return result.embeddings;
      } else {
        throw new Error(result.error || 'استجابة غير صالحة من السيرفر');
      }
    } catch (error: any) {
      console.warn('Server bulk embedding failed:', error);
      throw error;
    }
  }
}
