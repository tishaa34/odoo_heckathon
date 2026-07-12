import toast from 'react-hot-toast';
import { normalizeError } from '@/services/http';

/** Standard error toast for mutations; returns the normalized error so callers
 *  can also surface field errors on a form. */
export function toastError(error: unknown, fallback = 'Something went wrong.') {
  const norm = normalizeError(error);
  toast.error(norm.message || fallback);
  return norm;
}

export function toastSuccess(message: string) {
  toast.success(message);
}
