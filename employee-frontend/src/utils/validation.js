// Pure functions: no React, easy to test.

export const LIMITS = {
  nameMin: 2,
  nameMax: 100,
  ageMin: 18,
  ageMax: 100,
  salaryMax: 1000000000,
  emailMax: 100,
}

const NAME_RE = /^\p{L}[\p{L} .'-]*$/u
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const AGE_RE = /^\d{1,3}$/
const SALARY_RE = /^\d+(\.\d{1,2})?$/
// 10 digits, first digit 1-9. (phoneno is a Long in the backend, so a leading 0 would be lost.)
const PHONE_RE = /^[1-9]\d{9}$/

export const EMPTY_FORM = { ename: '', age: '', salary: '', gmail: '', phoneno: '' }

/** Returns an object of { fieldName: 'message' }. Empty object = valid. */
export function validateEmployee(values) {
  const errors = {}
  const ename = String(values.ename ?? '').trim()
  const age = String(values.age ?? '').trim()
  const salary = String(values.salary ?? '').trim()
  const gmail = String(values.gmail ?? '').trim()
  const phoneno = String(values.phoneno ?? '').trim()

  if (!ename) errors.ename = 'Name is required.'
  else if (ename.length < LIMITS.nameMin) errors.ename = `Name must be at least ${LIMITS.nameMin} characters.`
  else if (ename.length > LIMITS.nameMax) errors.ename = `Name must be at most ${LIMITS.nameMax} characters.`
  else if (!NAME_RE.test(ename)) errors.ename = 'Name may contain only letters, spaces, . \' and -.'

  if (!age) errors.age = 'Age is required.'
  else if (!AGE_RE.test(age)) errors.age = 'Age must be a whole number.'
  else if (Number(age) < LIMITS.ageMin || Number(age) > LIMITS.ageMax)
    errors.age = `Age must be between ${LIMITS.ageMin} and ${LIMITS.ageMax}.`

  if (!salary) errors.salary = 'Salary is required.'
  else if (!SALARY_RE.test(salary)) errors.salary = 'Salary must be a number with at most 2 decimals.'
  else if (Number(salary) <= 0) errors.salary = 'Salary must be greater than 0.'
  else if (Number(salary) > LIMITS.salaryMax) errors.salary = 'Salary is too large.'

  if (!gmail) errors.gmail = 'Email is required.'
  else if (gmail.length > LIMITS.emailMax) errors.gmail = `Email must be at most ${LIMITS.emailMax} characters.`
  else if (!EMAIL_RE.test(gmail)) errors.gmail = 'Enter a valid email, e.g. name@example.com.'

  if (!phoneno) errors.phoneno = 'Phone number is required.'
  else if (!PHONE_RE.test(phoneno)) errors.phoneno = 'Phone number must be exactly 10 digits and cannot start with 0.'

  return errors
}

/** Validates the search box. mode is 'id' or 'email'. Returns an error string or ''. */
export function validateSearch(mode, rawValue) {
  const value = String(rawValue ?? '').trim()
  if (!value) return mode === 'id' ? 'Enter an employee ID.' : 'Enter an email address.'
  if (mode === 'id') {
    if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 2147483647)
      return 'Employee ID must be a positive whole number.'
  } else if (!EMAIL_RE.test(value)) {
    return 'Enter a valid email, e.g. name@example.com.'
  }
  return ''
}

/**
 * Builds the JSON body for POST/PUT. It NEVER contains eid.
 * Values are converted to the types the Java entity expects:
 * ename String, age Integer, salary Double, gmail String, phoneno Long.
 */
export function toPayload(values) {
  return {
    ename: String(values.ename).trim(),
    age: Number(values.age),
    salary: Number(values.salary),
    gmail: String(values.gmail).trim(),
    phoneno: Number(values.phoneno),
  }
}

/** Employee object from the backend -> string values for the form inputs. */
export function fromEmployee(emp) {
  return {
    ename: emp.ename ?? '',
    age: emp.age ?? '',
    salary: emp.salary ?? '',
    gmail: emp.gmail ?? '',
    phoneno: emp.phoneno ?? '',
  }
}
