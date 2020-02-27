import {pipe, Ok, Nope, isOk, isNope, tap, __} from "./mario.js"

it("sync functions", async () => {
  function double(value) {
    return value * 2
  }

  function triple(value) {
    return value * 3
  }

  const result = await pipe(4, [double, triple])
  // results have a value
  expect(result.value).toBe(24)

  // result is an ok signal
  expect(isOk(result)).toBeTruthy()
  expect(isNope(result)).toBeFalsy()

  // ok signals dont have reasons or errors
  expect(result.error).toBe(null)
  expect(result.reason).toBe(null)
})

it("async functions", async () => {
  async function double(value) {
    return value * 2
  }

  async function triple(value) {
    return value * 3
  }

  const result = await pipe(4, [double, triple])
  expect(result.value).toBe(24)
  expect(isOk(result)).toBeTruthy()
})

it("values can be bad bad not good", async () => {
  function double(value) {
    return value * 2
  }

  function maybeTriple(value) {
    return value === 8
      ? Nope(value, "8 is a bad number, shame :bell:")
      : Ok(value)
  }

  const result = await pipe(4, [double, maybeTriple])
  expect(result.value).toBe(8)

  // result is a nope signal
  expect(isNope(result)).toBeTruthy()
  expect(isOk(result)).toBeFalsy()

  // nope signals have a reason
  expect(result.reason).toBe("8 is a bad number, shame :bell:")
  // not all nope signals have an error though
  expect(result.error).toBeFalsy()
})

it("things can go really bad", async () => {
  function double(value) {
    return value * 2
  }

  function explosion(value) {
    throw new Error("EXPLOSION!!!")
  }

  const result = await pipe(4, [double, explosion])
  expect(result.value).toBe(8)
  expect(isNope(result)).toBeTruthy()

  // thrown errors are set as error and receive a reason
  expect(result.reason).toBe("pipe::throw")
  expect(result.error.message).toBe("EXPLOSION!!!")
  expect(result.error.stack).toBeTruthy()
})

it("bad pipes dont complete", async () => {
  function double(value) {
    return value * 2
  }

  function sadlyNo(value) {
    return Nope(value, "I BLOCK YOU!!")
  }

  const result = await pipe(4, [double, sadlyNo, double, double, double])
  // pipe should stop at sadlyNo and not double the value 3 more times
  expect(result.value).not.toBe(64)
  expect(result.value).toBe(8)
  expect(isNope(result)).toBeTruthy()
  expect(result.reason).toBe("I BLOCK YOU!!")
})

it("tap is for sideeffects", async () => {
  const a = jest.fn()
  const b = jest.fn()
  const c = jest.fn()

  function double(value) {
    return value * 2
  }

  const result = await pipe(4, [
    tap(x => a(x)),
    double,
    tap(b),
    double,
    tap(x => {
      c(x)
      return 999 // tap returns are ignored
    }),
    double,
    double,
  ])

  expect(result.error).toBeFalsy()
  expect(result.value).toBe(64)

  // tap(x => a(x))
  expect(a).toHaveBeenCalledTimes(1)
  expect(a).toHaveBeenCalledWith(4)

  // tap(b)
  expect(b).toHaveBeenCalledTimes(1)
  expect(b).toHaveBeenCalledWith(8)

  // tap(c => { c(x); return 999 })
  expect(c).toHaveBeenCalledTimes(1)
  expect(c).toHaveBeenCalledWith(16)
})

it("__ is for partial application", async () => {
  /** __ passes the value as the first argument of the function
   *  followed by the rest of the arguments to __
   *
   *  __(fn, ...args) => value => fn(value, ...args)
   */
  const pos = [0, 0]

  /** technically this could have been done like
   *  transform([x, y], [dx, dy])
   *  having it like transform([x, y], dx, dy)
   *  highlights the variadicness
   */
  function transform(pos, dx, dy) {
    const [x, y] = pos
    return [x + dx, y + dy]
  }

  const result = await pipe(pos, [
    __(transform, 1, 1),
    __(transform, -2, 5),
    __(transform, 6, -9),
  ])

  expect(result.error).toBeFalsy()
  expect(result.value).toEqual([5, -3])
  expect(isOk(result)).toBeTruthy()
})

it("pipe can take object", async () => {
  const pos = {x: 0, y: 0}

  const result = await pipe(pos)

  expect(result.error).toBeFalsy()
  expect(result.value).toEqual(pos)
  expect(isOk(result)).toBeTruthy()
})
