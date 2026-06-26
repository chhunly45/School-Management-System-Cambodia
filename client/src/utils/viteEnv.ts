export const getViteEnv = (key: string, fallback: string): string => {
  const env = safeImportMetaEnv();
  const value = env[key];
  return value || fallback;
};

export const safeImportMetaEnv = (): Record<string, string> => {
  try {
    return import.meta.env as Record<string, string>;
  } catch {
    // Fallback to Node environment variables in test and server environments.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof process !== 'undefined' && (process as any).env ? (process as any).env : ({} as Record<string, string>);
  }
};