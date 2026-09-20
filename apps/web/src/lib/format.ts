import { formatINR, distanceLabel, travelEstimate } from '@gsv/types';

export { formatINR, distanceLabel };

export function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateShort(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function travelText(meters: number | null | undefined): string {
  if (meters == null) return 'Distance on request';
  const t = travelEstimate(meters);
  return `${distanceLabel(meters)} · ${t.walkMin} min walk · ${t.driveMin} min drive`;
}

export function statusTone(status: string): string {
  switch (status) {
    case 'CONFIRMED':
    case 'APPROVED':
    case 'COMPLETED':
    case 'CAPTURED':
      return 'bg-kerala-100 text-kerala-700';
    case 'PENDING':
    case 'UNDER_REVIEW':
    case 'INITIATED':
      return 'bg-gold-100 text-gold-800';
    case 'REJECTED':
    case 'CANCELLED':
    case 'FAILED':
    case 'SUSPENDED':
    case 'NO_SHOW':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-temple-100 text-temple-700';
  }
}
