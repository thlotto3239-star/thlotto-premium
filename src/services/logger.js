/**
 * Logger utility — ปิด output ใน production
 * ใช้แทน console.log/warn/error ทุกที่
 */

const isDev = import.meta.env.DEV;

const logger = {
  log: (...args) => { if (isDev) console.log('[TH-LOTTO]', ...args); },
  warn: (...args) => { if (isDev) console.warn('[TH-LOTTO]', ...args); },
  error: (...args) => { if (isDev) console.error('[TH-LOTTO]', ...args); },
  info: (...args) => { if (isDev) console.info('[TH-LOTTO]', ...args); },
};

export default logger;
