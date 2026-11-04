import { lessons } from './lessons.js';

export const storageKey = 'little-steps-english-v1';
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export function normalizeState(stored) {
  const input = stored && typeof stored === 'object' ? stored : {};
  const knownIds = lessons.map((lesson) => lesson.id);
  const validIds = (values) => Array.isArray(values) ? [...new Set(values.filter((id) => knownIds.includes(id)))] : [];
  const days = input.days && typeof input.days === 'object' && !Array.isArray(input.days) ? input.days : {};
  const bookProgress = {};
  for (const lesson of lessons.filter((entry) => entry.book)) {
    const progress = input.bookProgress?.[lesson.id];
    if (!progress || typeof progress !== 'object') continue;
    const page = Number.isInteger(progress.page) && progress.page >= 0 && progress.page < lesson.pages.length ? progress.page : 0;
    const visited = [...new Set([0, page, ...(Array.isArray(progress.visited) ? progress.visited.filter((index) => Number.isInteger(index) && index >= 0 && index < lesson.pages.length) : [])])];
    const phase = visited.length === lesson.pages.length && Number.isInteger(progress.phase) && progress.phase >= 0 && progress.phase <= 3 ? progress.phase : 0;
    const answers = Object.fromEntries(lesson.quiz.flatMap((question, index) => progress.answers?.[index] === question.answer ? [[index, question.answer]] : []));
    bookProgress[lesson.id] = { page, visited, phase, answers, showChinese: progress.showChinese !== false };
  }
  return {
    completed: validIds(input.completed),
    saved: validIds(input.saved),
    bookProgress,
    days: Object.fromEntries(Object.entries(days).filter(([date, seconds]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(seconds) && seconds >= 0 && seconds <= 86400)),
  };
}
export function getStreak(days, today = new Date()) {
  const cursor = new Date(today);
  let total = 0;
  if (!(days[localDate(cursor)] > 0)) cursor.setDate(cursor.getDate() - 1);
  while (days[localDate(cursor)] > 0) { total += 1; cursor.setDate(cursor.getDate() - 1); }
  return total;
}
