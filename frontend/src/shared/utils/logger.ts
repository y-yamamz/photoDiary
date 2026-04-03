// ============================================================
// エラーロガー
// 出力先: console / localStorage / バックエンドエンドポイント
// ============================================================

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;       // 発生箇所 (例: "usePhotoUpload", "apiClient")
  details?: unknown;      // スタックトレースや追加情報
}

export interface LoggerConfig {
  /** コンソールへ出力する (デフォルト: true) */
  console: boolean;
  /** localStorage へ保存する (デフォルト: false) */
  localStorage: boolean;
  /** localStorage のキー */
  localStorageKey: string;
  /** localStorage に保持する最大件数 */
  maxEntries: number;
  /** バックエンドへ送信するエンドポイント URL (undefined = 送信しない) */
  endpoint?: string;
  /** 送信する最低ログレベル (デフォルト: 'error') */
  minLevel: LogLevel;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const defaultConfig: LoggerConfig = {
  console: true,
  localStorage: false,
  localStorageKey: 'photo_diary_logs',
  maxEntries: 200,
  endpoint: undefined,
  minLevel: 'error',
};

let config: LoggerConfig = { ...defaultConfig };

/** ロガーの設定を変更する */
export const configureLogger = (overrides: Partial<LoggerConfig>) => {
  config = { ...config, ...overrides };
};

/** 現在の設定を取得する */
export const getLoggerConfig = (): Readonly<LoggerConfig> => ({ ...config });

// ---------- 内部ユーティリティ ----------

const buildEntry = (
  level: LogLevel,
  message: string,
  context?: string,
  details?: unknown,
): LogEntry => ({
  level,
  message,
  timestamp: new Date().toISOString(),
  context,
  details,
});

const writeToConsole = (entry: LogEntry) => {
  const prefix = `[${entry.timestamp}]${entry.context ? ` [${entry.context}]` : ''}`;
  switch (entry.level) {
    case 'error': console.error(prefix, entry.message, entry.details ?? ''); break;
    case 'warn':  console.warn (prefix, entry.message, entry.details ?? ''); break;
    case 'info':  console.info (prefix, entry.message, entry.details ?? ''); break;
    case 'debug': console.debug(prefix, entry.message, entry.details ?? ''); break;
  }
};

const writeToLocalStorage = (entry: LogEntry) => {
  try {
    const raw = localStorage.getItem(config.localStorageKey);
    const entries: LogEntry[] = raw ? JSON.parse(raw) : [];
    entries.push(entry);
    // 上限を超えたら古いものから削除
    if (entries.length > config.maxEntries) {
      entries.splice(0, entries.length - config.maxEntries);
    }
    localStorage.setItem(config.localStorageKey, JSON.stringify(entries));
  } catch {
    // localStorage が使えない環境では無視
  }
};

const sendToEndpoint = async (entry: LogEntry) => {
  if (!config.endpoint) return;
  try {
    await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch {
    // ログ送信の失敗は握り潰す（無限ループ防止）
  }
};

// ---------- コア ----------

const log = (level: LogLevel, message: string, context?: string, details?: unknown) => {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[config.minLevel]) return;

  const entry = buildEntry(level, message, context, details);

  if (config.console)       writeToConsole(entry);
  if (config.localStorage)  writeToLocalStorage(entry);
  if (config.endpoint)      sendToEndpoint(entry);
};

// ---------- 公開 API ----------

export const logger = {
  error: (message: string, context?: string, details?: unknown) =>
    log('error', message, context, details),
  warn:  (message: string, context?: string, details?: unknown) =>
    log('warn',  message, context, details),
  info:  (message: string, context?: string, details?: unknown) =>
    log('info',  message, context, details),
  debug: (message: string, context?: string, details?: unknown) =>
    log('debug', message, context, details),

  /** localStorage に保存されているログ一覧を取得する */
  getStoredLogs: (): LogEntry[] => {
    try {
      const raw = localStorage.getItem(config.localStorageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /** localStorage のログを消去する */
  clearStoredLogs: () => {
    localStorage.removeItem(config.localStorageKey);
  },
};
