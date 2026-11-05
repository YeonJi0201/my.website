import { test } from 'node:test';
import assert from 'node:assert/strict';
import { birthdayDays, parseBirthday, formatSchoolYear } from '../src/utils/registration-fields.ts';
import { validCharacter } from './api.ts';
import { INITIAL_CHARACTERS } from '../src/data/initialCharacters.ts';

test('birthday selections preserve existing dates and weekdays, including leap day', () => {
  assert.deepEqual(parseBirthday('10월 24일'), { month: 10, day: 24, weekday: '' });
  assert.deepEqual(parseBirthday('2월 29일 (월요일)'), { month: 2, day: 29, weekday: '월요일' });
  assert.deepEqual(parseBirthday('2000-12-31'), { month: 12, day: 31, weekday: '' });
  assert.equal(birthdayDays(4), 30);
  assert.equal(birthdayDays(2), 29);
  assert.equal(birthdayDays(12), 31);
  assert.equal(parseBirthday('4월 31일').day, 30);
});

test('other school year is valid for new records, with existing years preserved', () => {
  const character = { ...INITIAL_CHARACTERS[0], year: 0, birthday: '2월 29일 (월요일)' };
  assert.equal(validCharacter(character), true);
  assert.equal(validCharacter({ ...character, year: -1 }), false);
  assert.equal(validCharacter({ ...character, year: 8 }), false);
  assert.equal(validCharacter({ ...character, year: 2 }), true);
  assert.equal(formatSchoolYear(0), '그 외');
  assert.equal(formatSchoolYear(1), '1학년');
  assert.equal(formatSchoolYear(4), '4학년');
  assert.equal(formatSchoolYear(7), '7학년');
});
