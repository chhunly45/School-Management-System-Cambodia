export const getViteEnv = (key: string, fallback: string): string => {
  const env = (process.env || {}) as Record<string, string | undefined>;
  return env[key] || fallback;
};

export const safeImportMetaEnv = (): Record<string, string> => {
  return (process.env || {}) as Record<string, string>;
};
