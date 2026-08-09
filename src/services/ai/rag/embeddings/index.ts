import { EmbeddingProvider, ProviderMode } from './types';
import { LocalEmbeddingProvider } from './localProvider';
import { ServerEmbeddingProvider } from './serverProvider';

export * from './types';
export * from './localProvider';
export * from './serverProvider';

class EmbeddingManager {
  private localProvider = new LocalEmbeddingProvider();
  private serverProvider = new ServerEmbeddingProvider();
  private currentMode: ProviderMode = 'local';

  constructor() {
    this.loadConfig();
  }

  /**
   * Loads the configuration from localStorage.
   */
  private loadConfig() {
    try {
      const savedMode = localStorage.getItem('grocery_ai_embedding_mode');
      if (savedMode === 'local' || savedMode === 'server' || savedMode === 'auto') {
        this.currentMode = savedMode;
      }
    } catch (e) {
      console.warn('Failed to load embedding config from localStorage, using default "local"', e);
    }
  }

  /**
   * Sets the active embedding mode and persists it.
   */
  public setMode(mode: ProviderMode) {
    this.currentMode = mode;
    try {
      localStorage.setItem('grocery_ai_embedding_mode', mode);
    } catch (e) {
      console.warn('Failed to save embedding config to localStorage', e);
    }
  }

  /**
   * Gets the active embedding mode.
   */
  public getMode(): ProviderMode {
    return this.currentMode;
  }

  /**
   * Retrieves the active provider based on mode and network availability.
   */
  public async getActiveProvider(): Promise<EmbeddingProvider> {
    if (this.currentMode === 'local') {
      return this.localProvider;
    }

    if (this.currentMode === 'server') {
      return this.serverProvider;
    }

    // 'auto' mode: try server first, fallback to local if offline or error
    try {
      // Fast check if offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return this.localProvider;
      }
      
      // Ping check or simply proceed with server, fallback handled on call
      return this.serverProvider;
    } catch {
      return this.localProvider;
    }
  }

  /**
   * Generates embedding for a single text using active provider with seamless fallback.
   */
  public async getEmbedding(text: string): Promise<{ values: number[]; providerId: 'local' | 'server' }> {
    const provider = await this.getActiveProvider();
    
    if (provider.providerId === 'server') {
      try {
        const values = await provider.getEmbedding(text);
        return { values, providerId: 'server' };
      } catch (err) {
        if (this.currentMode === 'auto') {
          console.warn('Server embedding failed, falling back to LocalEmbeddingProvider.', err);
          const values = await this.localProvider.getEmbedding(text);
          return { values, providerId: 'local' };
        }
        throw err;
      }
    }

    const values = await provider.getEmbedding(text);
    return { values, providerId: 'local' };
  }

  /**
   * Generates embeddings for multiple texts using active provider with seamless fallback.
   */
  public async getEmbeddings(texts: string[]): Promise<{ values: number[][]; providerId: 'local' | 'server' }> {
    const provider = await this.getActiveProvider();

    if (provider.providerId === 'server') {
      try {
        const values = await provider.getEmbeddings(texts);
        return { values, providerId: 'server' };
      } catch (err) {
        if (this.currentMode === 'auto') {
          console.warn('Server bulk embedding failed, falling back to LocalEmbeddingProvider.', err);
          const values = await this.localProvider.getEmbeddings(texts);
          return { values, providerId: 'local' };
        }
        throw err;
      }
    }

    const values = await provider.getEmbeddings(texts);
    return { values, providerId: 'local' };
  }
}

export const embeddingManager = new EmbeddingManager();
export { LocalEmbeddingProvider, ServerEmbeddingProvider };
