import { lessons } from './lessons.js';
import { icon } from './icons.js';
import { bookIllustration } from './book-art.js';
import { renderBook } from './book-reader.js';
import { storageKey, localDate, normalizeState } from './state.js';
import { createEdgeAudioPlayer } from './audio_edge.js';

document.querySelectorAll('[data-icon]').forEach((element) => { element.innerHTML = icon(element.dataset.icon); });
let storageAvailable = true;
function loadState() {
  try { return normalizeState(JSON.parse(localStorage.getItem(storageKey) || '{}')); }
  catch { storageAvailable = false; return normalizeState({}); }
}
const state = loadState();
function saveState() {
  if (session?.lesson.book && !session.finished) {
    state.bookProgress[session.lesson.id] = { page: session.bookPage, visited: [...session.visitedPages], phase: session.phase, answers: session.bookAnswers, showChinese: session.showChinese };
  }
  try { localStorage.setItem(storageKey, JSON.stringify(state)); }
  catch { if (storageAvailable) toast('浏览器暂时无法保存进度，本次学习仍可继续。'); storageAvailable = false; }
}
let session = null;
let recognition = null;
let toastTimeout;
const main = document.querySelector('#main');
const lessonDialog = document.querySelector('#lesson-dialog');
const helpDialog = document.querySelector('#help-dialog');

