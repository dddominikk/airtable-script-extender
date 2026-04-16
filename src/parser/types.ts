export type ParserFn = (source: string) => unknown | Promise<unknown>;

export interface FormatDependency {
  cdnUrl: string;
  localPath?: string;
}

export interface FormatEntry {
  key: string;
  extensions: string[];
  mimeTypes: string[];
  depKeys: string[];
}

export type SupportedFormat = string;

export type ParserMap = Record<string, ParserFn>;
