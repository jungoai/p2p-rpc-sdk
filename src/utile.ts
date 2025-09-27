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

export function replaceArray<T>(arr: T[], newArr: T[]): void {
  arr.splice(0, arr.length, ...newArr)
}

export function tuple<A, B>(a: A, b: B): [A, B] {
  return [a, b]
}

export type Opt<T> = T | null | undefined

export function unOpt<T>(x: Opt<T>): T {
  switch (x) {
    case null:
      throw new Error('unexpcted null')
    case undefined:
      throw new Error('unexpcted undefined')
    default:
      return x
  }
}
