export * from './server/src/types';

export interface Settings {
  entry: string;
  template: string;

  /** @deprecated To be removed in cmless@4.0.0, use `link` instead */
  favicon: string;
  link: Array<{ rel: string; href: string; [key]: string }>;
  title: string;
  meta: Record<MetaTagName, MetaTagContent>;

  fonts: Record<FontType, FontName>;
  theme: boolean | Record<CssVariableName, CssVariableValue>;
  reset: boolean | CssResetContents;

  forms: Record<FormName, Record<FormElementName, FormElementAttributes>>;
}

type MetaTagName = string;
type MetaTagContent = string;

type FontType = string;
type FontName = string;

type CssVariableName = string;
type CssVariableValue = string;
type CssResetContents = string;

type FormName = string;
type FormElementName = string;
type FormElementAttributes = {
  tagName: keyof HTMLElementTagNameMap;
  [key: string]: string;
};
