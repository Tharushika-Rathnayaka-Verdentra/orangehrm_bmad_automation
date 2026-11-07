import { randomBytes } from 'node:crypto';

/** Short, URL/name-safe token so data created on the shared demo never collides across reruns. */
export function uniqueSuffix(length = 6): string {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

export interface EmployeeName {
  firstName: string;
  lastName: string;
  /** `firstName lastName`, as OrangeHRM renders it in headers and tables. */
  fullName: string;
}

export function uniqueEmployeeName(prefix = 'Auto'): EmployeeName {
  const suffix = uniqueSuffix();
  const firstName = `${prefix}${suffix}`;
  const lastName = `Tester${suffix}`;
  return { firstName, lastName, fullName: `${firstName} ${lastName}` };
}

/**
 * Numeric Employee Id (max 10 chars in OrangeHRM). The auto-filled id is identical for everyone
 * who opens the Add form at the same moment on the shared demo, so we always supply our own.
 */
export function uniqueEmployeeId(): string {
  const time = Date.now().toString().slice(-7);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `${time}${random}`;
}
