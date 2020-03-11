const SIGNAL = '{"____":null, "value":null, "reason":null, "error":null}'

export const OK /*   */ = 0b01
export const NOPE /* */ = 0b10

export function isOk(signal) {
  return signal.____ & OK
}

export function isNope(signal) {
  return signal.____ & NOPE
}

export function Ok(value) {
  const signal = JSON.parse(SIGNAL)
  signal.____ = OK
  signal.value = value
  return signal
}

export function Nope(value, reason, error) {
  const signal = JSON.parse(SIGNAL)
  signal.____ = NOPE
  signal.value = value
  signal.reason = reason
  signal.error = error
  return signal
}

function isObj(value) {
  return typeof value === "object"
}

export function isSignal(value) {
  return isObj(value) && (isOk(value) || isNope(value))
}

function asSignal(value) {
  return isSignal(value) ? value : Ok(value)
}

export async function pipe(signal, fns = []) {
  signal = asSignal(await signal)
  if (!fns.length || isNope(signal)) return signal
  const [hd, ...rest] = fns
  try {
    return hd == null ? pipe(signal, rest) : pipe(await hd(signal.value), rest)
  } catch (error) {
    return Nope(signal.value, "pipe::throw", error)
  }
}

function noop() {}
function ident(v) {
  return v
}

export function tap(fn = noop) {
  return async function tapAct(value) {
    fn(value)
    return value
  }
}

export function log(...msg) {
  return function logAct(value) {
    console.log(...msg, value)
    return value
  }
}

export function __(fn = ident, ...args) {
  return function __Act(value) {
    return fn(value, ...args)
  }
}
