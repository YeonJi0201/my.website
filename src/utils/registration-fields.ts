export const WEEKDAYS = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

// Birthdays have no birth year; retain February 29 as a valid choice.
export const birthdayDays = (month: number) => [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 31;
export const formatSchoolYear = (year: number) => year === 0 ? '그 외' : `${year}학년`;

export function parseBirthday(value: string) {
  const match = value.match(/^(\d{1,2})월\s*(\d{1,2})일/) ?? value.match(/^(?:\d{4}-)?(\d{1,2})-(\d{1,2})(?:\b|$)/);
  const month = match ? Math.max(1, Math.min(12, Number(match[1]))) : 1;
  const day = match ? Math.max(1, Math.min(birthdayDays(month), Number(match[2]))) : 1;
  return { month, day, weekday: WEEKDAYS.find(day => value.includes(day)) ?? '' };
}

// 생일 표시는 월·일만 사용한다. 예전 기록에 남은 "(월요일)" 같은 요일 표기는 숨긴다.
export const formatBirthday = (value: string) => value.replace(/\s*\(?[월화수목금토일]요일\)?/g, '').trim();
