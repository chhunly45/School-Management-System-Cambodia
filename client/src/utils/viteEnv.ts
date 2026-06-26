export const getViteEnv = (key: string, fallback: string): string => {
  const env = safeImportMetaEnv();
  const value = env[key];
  return value || fallback;
};

export const safeImportMetaEnv = (): Record<string, string> => {
  try {
    // Use eval to access import.meta.env without introducing raw `import.meta` syntax
    // that can break Jest's parser in non-ESM test environments.
    // eslint-disable-next-line no-eval
    const env = eval('import.meta.env') as Record<string, string>;
    return env || {};
  } catch {
    // Fallback to Node environment variables in test and server environments.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof process !== 'undefined' && (process as any).env ? (process as any).env : ({} as Record<string, string>);
  }
};