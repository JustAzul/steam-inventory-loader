export type Cookie = {
  creation?: Date | 'Infinity' | null;
  domain: string | null;
  expires: Date | 'Infinity' | null;
  hostOnly: boolean | null;
  key: string;
  lastAccessed?: Date | 'Infinity' | null;
  path: string | null;
  pathIsDefault: boolean;
  value: string;
};

export type SerializedCookie = {
  creation?: string;
  domain: string | null;
  expires: string;
  hostOnly: boolean | null;
  key: string;
  lastAccessed?: string;
  path: string | null;
  pathIsDefault: boolean;
  value: string;
};
