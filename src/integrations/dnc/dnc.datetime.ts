const DNC_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export function formatDncDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DNC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${pick('day')}/${pick('month')}/${pick('year')} ${pick('hour')}:${pick('minute')}:${pick('second')}`;
}
