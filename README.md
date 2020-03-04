# MARIO

Because pipes...

### Install

```bash
npm install --save @qvvg/mario
```

### use pipe as composition.

```js
import {pipe} from "@qvvg/mario"

const double = x => x * 2
const result = await pipe(4, [double, double, double, double])

assert(result.value, 64)
```

### use pipe as validation

```js
import {pipe, Ok, Nope, isOk, isNope} from "@qvvg/mario"

const isString = value => {
  return typeof value === "string"
    ? Ok(value)
    : Nope(value, "Needs to be a string!")
}

const hasAt = value => {
  return /@/.test(value) ? Ok(value) : Nope(value, "Must have an @...")
}

const validateEmail = email => pipe(email, [isString, hasAt])

const v1 = await validateEmail("bob@bob.bob")
assert(v1.value, "bob@bob.bob")
assert(isOk(v1), true)
assert(isNope(v1), false)

const v2 = await validateEmail(1234)
assert(v2.value, 1234)
assert(isOk(v2), false)
assert(isNope(v2), true)
assert(v2.reason, "Needs to be a string!")

const v3 = await validateEmail("bobbob.bob")
assert(v3.value, "bobbob.bob")
assert(isOk(v3), false)
assert(isNope(v3), true)
assert(v3.reason, "Must have an @...")
```

### pipes can be async

```js
import {pipe, Ok, Nope, log} from "@qvvg/mario"

await pipe(null, [
  _ => fetch(url),
  r => (r.ok ? Ok(r.json()) : Nope(r.json(), r.statusText)),
  log("DATA"),
])
```

### pipes can handle errors

```js
import {pipe, log} from "@qvvg/mario"

const double = x => x * 2
const bang = x => {
  throw new Error("EXPLOSION!!!")
}

const result = await pipe(4, [
  double,
  double,
  bang,
  log("I will never happen because bang"),
  double,
])

assert(result.value, 16)
assert(isOk(result), false)
assert(isNope(result), true)
assert(result.reason, "pipe::throw")
assert(result.error.message, "EXPLOSION!!!")
```