const audioPlayer = createEdgeAudioPlayer((message) => {
  const status = lessonDialog.querySelector('[data-audio-status]');
  if (status) status.textContent = message;
  else if (message) toast(message);
});

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => element.classList.remove('visible'), 3500);
}
function sceneCard(lesson) {
  return `<button class="scene-card book-card" data-start="${lesson.id}" aria-label="Read ${lesson.title}"><div class="shelf-cover"><img src="pic/back.png" alt="An illustrated study at night"><div class="shelf-cover-label"><small>ANTOINE DE SAINT-EXUPERY</small><strong>The Little Prince</strong><span>A MAGNIFICENT PICTURE</span></div></div><div class="scene-body"><span class="eyebrow">VOLUME I &middot; CHAPTER 01</span><h3>${lesson.title}</h3><p>Original English &middot; Read & Listen</p><div class="scene-meta">${lesson.pages.length} paragraphs &middot; ${lesson.pages.reduce((total, page) => total + page.lines.length, 0)} sentences${state.completed.includes(lesson.id) ? ' &middot; Completed' : ''}</div><div class="shelf-open"><span>${state.bookProgress[lesson.id] ? 'Continue the story' : 'Open the story'}</span>${icon('arrow')}</div></div></button>`;
}
function renderScenes() {
  const books = lessons.filter((lesson) => lesson.book);
  main.innerHTML = `<section class="intro"><div><span class="eyebrow">YOUR STORYBOOK LIBRARY</span><h1>绘本书架</h1><p>选择一本绘本，开始阅读和听读。阅读位置会自动保存在当前浏览器。</p></div></section><div class="scene-grid library-grid">${books.map((lesson) => sceneCard(lesson, lessons.indexOf(lesson))).join('')}</div>`;
}
function render() {
  renderScenes();
}
function speak(text, rate = 0.85, onEnd) {
  if (recognition) { recognition.abort(); recognition = null; }
  audioPlayer.speak(text, rate, onEnd);
}
function readStory(rate = 0.85, wholeChapter = false) {
  stopMedia();
  const readingSession = session;
  const firstPage = session.bookPage;
  session.sentenceIndex = 0;
  function readSentence() {
    if (session !== readingSession || session.finished || session.phase !== 0) return;
    const page = session.lesson.pages[session.bookPage];
    renderLesson();
    saveState();
    speak(page.lines[session.sentenceIndex][0], rate, () => {
      if (session !== readingSession || session.phase !== 0) return;
      if (session.sentenceIndex + 1 < page.lines.length) {
        session.sentenceIndex += 1;
      } else if (wholeChapter && session.bookPage + 1 < session.lesson.pages.length) {
        session.bookPage += 1;
        session.sentenceIndex = 0;
        session.visitedPages.add(session.bookPage);
      } else {
        return;
      }
      readSentence();
    });
  }
  session.visitedPages.add(firstPage);
  readSentence();
}
function startLesson(id) {
  const lesson = lessons.find((entry) => entry.id === id && entry.book);
  if (!lesson) return;
  stopMedia();
  session = { lesson, phase: 0, phaseSeconds: 0, seconds: 0, paused: false, answered: false, finished: false, lastTick: performance.now(), bookPage: 0, visitedPages: new Set([0]), showChinese: true, bookAnswers: {}, practiceText: lesson.book ? lesson.pages[0].lines[0][0] : lesson.english };
  const progress = state.bookProgress[id];
  if (lesson.book && progress) {
    Object.assign(session, { phase: progress.phase, bookPage: progress.page, visitedPages: new Set(progress.visited), showChinese: progress.showChinese, bookAnswers: { ...progress.answers } });
    session.answered = lesson.quiz.every((question, index) => session.bookAnswers[index] === question.answer);
  }
  lessonDialog.classList.toggle('book-dialog', Boolean(lesson.book));
  document.body.classList.add('reading-book');
  document.querySelector('.app-shell').hidden = true;
  lessonDialog.hidden = false;
  renderLesson();
  lessonDialog.focus();
}
function closeBook() {
  accrueTime();
  stopMedia();
  saveState();
  session = null;
  lessonDialog.hidden = true;
  document.body.classList.remove('reading-book');
  document.querySelector('.app-shell').hidden = false;
  render();
  main.querySelector('[data-start]')?.focus();
}
function renderLesson() {
  lessonDialog.innerHTML = renderBook(session);
  const content = document.createElement('div');
  content.className = 'reader-content';
  const phase = lessonDialog.querySelector('.lesson-phase');
  const status = lessonDialog.querySelector('[data-audio-status]');
  while (phase.nextSibling !== status) content.append(phase.nextSibling);
  phase.after(content);
  lessonDialog.scrollTop = 0;
  updateTimer();
}
function updateTimer() {
  if (!session || session.finished) return;
  const remaining = session.lesson.book ? Math.floor(session.seconds) : Math.max(0, 120 - Math.floor(session.phaseSeconds));
  const timer = document.querySelector('#phase-timer');
  if (timer) timer.textContent = session.paused ? '已暂停' : `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
}
function accrueTime() {
  if (!session) return;
  const now = performance.now();
  const elapsed = Math.min(Math.max((now - session.lastTick) / 1000, 0), 2);
  session.lastTick = now;
  if (session.paused || session.finished || document.hidden || lessonDialog.hidden) return;
  session.seconds += elapsed; session.phaseSeconds += elapsed;
  state.days[localDate()] = Math.min(86400, (state.days[localDate()] || 0) + elapsed);
  updateTimer();
}
function stopMedia() {
  audioPlayer.stop();
  if (recognition) { recognition.abort(); recognition = null; }
}
function finishLesson() {
  accrueTime(); stopMedia(); session.finished = true;
  if (session.lesson.book) delete state.bookProgress[session.lesson.id];
  if (!state.completed.includes(session.lesson.id)) state.completed.push(session.lesson.id);
  saveState();
  const minutes = Math.floor(session.seconds / 60); const seconds = Math.floor(session.seconds % 60);
  lessonDialog.innerHTML = `<div class="complete-screen"><span class="complete-symbol">✓</span><span class="eyebrow">ONE SMALL STEP, WELL DONE.</span><h2 id="lesson-title">${session.lesson.book ? '你读完了第一本英语绘本！' : '今天，你又多会说一句了。'}</h2><p>${session.lesson.book ? `《${session.lesson.title}》<br>已浏览 ${session.lesson.pages.length} 页故事，完成 ${session.lesson.quiz.length} 道读后练习。<br>Read and listen to the chapter again.` : `“${session.lesson.english}”`}<br>本次实际练习 ${minutes} 分 ${seconds} 秒。</p><button class="button primary" data-close>收下这份小进步 ${icon('check')}</button><br><button class="text-link" data-restart="${session.lesson.id}">再练一遍</button></div>`;
  render();
}
function startRecognition() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) { toast('此浏览器不支持语音识别。听示范后自己读一遍，同样有效。'); return; }
  if (recognition) { recognition.stop(); return; }
  if (session.paused) { toast('先恢复练习计时，再试试开口吧。'); return; }
  audioPlayer.stop();
  const result = document.querySelector('#recognition-result');
  const instance = new Recognition(); recognition = instance;
  instance.lang = 'en-US'; instance.interimResults = false; instance.maxAlternatives = 1;
  result.textContent = '正在听，试着说出上面这句话……';
  instance.onresult = (event) => {
    if (result.isConnected) result.textContent = `听到你说：“${event.results[0][0].transcript}”。愿意开口就很棒！可以对照原句再读一遍。`;
  };
  instance.onerror = (event) => {
    if (!result.isConnected) return;
    result.textContent = event.error === 'not-allowed' ? '麦克风权限未开启，可以在网站设置里允许，或直接自己跟读。' : event.error === 'aborted' ? '已停止识别。' : '这次没听清，可能是网络或麦克风问题。自己读一遍也很好。';
  };
  instance.onend = () => { if (recognition === instance) recognition = null; if (result.isConnected && result.textContent.startsWith('正在听')) result.textContent = '这次没有识别到内容，点按钮可以再试一次。'; };
  try { instance.start(); } catch { recognition = null; result.textContent = '暂时无法开启识别，直接跟读也很好。'; }
}
document.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.start) startLesson(button.dataset.start);
});
lessonDialog.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || !session) return;
  if (button.hasAttribute('data-close')) { closeBook(); return; }
  if (button.dataset.restart) { const id = button.dataset.restart; closeBook(); startLesson(id); return; }
  if (session.finished) return;
  handleBookAction(button);
});
function handleBookAction(button) {
  if (button.dataset.storySentence !== undefined) {
    const index = Number(button.dataset.storySentence);
    const page = session.lesson.pages[session.bookPage];
    if (!Number.isInteger(index) || index < 0 || index >= page.lines.length) return true;
    accrueTime(); stopMedia();
    session.sentenceIndex = index;
    renderLesson();
    return true;
  }
  if (button.hasAttribute('data-book-stop')) { stopMedia(); return true; }
  if (button.hasAttribute('data-book-chapter')) { readStory(0.85, true); return true; }
  if (button.hasAttribute('data-book-paragraph')) { readStory(); return true; }
  if (button.dataset.bookSpeak !== undefined) { speak(button.dataset.bookSpeak); return true; }
  if (button.hasAttribute('data-book-slow')) {
    if (session.phase === 0 && session.lesson.englishOnly) { readStory(0.65); return true; }
    speak(session.lesson.pages[session.bookPage].lines.map(([english]) => english).join(' '), 0.65);
    return true;
  }
  if (button.hasAttribute('data-book-translation')) {
    session.showChinese = !session.showChinese;
    button.textContent = session.showChinese ? '隐藏中文' : '显示中文';
    button.setAttribute('aria-pressed', String(session.showChinese));
    lessonDialog.querySelectorAll('.book-translation').forEach((translation) => { translation.hidden = !session.showChinese; });
    return true;
  }
  if (button.dataset.bookPage !== undefined) {
    const pageIndex = Number(button.dataset.bookPage);
    if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= session.lesson.pages.length) return true;
    accrueTime(); stopMedia();
    session.bookPage = pageIndex;
    session.sentenceIndex = 0;
    session.visitedPages.add(pageIndex);
    renderLesson();
    return true;
  }
  if (button.dataset.bookAnswer !== undefined) {
    const questionIndex = Number(button.dataset.bookQuestion);
    const question = session.lesson.quiz[questionIndex];
    if (!question || session.bookAnswers[questionIndex] !== undefined) return true;
    const correct = Number(button.dataset.bookAnswer) === question.answer;
    button.classList.add(correct ? 'correct' : 'wrong');
    const feedback = lessonDialog.querySelector(`[data-book-feedback="${questionIndex}"]`);
    feedback.textContent = correct ? `✓ ${question.explanation}` : '再想一想，也可以返回故事找线索。';
    if (correct) {
      session.bookAnswers[questionIndex] = question.answer;
      lessonDialog.querySelectorAll(`[data-book-question="${questionIndex}"]`).forEach((option) => { option.disabled = true; });
      session.answered = session.lesson.quiz.every((entry, index) => session.bookAnswers[index] === entry.answer);
      lessonDialog.querySelector('[data-next]').disabled = !session.answered;
    }
    return true;
  }
  if (button.hasAttribute('data-book-back') || button.hasAttribute('data-next')) {
    const back = button.hasAttribute('data-book-back');
    if (!back && session.phase === 0 && session.visitedPages.size !== session.lesson.pages.length) return true;
    if (!back && session.phase === 3) { if (session.answered) finishLesson(); return true; }
    if (back && session.phase === 0) return true;
    accrueTime(); stopMedia();
    session.phase = back ? (session.phase === 3 ? 0 : session.phase - 1) : session.phase + 1;
    session.phaseSeconds = 0;
    renderLesson();
    return true;
  }
  return false;
}
lessonDialog.addEventListener('change', (event) => {
  if (event.target.id !== 'book-practice' || !session?.lesson.book) return;
  accrueTime(); stopMedia();
  session.practiceText = event.target.value;
  renderLesson();
  lessonDialog.querySelector('#book-practice').focus();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !lessonDialog.hidden) closeBook();
});
document.querySelector('#help-button').addEventListener('click', () => helpDialog.showModal());
document.querySelector('#close-help').addEventListener('click', () => helpDialog.close());
document.querySelector('#help-start').addEventListener('click', () => helpDialog.close());
window.addEventListener('hashchange', () => { render(); window.scrollTo({ top: 0 }); });
document.addEventListener('visibilitychange', () => {
  if (session) session.lastTick = performance.now();
  if (document.hidden) {
    if (recognition) { recognition.abort(); recognition = null; }
    saveState();
  }
  else if (lessonDialog.hidden) render();
});
window.addEventListener('pagehide', saveState);
setInterval(() => { accrueTime(); if (session && !session.finished) saveState(); }, 1000);
render();
if (!storageAvailable) toast('本地存储不可用或数据异常，当前以临时模式学习。');
if ('serviceWorker' in navigator && ['https:', 'http:'].includes(location.protocol)) navigator.serviceWorker.register('./sw.js').catch(() => {});
