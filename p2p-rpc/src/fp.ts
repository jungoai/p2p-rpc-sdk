export type Opt<T> =
  | T
  | undefined // implicit no value (i.e: no value present)
  | null // explicit no value (i.e: null present as a value)

export function unUndefined<T>(x: T | undefined): T {
  if (x === undefined) {
    throw new Error('unexpected undefined')
  } else {
    return x
  }
}

export function unOpt<T>(x: Opt<T>): T {
  switch (x) {
    case undefined:
      throw new Error('unexpected undefined')
    case null:
      throw new Error('unexpected null')
    default:
      return x
  }
}

export function unOptOr<T>(y: T, x: Opt<T>): T {
  try {
    return unOpt(x)
  } catch (_) {
    return y
  }
}

export function expect(msg: string, f: Fn1, x: any): any {
  try {
    return f(x)
  } catch (e) {
    throw new Error(`${msg}\n    Details: ${e}`)
  }
}

type Fn1 = (x: any) => any

// pip(x, [h, g, f])
export function pip(x1: any, fs: Fn1[]): any {
  let y = x1
  for (const f of fs) {
    y = f(y)
  }
  return y
}

// comp([f, g, h])(x)
export function comp(fs: Fn1[]): Fn1 {
  fs.reverse()
  return (x) => pip(x, fs)
}

export function parseBool(s: string): boolean {
  return s.toLowerCase() === 'true'
}

export function dbg<T>(x: T, title: string): T {
  console.log(`DBG [${title}]: ${x}`)
  return x
}

export function concatPath(xs: string[]): string {
  return xs.join('/')
}
