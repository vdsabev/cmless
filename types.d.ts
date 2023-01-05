export * from './api/src/types.d';

export interface Settings {
  entry?: string;
  template?: string;
  alias?: Record<string, string>;

  favicon: string;
  title: string;
  meta?: Record<string, string>;
  fonts?: Record<string, string>;
}
