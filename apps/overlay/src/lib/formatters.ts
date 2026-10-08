const SECONDS_PER_HOUR: number = 3600;
const SECONDS_PER_MINUTE: number = 60;

const compactNumberFormatter: Intl.NumberFormat = new Intl.NumberFormat('es', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatViewCount(viewCount: number): string {
  return `${compactNumberFormatter.format(viewCount)} visitas`;
}

export function formatDuration(totalSeconds: number): string {
  const wholeSeconds: number = Math.max(0, Math.floor(totalSeconds));
  const hours: number = Math.floor(wholeSeconds / SECONDS_PER_HOUR);
  const minutes: number = Math.floor((wholeSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds: string = String(wholeSeconds % SECONDS_PER_MINUTE).padStart(2, '0');

  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
}

export function getPublishYear(isoPublishDate: string): string {
  return isoPublishDate.slice(0, 4);
}
