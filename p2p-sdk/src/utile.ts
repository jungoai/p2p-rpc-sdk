export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export let logSettings = { level: 'info' as LogLevel }

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function log(level: LogLevel, ...args: unknown[]) {
  if (levels[level] >= levels[logSettings.level]) {
    console[level](`[${level}]`, ...args)
  }
}

const log_ =
  (lvl: LogLevel) =>
  (...args: unknown[]) =>
    log(lvl, ...args)

export const debug = log_('debug')
export const info = log_('info')
export const warn = log_('warn')
export const error = log_('error')

export function concatPaths(paths: string[]): string {
  return paths.reduce(concatPath)
}

export function concatPath(base: string, sub: string): string {
  if (!base.endsWith('/')) {
    base += '/'
  }

  if (sub.startsWith('/')) {
    sub = sub.slice(1)
  }

  return base + sub
}
