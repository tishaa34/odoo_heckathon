import { clsx, type ClassValue } from 'clsx';

/** Thin wrapper around clsx so components read cleanly. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
