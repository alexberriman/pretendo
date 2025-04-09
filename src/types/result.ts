export type Result<T, E = Error> = Success<T> | Failure<E>;

export type Success<T> = {
  readonly ok: true;
  readonly value: T;
};

export type Failure<E> = {
  readonly ok: false;
  readonly error: E;
};

export const ok = <T>(value: T): Success<T> => ({
  ok: true,
  value,
});

export const err = <E>(error: E): Failure<E> => ({
  ok: false,
  error,
});

export const mapResult = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> => (result.ok ? ok(fn(result.value)) : result);

export const flatMapResult = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> => (result.ok ? fn(result.value) : result);

export const getOrElse = <T, E>(result: Result<T, E>, defaultValue: T): T =>
  result.ok ? result.value : defaultValue;

export const getOrThrow = <T, E>(result: Result<T, E>): T => {
  if (result.ok) return result.value;
  throw result.error;
};

export const mapError = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> => (result.ok ? result : err(fn(result.error)));

export const toPromise = async <T, E>(result: Result<T, E>): Promise<T> =>
  result.ok ? Promise.resolve(result.value) : Promise.reject(result.error);
