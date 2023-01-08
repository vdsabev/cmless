export * from './api/src/types';

export interface Settings {
  entry?: string;
  template?: string;

  favicon: string;
  title: string;
  meta?: Record<string, string>;
  fonts?: Record<string, string>;
  theme?: Record<string, string>;
  reset?: string;
}
