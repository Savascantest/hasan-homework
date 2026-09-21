const app = document.querySelector('#app');
const dateLabel = (date) => new Intl.DateTimeFormat('en-GB', { day:'numeric', month:'long', year:'numeric' }).format(new Date(`${date}T12:00:00`));
const qs = new URLSearchParams(location.search);
const escape = (value) => String(value).replace(/[&<>"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));

async function loadArchive() {
  const response = await fetch('./homeworks/index.json');
  if (!response.ok) throw new Error('The homework archive is unavailable right now.');
  return response.json();
}
function archive(packages) {
  const renderLessons = (items) => `<div class="library-list">${items.length ? items.map((item, index) => `<a class="library-row" href="?package=${encodeURIComponent(item.id)}"><span class="lesson-number">${String(index + 1).padStart(2,'0')}</span><div><p class="lesson-date">${dateLabel(item.date)}</p><h2>${escape(item.title)}</h2></div><span class="card-cta">Open <span aria-hidden="true">→</span></span></a>`).join('') : '<p class="no-results">No lessons match that search.</p>'}</div>`;
  app.innerHTML = `<section class="library" aria-label="Homework library"><div class="library-head"><div><p class="archive-label">Homework library</p><h2>All lessons</h2><p class="support">New lessons will appear here, newest first.</p></div><label class="lesson-search">Search lessons<input type="search" placeholder="Search by topic or date" aria-label="Search lessons"></label></div><p class="lesson-count">${packages.length} lesson${packages.length === 1 ? '' : 's'} available</p><div class="library-results">${renderLessons(packages)}</div></section>`;
  const search = document.querySelector('.lesson-search input'); const results = document.querySelector('.library-results');
  search.addEventListener('input', () => {
    const term = search.value.trim().toLocaleLowerCase();
    const matches = packages.filter((item) => `${item.title} ${item.date}`.toLocaleLowerCase().includes(term));
    results.innerHTML = renderLessons(matches);
  });
}
function keyFor(pkg) { return `hasan-homework:${pkg.id}`; }
function getState(pkg) { try { return JSON.parse(localStorage.getItem(keyFor(pkg))) || {answers:{}}; } catch { return {answers:{}}; } }
function saveState(pkg, state) { localStorage.setItem(keyFor(pkg), JSON.stringify(state)); }
function answerMarkup(question, answer, attribute) {
  return `<div class="exercise-question"><p><b>${escape(question.prompt)}</b></p><div class="quiz-options">${question.choices.map((choice,index) => {
    const style = answer ? (index === question.answerIndex ? ' correct' : answer.choice === index ? ' wrong' : '') : '';
    return `<button class="quiz-option${style}" ${attribute}="${escape(question.id)}" data-answer="${index}" ${answer?.correct ? 'disabled' : ''} type="button">${escape(choice)}</button>`;
  }).join('')}</div><p class="feedback ${answer?.correct ? 'good' : answer ? 'bad' : ''}">${answer ? `${answer.correct ? 'Correct. ' : 'Not quite — try another answer. '}${escape(question.explanation)}` : ''}</p></div>`;
}
function sectionHtml(section) {
  const base = `<section class="section" id="${escape(section.id)}"><h3>${escape(section.label)}</h3>`;
  const intro = section.intro ? `<p class="support section-intro">${escape(section.intro)}</p>` : '';
  if (section.type === 'cards') return `${base}${intro}<div class="cards">${section.items.map((item) => `<button class="flash-card" type="button" aria-pressed="false"><span class="flash-front"><b>${escape(item.term)}</b><small>Turn card</small></span><span class="flash-back"><b>${escape(item.translation)}</b><span>${escape(item.explanation)}</span><em>${escape(item.example)}</em></span></button>`).join('')}</div></section>`;
  if (section.type === 'grammar') return `${base}${intro}<div class="grammar-grid">${section.rules.map((rule) => `<article class="grammar-rule"><h4>${escape(rule.label)}</h4><p>${escape(rule.body)}</p><ul>${rule.examples.map((example) => `<li>${escape(example)}</li>`).join('')}</ul></article>`).join('')}</div></section>`;
  if (section.type === 'practice') return `${base}${intro}<div class="exercise-list">${section.questions.map((question) => `<div class="exercise-slot" data-exercise-slot="${escape(question.id)}"></div>`).join('')}</div></section>`;
  if (section.type === 'reading') return `${base}<div class="reading">${escape(section.body)}</div><p class="support">${escape(section.prompt)}</p><div class="exercise-list">${section.questions.map((question) => `<div class="exercise-slot" data-exercise-slot="${escape(question.id)}"></div>`).join('')}</div></section>`;
  if (section.type === 'external-listening') return `${base}<p>${escape(section.body)}</p><a class="external-source" href="${escape(section.sourceUrl)}" target="_blank" rel="noopener">Open ${escape(section.sourceLabel)} <span aria-hidden="true">↗</span></a><div class="exercise-list">${section.questions.map((question) => `<div class="exercise-slot" data-exercise-slot="${escape(question.id)}"></div>`).join('')}</div></section>`;
  return `${base}</section>`;
}
function packagePage(pkg) {
  const state = getState(pkg); let question = 0;
  const allExercises = pkg.sections.flatMap((section) => section.questions || []);
  const allQuestions = [...allExercises, ...pkg.quiz];
  const sectionBy = (predicate) => pkg.sections.filter(predicate).map(sectionHtml).join('');
  const tabs = [
    {id:'notes', label:'Lesson notes', html:`<section class="section lesson-notes-section"><p class="eyebrow">Lesson notes</p><h3>What to focus on</h3><div class="lesson-notes">${pkg.lessonNotes.map(note => `<div class="note">${escape(note)}</div>`).join('')}</div></section>`},
    {id:'grammar', label:'Grammar', html:sectionBy((section) => section.type === 'grammar' || section.id.startsWith('grammar-'))},
    {id:'vocabulary', label:'Vocabulary', html:sectionBy((section) => section.type === 'cards' || section.id.startsWith('vocabulary-'))},
    {id:'listening', label:'Listening', html:sectionBy((section) => section.type === 'external-listening')},
    {id:'reading', label:'Reading', html:sectionBy((section) => section.type === 'reading')},
    {id:'quiz', label:'Final quiz', html:'<section class="section quiz"><p class="eyebrow">Final quiz</p><h3>Grammar and vocabulary review</h3><p class="support">Use this final check after you have completed the grammar and vocabulary tabs.</p><div class="question"></div><div class="quiz-nav"><button class="previous secondary" type="button">Back</button><button class="next" type="button">Next</button></div></section>'}
  ];
  app.innerHTML = `<a class="back" href="./">← All lessons</a><header class="package-head"><div><p class="eyebrow">Lesson practice</p><h2>${escape(pkg.title)}</h2></div><p class="package-date">${dateLabel(pkg.date)}</p></header><div class="workspace"><div class="content-stack"><nav class="lesson-tabs" role="tablist" aria-label="Lesson sections">${tabs.map((tab, index) => `<button role="tab" id="tab-${tab.id}" aria-selected="${index === 0}" aria-controls="panel-${tab.id}" data-tab="${tab.id}" type="button">${escape(tab.label)}</button>`).join('')}</nav><div class="tab-panels">${tabs.map((tab, index) => `<div class="tab-panel" id="panel-${tab.id}" role="tabpanel" aria-labelledby="tab-${tab.id}" ${index ? 'hidden' : ''}>${tab.html}</div>`).join('')}</div></div><aside class="progress-panel"><h3>Your local progress</h3><p>Work through each section. Your answers stay only on this browser.</p><div class="progress-bar"><i></i></div><div class="progress-label"><span>Correct answers</span><b></b></div><button class="reset-progress secondary" type="button">Reset this lesson</button></aside></div>`;
  const updateProgress = () => { const done = allQuestions.filter((item) => state.answers[item.id]?.correct).length; document.querySelector('.progress-bar i').style.width = `${Math.round(done / allQuestions.length * 100)}%`; document.querySelector('.progress-label b').textContent = `${done}/${allQuestions.length}`; };
  const renderExercise = (item) => { const slot = document.querySelector(`[data-exercise-slot="${item.id}"]`); if (slot) slot.innerHTML = answerMarkup(item, state.answers[item.id], 'data-exercise'); };
  const bindExercises = () => document.querySelectorAll('[data-exercise]').forEach((button) => button.addEventListener('click', () => { const item = allExercises.find((exercise) => exercise.id === button.dataset.exercise); state.answers[item.id] = {choice:Number(button.dataset.answer), correct:Number(button.dataset.answer) === item.answerIndex}; saveState(pkg, state); renderExercise(item); bindExercises(); updateProgress(); }));
  allExercises.forEach(renderExercise); bindExercises();
  document.querySelectorAll('.flash-card').forEach((card) => card.addEventListener('click', () => { const revealed = card.classList.toggle('revealed'); card.setAttribute('aria-pressed', String(revealed)); }));
  document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { const selected = button.dataset.tab; document.querySelectorAll('[data-tab]').forEach((tab) => tab.setAttribute('aria-selected', String(tab === button))); document.querySelectorAll('.tab-panel').forEach((panel) => { panel.hidden = panel.id !== `panel-${selected}`; }); button.focus(); }));
  const renderQuestion = () => { const q = pkg.quiz[question]; document.querySelector('.question').innerHTML = `<p class="support">Question ${question + 1} of ${pkg.quiz.length}</p>${answerMarkup(q, state.answers[q.id], 'data-final')}`; document.querySelector('.previous').disabled = question === 0; document.querySelector('.next').textContent = question === pkg.quiz.length - 1 ? 'Finish' : 'Next'; document.querySelectorAll('[data-final]').forEach((button) => button.addEventListener('click', () => { state.answers[q.id] = {choice:Number(button.dataset.answer), correct:Number(button.dataset.answer) === q.answerIndex}; saveState(pkg, state); renderQuestion(); updateProgress(); })); };
  document.querySelector('.previous').addEventListener('click', () => { question = Math.max(0, question - 1); renderQuestion(); });
  document.querySelector('.next').addEventListener('click', () => { if (question < pkg.quiz.length - 1) { question += 1; renderQuestion(); } else document.querySelector('.quiz').scrollIntoView({behavior:'smooth'}); });
  document.querySelector('.reset-progress').addEventListener('click', () => { localStorage.removeItem(keyFor(pkg)); packagePage(pkg); });
  renderQuestion(); updateProgress();
}
try { const {packages} = await loadArchive(); const requested = qs.get('package'); if (!requested) archive(packages); else { const item = packages.find(pkg => pkg.id === requested); if (!item) throw new Error('That lesson was not found.'); const response = await fetch(`./homeworks/${item.path}`); if (!response.ok) throw new Error('That lesson could not be opened.'); packagePage(await response.json()); } } catch (error) { app.innerHTML = `<p class="loading">${escape(error.message)}</p><a class="back" href="./">← Back to lessons</a>`; }
