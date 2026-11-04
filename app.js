import { lessons, phaseNames } from './lessons.js';
import { icon } from './icons.js';
import { bookIllustration } from './book-art.js';
import { renderBook, bookPhases } from './book-reader.js';
import { storageKey, localDate, normalizeState, getStreak } from './state.js';
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
let currentPage = 'today';
let currentFilter = 'all';
let session = null;
let recognition = null;
let toastTimeout;
let installPrompt = null;
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
function sceneCard(lesson, index) {
  if (lesson.book) return `<button class="scene-card book-card" data-start="${lesson.id}"><div class="book-card-cover">${bookIllustration('home')}<span class="scene-level">${lesson.level}</span></div><div class="scene-body"><span class="eyebrow">PICTURE BOOK 01</span><h3>${lesson.title}</h3><p>${lesson.englishTitle}</p><div class="scene-meta">${lesson.pages.length} 页故事 · ${lesson.pages.reduce((total, page) => total + page.lines.length, 0)} 句英语 ${state.completed.includes(lesson.id) ? ' · ✓ 已读完' : ''}</div></div></button>`;
  return `<button class="scene-card" data-start="${lesson.id}" aria-label="学习：${lesson.title}"><div class="scene-cover ${lesson.color}"><span class="scene-level">${lesson.level}</span><span class="scene-number">SCENE ${String(index + 1).padStart(2, '0')}</span><span class="scene-emoji" aria-hidden="true">${lesson.emoji}</span></div><div class="scene-body"><h3>${lesson.title}</h3><p>${lesson.subtitle}</p><div class="scene-meta">${icon('clock')} 8 分钟建议练习 <span class="scene-arrow">${icon('arrow')}</span></div></div>${state.completed.includes(lesson.id) ? '<span class="scene-done">✓ 已学过</span>' : ''}</button>`;
}
function weekMarkup() {
  const monday = new Date();
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return ['一', '二', '三', '四', '五', '六', '日'].map((label, index) => {
    const date = new Date(monday); date.setDate(date.getDate() + index);
    const key = localDate(date); const done = state.days[key] > 0;
    return `<div class="week-day ${done ? 'done' : ''} ${key === localDate() ? 'today' : ''}" title="${key}${done ? ' 已练习' : ''}"><span>${label}</span><b>${done ? '✓' : date.getDate()}</b></div>`;
  }).join('');
}
function goalCard() {
  const seconds = state.days[localDate()] || 0;
  const minutes = Math.floor(seconds / 60);
  const circumference = 2 * Math.PI * 60;
  return `<div class="goal-card"><div class="card-heading">今日小目标 <small>DAILY GOAL</small></div><div class="progress-ring" role="img" aria-label="今日已练习 ${minutes} 分钟，目标 8 分钟"><svg viewBox="0 0 142 142"><circle class="ring-track" cx="71" cy="71" r="60"/><circle class="ring-fill" cx="71" cy="71" r="60" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference * (1 - Math.min(seconds / 480, 1))}"/></svg><div class="ring-label"><strong>${minutes}<small> / 8 分钟</small></strong><span>${seconds >= 480 ? '今天的小目标，完成啦' : '给英语留一点点时间'}</span></div></div><p class="goal-caption">${seconds > 0 ? '每一次开口，都在慢慢积累。' : '不必完美，开始就很棒。'}</p><div class="week">${weekMarkup()}</div></div>`;
}
function phraseCard() {
  const phrase = lessons[0];
  return `<div class="daily-phrase"><div class="phrase-top"><span>从绘本里学表达</span><div class="phrase-actions"><button class="icon-button" data-speak="${phrase.id}" aria-label="播放绘本核心句">${icon('sound')}</button><button class="icon-button" data-save="${phrase.id}" aria-label="收藏绘本核心句">${icon(state.saved.includes(phrase.id) ? 'check' : 'bookmark')}</button></div></div><blockquote lang="en">${phrase.english}</blockquote><p>${phrase.chinese}<br>在完整故事中理解，而不只记住一句话。</p></div>`;
}
function renderToday() {
  const lesson = lessons.find((entry) => entry.book);
  main.innerHTML = `<section class="intro"><div><span class="eyebrow">LEARN ENGLISH THROUGH STORIES</span><h1>读一个故事，学会一段英语。</h1><p>初级英语绘本课 · 不再只学一句话，而是在情节中理解、练习和表达。</p></div><span class="streak-badge">${icon('flame')} 连续学习 ${getStreak(state.days)} 天</span></section>
    <div class="dashboard-grid"><div class="dashboard-primary"><section class="book-hero"><div class="book-hero-copy"><span class="small-pill">${lesson.level}</span><p class="eyebrow">${lesson.englishTitle}</p><h2>${lesson.title}</h2><p>${lesson.subtitle}</p><div class="book-badges"><span>${lesson.pages.length} paragraphs</span><span>English only</span><span>${lesson.quiz.length} reading questions</span></div><button class="button primary" data-start="${lesson.id}">${icon('play')} Read Chapter 1 ${icon('arrow')}</button><small>Read at your own pace. Listen to a paragraph or the whole chapter.</small></div><div class="book-hero-art">${bookIllustration('home')}<span>01 / THE LITTLE PRINCE</span></div></section>
    <section><div class="section-heading"><h2>一本绘本，四步真正学会</h2></div><div class="path-card">${bookPhases.map((phase, index) => `<div class="path-step"><span class="path-number">0${index + 1}</span><div><strong>${phase}</strong><small>${['看图理解情节', '词块和句型', '跟读与复述', '理解并迁移'][index]}</small></div></div>${index < 3 ? '<span class="path-separator">→</span>' : ''}`).join('')}</div></section><section><div class="section-heading"><h2>读完这本，你可以</h2><a class="text-link" href="#scenes">绘本书架 ${icon('arrow')}</a></div><div class="book-goals">${lesson.goals.map((goal, index) => `<div><span>0${index + 1}</span><p>${goal}</p></div>`).join('')}</div></section><div class="gentle-note">${icon('leaf')} 第一次看图听故事，第二次学词句，第三次跟读和复述。先理解，再慢慢脱离中文。</div></div><aside class="dashboard-side">${goalCard()}${phraseCard()}${installPrompt ? '<button class="button outline" data-install>安装到手机 / 桌面</button>' : ''}</aside></div>`;
}
function renderScenes() {
  const legacy = currentFilter === 'legacy';
  main.innerHTML = `<section class="intro"><div><span class="eyebrow">YOUR BEGINNER STORYBOOK LIBRARY</span><h1>从第一本英语绘本开始。</h1><p>目前先完成一本入门绘本，围绕同一个故事逐页学习，不用在零散句子之间跳转。</p></div></section><div class="filters" aria-label="课程类型"><button class="filter ${!legacy ? 'active' : ''}" data-filter="all" aria-pressed="${!legacy}">绘本课程 · 1 本</button><button class="filter ${legacy ? 'active' : ''}" data-filter="legacy" aria-pressed="${legacy}">原有单句 · 补充练习</button></div><div class="scene-grid library-grid">${lessons.filter((lesson) => legacy ? !lesson.book : lesson.book).map((lesson) => sceneCard(lesson, lessons.indexOf(lesson))).join('')}</div><div class="gentle-note">${icon('leaf')} ${legacy ? '原有课程保留用于补充复习，主线学习请从绘本开始。' : '初级不等于只学一句话：看图理解完整故事，再学词句、跟读和应用。'}</div>`;
}
function renderWords() {
  const saved = lessons.filter((phrase) => state.saved.includes(phrase.id));
  main.innerHTML = `<section class="intro"><div><span class="eyebrow">WORDS THAT STAY WITH YOU.</span><h1>把想说的话，慢慢收集起来。</h1><p>收藏 ${saved.length} 句 · 点一下小喇叭，让耳朵再熟悉一点。</p></div></section>${saved.length ? saved.map((phrase) => `<article class="word-card"><div><h3>${phrase.english}</h3><p>${phrase.chinese}</p></div><div class="word-actions"><button class="icon-button" data-speak="${phrase.id}" aria-label="播放：${phrase.english}">${icon('sound')}</button><button class="icon-button saved" data-save="${phrase.id}" aria-label="取消收藏：${phrase.english}">${icon('bookmark')}</button><button class="icon-button" data-start="${phrase.id}" aria-label="复习对应课程">${icon('arrow')}</button></div></article>`).join('') : '<div class="empty-state"><span>🌱</span><h2>这里，等着你的第一句话。</h2><p>在课程里点一下“收藏这句”，<br>就可以在这里随时听、随时复习。</p><a class="button primary" href="#scenes">去找一句喜欢的话</a></div>'}`;
}
function renderProgress() {
  const days = Object.entries(state.days).filter(([, seconds]) => seconds > 0).sort(([first], [second]) => second.localeCompare(first));
  const totalSeconds = days.reduce((total, [, seconds]) => total + seconds, 0);
  main.innerHTML = `<section class="intro"><div><span class="eyebrow">SMALL STEPS, REAL PROGRESS.</span><h1>你走过的每一小步，都在这里。</h1><p>不和别人比较，只记录自己的慢慢成长。</p></div></section><div class="stats-grid"><div class="stat-card"><span>累计练习</span><strong>${Math.floor(totalSeconds / 60)} <small>分钟</small></strong><small>按实际练习时间统计</small></div><div class="stat-card"><span>学过的小课</span><strong>${state.completed.length} <small>/ ${lessons.length} 节</small></strong><small>重复练习不会重复计数</small></div><div class="stat-card"><span>连续学习</span><strong>${getStreak(state.days)} <small>天</small></strong><small>每一天的小小坚持</small></div></div><div class="section-heading"><h2>最近的学习足迹</h2><small class="intro-action">仅保存在当前浏览器</small></div>${days.length ? days.slice(0, 30).map(([date, seconds]) => `<div class="history-item"><strong>${date === localDate() ? '今天' : date}</strong><span>练习 ${Math.floor(seconds / 60)} 分 ${Math.floor(seconds % 60)} 秒 ${seconds >= 480 ? ' · 目标达成 ✓' : ' · 小步前进中'}</span></div>`).join('') : '<div class="empty-state"><span>👣</span><h2>第一小步，就从今天开始。</h2><p>给自己 8 分钟，不必准备得很充分。</p><a class="button primary" href="#today">开始今日学习</a></div>'}<div class="gentle-note">${icon('heart')} 完成一课不等于必须学满 8 分钟。你可以随时复习，按自己的真实节奏积累时间。</div>`;
}
function render() {
  const names = { today: '今日学习', scenes: '绘本书架', words: '我的词句', progress: '成长记录' };
  currentPage = Object.hasOwn(names, location.hash.slice(1)) ? location.hash.slice(1) : 'today';
  document.querySelector('#page-name').textContent = names[currentPage];
  document.querySelector('#today-date').textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
  document.querySelectorAll('[data-page]').forEach((element) => {
    const active = element.dataset.page === currentPage;
    element.classList.toggle('active', active);
    if (active) element.setAttribute('aria-current', 'page'); else element.removeAttribute('aria-current');
  });
  ({ today: renderToday, scenes: renderScenes, words: renderWords, progress: renderProgress })[currentPage]();
}
function speak(text, rate = 0.85) {
  if (recognition) { recognition.abort(); recognition = null; }
  audioPlayer.speak(text, rate);
}
function toggleSaved(id) {
  state.saved = state.saved.includes(id) ? state.saved.filter((savedId) => savedId !== id) : [...state.saved, id];
  saveState();
  toast(state.saved.includes(id) ? '已收藏，去「我的词句」可以再听一遍。' : '已取消收藏。');
  if (!lessonDialog.open) render();
  else {
    const button = lessonDialog.querySelector('[data-save]');
    if (button) { button.innerHTML = `${icon(state.saved.includes(id) ? 'check' : 'bookmark')} ${state.saved.includes(id) ? '已收藏' : '收藏这句'}`; button.setAttribute('aria-pressed', String(state.saved.includes(id))); }
  }
}
function audioButtons(lesson) {
  return `<div class="audio-actions"><button class="button primary" data-listen>${icon('sound')} 听一遍</button><button class="button secondary" data-slow>${icon('play')} 慢速听</button><button class="button secondary" data-save="${lesson.id}" aria-pressed="${state.saved.includes(lesson.id)}">${icon(state.saved.includes(lesson.id) ? 'check' : 'bookmark')} ${state.saved.includes(lesson.id) ? '已收藏' : '收藏这句'}</button></div>`;
}
function startLesson(id) {
  const lesson = lessons.find((entry) => entry.id === id);
  if (!lesson) return;
  stopMedia();
  session = { lesson, phase: 0, phaseSeconds: 0, seconds: 0, paused: false, answered: false, finished: false, lastTick: performance.now(), bookPage: 0, visitedPages: new Set([0]), showChinese: true, bookAnswers: {}, practiceText: lesson.book ? lesson.pages[0].lines[0][0] : lesson.english };
  const progress = state.bookProgress[id];
  if (lesson.book && progress) {
    Object.assign(session, { phase: progress.phase, bookPage: progress.page, visitedPages: new Set(progress.visited), showChinese: progress.showChinese, bookAnswers: { ...progress.answers } });
    session.answered = lesson.quiz.every((question, index) => session.bookAnswers[index] === question.answer);
  }
  lessonDialog.classList.toggle('book-dialog', Boolean(lesson.book));
  renderLesson(); lessonDialog.showModal();
}
function renderLesson() {
  const { lesson, phase } = session;
  if (lesson.book) {
    lessonDialog.innerHTML = renderBook(session);
    lessonDialog.scrollTop = 0;
    updateTimer();
    return;
  }
  const speechCard = `<div class="speech-card"><p class="english">${lesson.english}</p><p class="chinese">${lesson.chinese}</p>${audioButtons(lesson)}<p class="feedback" data-audio-status role="status" aria-live="polite"></p></div>`;
  let content;
  if (phase === 0) content = `<h2>先听一听，不用急着记。</h2><p class="lesson-subtitle">想象自己就在这个场景里。听几遍，熟悉声音，再看看中文意思。</p>${speechCard}<p class="feedback">小提示：${lesson.tip}</p>`;
  if (phase === 1) content = `<h2>不背单词，记住小词块。</h2><p class="lesson-subtitle">把句子拆成小块。点小喇叭听声音，再把它们放回原句里。</p>${lesson.chunks.map(([english, chinese], index) => `<div class="word-chunk"><div><strong>${english}</strong><small>${chinese}</small></div><button class="icon-button" data-chunk="${index}" aria-label="播放 ${english}">${icon('sound')}</button></div>`).join('')}${speechCard}`;
  if (phase === 2) content = `<h2>轮到你了，轻轻说出来。</h2><p class="lesson-subtitle">先听示范，再试着跟读 3 遍。只要开口，就已经很棒；不用追求完美。</p>${speechCard}<button class="button outline" data-record>${icon('mic')} 试试语音识别</button><p class="recognition-result" id="recognition-result" role="status">不想开麦也没关系，可以直接对着屏幕读。</p><p class="lesson-subtitle">可选识别由浏览器提供，可能将音频发给其语音服务；结果不是发音评分。</p>`;
  if (phase === 3) content = `<h2>放进生活里，试着接一句。</h2><p class="lesson-subtitle">${lesson.question}</p><div class="quiz-options">${lesson.options.map((option, index) => `<button class="quiz-option" data-answer="${index}">${option}</button>`).join('')}</div><p id="quiz-feedback" class="feedback" role="status">不用猜得快，慢慢读一读。</p><details><summary class="text-link">看看完整的小对话</summary>${lesson.dialogue.map(([speaker, english, chinese]) => `<div class="word-chunk"><div><small>${speaker}</small><strong style="font-size:16px;display:block;margin-top:6px">${english}</strong><small>${chinese}</small></div></div>`).join('')}</details>`;
  lessonDialog.innerHTML = `<div class="lesson-header"><span class="eyebrow">SCENE ${String(lessons.indexOf(lesson) + 1).padStart(2, '0')} · ${lesson.title}</span><button class="icon-button" data-close aria-label="退出练习">×</button></div><div class="lesson-progress" aria-label="第 ${phase + 1} 步，共 4 步">${phaseNames.map((name, index) => `<span class="${index <= phase ? 'done' : ''}" title="${name}"></span>`).join('')}</div><div class="lesson-phase"><span>0${phase + 1} / ${phaseNames[phase]} · 建议 2 分钟</span><button class="timer icon-button" data-pause aria-label="暂停练习计时">${icon('pause')} <span id="phase-timer">02:00</span></button></div><div id="lesson-title">${content}</div><div class="lesson-footer"><span>按自己的节奏，随时进入下一步</span><button class="button primary" data-next ${phase === 3 ? 'disabled' : ''}>${phase === 3 ? '完成小课' : '下一小步'} ${icon('arrow')}</button></div>`;
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
  if (session.paused || session.finished || document.hidden || !lessonDialog.open) return;
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
  if (button.dataset.filter) { currentFilter = button.dataset.filter; renderScenes(); }
  if (button.dataset.speak) { const phrase = lessons.find((entry) => entry.id === button.dataset.speak); if (phrase) speak(phrase.english); }
  if (button.dataset.save) toggleSaved(button.dataset.save);
  if (button.hasAttribute('data-install') && installPrompt) {
    const prompt = installPrompt; installPrompt = null; await prompt.prompt(); render();
  }
});
lessonDialog.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || !session) return;
  if (button.hasAttribute('data-close')) { accrueTime(); lessonDialog.close(); return; }
  if (button.dataset.restart) { const id = button.dataset.restart; lessonDialog.close(); startLesson(id); return; }
  if (session.finished) return;
  if (session.lesson.book && handleBookAction(button)) return;
  if (button.hasAttribute('data-listen')) speak(session.lesson.english);
  if (button.hasAttribute('data-slow')) speak(session.lesson.english, 0.65);
  if (button.dataset.chunk !== undefined) speak(session.lesson.chunks[Number(button.dataset.chunk)][0]);
  if (button.hasAttribute('data-pause')) {
    accrueTime(); session.paused = !session.paused;
    if (session.paused) stopMedia();
    button.setAttribute('aria-label', session.paused ? '恢复练习计时' : '暂停练习计时');
    button.innerHTML = `${icon(session.paused ? 'play' : 'pause')} <span id="phase-timer"></span>`; updateTimer();
  }
  if (button.hasAttribute('data-record')) startRecognition();
  if (button.dataset.answer !== undefined) {
    const correct = Number(button.dataset.answer) === session.lesson.answer;
    button.classList.add(correct ? 'correct' : 'wrong');
    document.querySelector('#quiz-feedback').textContent = correct ? '就是这句！试着大声说一遍，再完成今天的小课。' : '还差一点点。想一想这个场景需要表达什么，再试一次。';
    if (correct) { session.answered = true; lessonDialog.querySelector('[data-next]').disabled = false; lessonDialog.querySelectorAll('[data-answer]').forEach((option) => { option.disabled = true; }); }
  }
  if (button.hasAttribute('data-next')) {
    accrueTime(); stopMedia();
    if (session.phase === 3) { if (session.answered) finishLesson(); }
    else { session.phase += 1; session.phaseSeconds = 0; session.paused = false; renderLesson(); }
  }
});
function handleBookAction(button) {
  if (button.hasAttribute('data-book-stop')) { stopMedia(); return true; }
  if (button.dataset.bookSpeak !== undefined) { speak(button.dataset.bookSpeak); return true; }
  if (button.hasAttribute('data-book-slow')) {
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
lessonDialog.addEventListener('cancel', accrueTime);
lessonDialog.addEventListener('close', () => {
  if (lessonDialog.open) return;
  stopMedia(); saveState(); session = null; render();
});
document.querySelector('#help-button').addEventListener('click', () => helpDialog.showModal());
document.querySelector('#close-help').addEventListener('click', () => helpDialog.close());
document.querySelector('#help-start').addEventListener('click', () => helpDialog.close());
window.addEventListener('hashchange', () => { render(); window.scrollTo({ top: 0 }); });
document.addEventListener('visibilitychange', () => {
  if (session) session.lastTick = performance.now();
  if (document.hidden) { stopMedia(); saveState(); }
  else if (!lessonDialog.open) render();
});
window.addEventListener('pagehide', saveState);
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); installPrompt = event; if (currentPage === 'today' && !lessonDialog.open) renderToday(); });
setInterval(() => { accrueTime(); if (session && !session.finished) saveState(); }, 1000);
render();
if (!storageAvailable) toast('本地存储不可用或数据异常，当前以临时模式学习。');
if ('serviceWorker' in navigator && ['https:', 'http:'].includes(location.protocol)) navigator.serviceWorker.register('./sw.js').catch(() => {});
