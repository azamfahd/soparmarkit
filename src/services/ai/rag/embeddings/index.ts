import { EmbeddingProvider, ProviderMode } from './types';
import { LocalEmbeddingProvider } from './localProvider';

export * from './types';
export * from './localProvider';

class EmbeddingManager {
  private localProvider = new LocalEmbeddingProvider();
  private currentMode: ProviderMode = 'local';

  constructor() {
    this.currentMode = 'local';
  }

  /**
   * Sets the active embedding mode (Always local for offline agent).
   */
  public setMode(mode: ProviderMode) {
    this.currentMode = 'local';
  }

  /**
   * Gets the active embedding mode.
   */
  public getMode(): ProviderMode {
    return 'local';
  }

  /**
   * Retrieves the active provider.
   */
  public async getActiveProvider(): Promise<EmbeddingProvider> {
    return this.localProvider;
  }

  /**
   * Generates embedding for a single text using active provider.
   */
  public async getEmbedding(text: string): Promise<{ values: number[]; providerId: 'local' | 'server' }> {
    const values = await this.localProvider.getEmbedding(text);
    return { values, providerId: 'local' };
  }

  /**
   * Generates embeddings for multiple texts using active provider.
   */
  public async getEmbeddings(texts: string[]): Promise<{ values: number[][]; providerId: 'local' | 'server' }> {
    const values = await this.localProvider.getEmbeddings(texts);
    return { values, providerId: 'local' };
  }
}

export const embeddingManager = new EmbeddingManager();
export { LocalEmbeddingProvider };
