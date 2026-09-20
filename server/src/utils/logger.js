// Single place for server logging so `console.*` never appears elsewhere.
const write = (level, message, meta) => {
  const line = { level, time: new Date().toISOString(), message, ...(meta ?? {}) };
  const out = JSON.stringify(line);
  if (level === 'error') console.error(out);
  else console.log(out);
};

export const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};
