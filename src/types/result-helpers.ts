import { Result, Failure, Success } from "./result.js";

/**
 * Helper functions for working with the Result type
 */

/**
 * Checks if a Result is an Error
 */
export function isError<T, E>(result: Result<T, E>): result is Failure<E> {
  return !result.ok;
}

/**
 * Checks if a Result is a Success
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.ok;
}

/**
 * Gets the value from a Result or returns null if it's an error
 */
export function getValue<T, E>(result: Result<T, E>): T | null {
  return result.ok ? result.value : null;
}

/**
 * Gets the error from a Result or returns null if it's a success
 */
export function getError<T, E>(result: Result<T, E>): E | null {
  return !result.ok ? result.error : null;
}
