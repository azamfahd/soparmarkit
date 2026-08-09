export interface EmbeddingProvider {
  providerId: 'local' | 'server';
  providerName: string;
  dimension: number;
  getEmbedding(text: string): Promise<number[]>;
  getEmbeddings(texts: string[]): Promise<number[][]>;
}

export type ProviderMode = 'local' | 'server' | 'auto';

export interface EmbeddingConfig {
  mode: ProviderMode;
  activeProviderId: 'local' | 'server';
}
