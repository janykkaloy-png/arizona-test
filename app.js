const TEST_COUNT = 15;
const USERS_KEY = "arizona_vp_users";
const ADMIN_PASSWORD = "12345";

const questions = [
  { text: "Что обязаны знать и соблюдать сотрудники Военной полиции?", correct: "устав вп, ук, ак, фп, конституция" },
  { text: "Как должны разговаривать сотрудники военной полиции?", correct: "уважительно в деловом тоне" },
  { text: "При каких условиях сотрудник ВП может покинуть свою ВЧ без формы в рабочее время?", correct: "при выполнении спец.задания от куратора вп" },
  { text: "Что должны иметь при себе сотрудники военной полиции?", correct: "удостоверение и бодикамеру, полное обмундирование" },
  { text: "Что должен делать сотрудник ВП при проверке ВЧ на ЧС?", correct: "проверять состав мо" },
  { text: "Что запрещается сотрудникам ВП при выполнении спец.задачи?", correct: "превышать полномочия" },
  { text: "При каком приказе сотрудник ВП обязан снять маску?", correct: "при приказе руководства" },
  { text: "Каким цветом должен быть автомобиль сотрудника ВП?", correct: "черный серый" },
  { text: "Что можно носить сотруднику ВП?", correct: "часы усы" },
  { text: "Какая приписка в рации департамента?", correct: "вп" },
  { text: "Сколько минимум минут проверять ВЧ на чс?", correct: "3 минуты" },
  { text: "Кому подчиняются сотрудники ВП?", correct: "кур вп, зам кур вп" },
  { text: "Последовательность действий офицера ВП при виде нарушителя?", correct: "остановка, представиться, удостоверение, установка личности, состав надзора" },
  { text: "Какие места помимо ВЧ нужно проверить?", correct: "бар, казино, центральный рынок, автобазар, шахта" },
  { text: "Недельная норма проверок состава ВП?", correct: "3 раза в неделю минимум" }
];

let test = null;

/* --- Helpers --- */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getUsers() { return JSON.parse(localStorage.getItem(USERS_KEY) || "{}"); }

function saveUser(username, score, answers) {
  const users = getUsers();
  users[username] = { score, answers, date: new Date().toLocaleString() };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/* --- UI Init --- */
function initUI() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.tab;
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      if (tabName === "admin") {
        const pwd = prompt("Введите пароль для Админки:");
        if (pwd !== ADMIN_PASSWORD) {
          alert("Неверный пароль!");
          document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
          document.querySelector(".tab[data-tab='test']").classList.add("active");
          render("test");
          return;
        }
      }

      render(tabName);
    });
  });

  const startBtn = document.getElementById("startBtn");
  if (startBtn) startBtn.addEventListener("click", startTest);

  render("test");
}

/* --- Start Test --- */
function startTest() {
  const usernameEl = document.getElementById("username");
  const username = usernameEl.value.trim();
  if (!username) { alert("Введите имя!"); return; }

  // Перемешиваем вопросы для теста
  const shuffledQuestions = shuffleArray([...questions]);

  test = { username, current: 0, answers: {}, shuffledQuestions };
  render("test");
}

/* --- Render --- */
function render(tab) {
  const area = document.getElementById("mainArea");
  if (!area) return;
  if (tab === "admin") renderAdmin(area);
  else renderTest(area);
}

/* --- Test Rendering --- */
function renderTest(area) {
  if (!test) { area.innerHTML = `<h2>Нажмите «Начать тест»</h2>`; return; }
  const q = test.shuffledQuestions[test.current];
  area.innerHTML = `
    <div class="question-box">
      <h3>${test.current + 1}/${TEST_COUNT}: ${q.text}</h3>
      <input type="text" id="answerInput" placeholder="Введите ответ..." value="${(test.answers[test.current] || '')}">
      <div style="margin-top:12px;display:flex;justify-content:flex-end;">
        <button class="btn" id="nextBtn">${test.current < TEST_COUNT - 1 ? "Далее" : "Закончить"}</button>
      </div>
    </div>
  `;

  const input = document.getElementById("answerInput");
  if (input) input.addEventListener("input", e => { test.answers[test.current] = e.target.value.trim().toLowerCase(); });

  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.addEventListener("click", nextQuestion);
}

function nextQuestion() {
  if (!test) return;
  if (test.current < TEST_COUNT - 1) { test.current++; render("test"); }
  else finishTest();
}

function finishTest() {
  if (!test) return;
  let correct = 0;
  test.shuffledQuestions.forEach((q,i) => { if ((test.answers[i]||"") === q.correct.toLowerCase()) correct++; });
  saveUser(test.username, correct, test.answers);

  const area = document.getElementById("mainArea");
  area.innerHTML = `
    <div class="question-box">
      <h2>Тест завершён</h2>
      <p>${escapeHtml(test.username)}, вы ответили правильно на ${correct} из ${TEST_COUNT}</p>
      <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;">
        <button class="btn" id="restartBtn">Пройти снова</button>
      </div>
    </div>
  `;
  const restartBtn = document.getElementById("restartBtn");
  if (restartBtn) restartBtn.addEventListener("click", () => { test=null; render("test"); });
}

/* --- Admin Rendering --- */
function renderAdmin(area) {
  const users = getUsers();
  if (!Object.keys(users).length) { area.innerHTML = `<p>История пуста.</p>`; return; }

  let html = `<h2>История прохождения теста</h2>
  <table>
    <tr><th>Имя</th><th>Дата</th><th>Результат</th></tr>
    ${Object.entries(users).map(([name,u]) => `<tr><td>${escapeHtml(name)}</td><td>${u.date}</td><td>${u.score}/${TEST_COUNT}</td></tr>`).join("")}
  </table>
  <div style="display:flex;gap:8px;margin-top:12px;">
    <button class="btn" id="downloadReport">Скачать отчёт (.docx)</button>
    <button class="btn ghost" id="viewReportBtn">Показать подробный отчёт</button>
  </div>
  <div id="reportArea" class="report" style="display:none;"></div>`;

  area.innerHTML = html;

  const dl = document.getElementById("downloadReport");
  if (dl) dl.addEventListener("click", downloadReport);

  const vr = document.getElementById("viewReportBtn");
  if (vr) vr.addEventListener("click", () => {
    const ra = document.getElementById("reportArea");
    if (!ra) return;
    if (ra.style.display==="none"||ra.style.display==="") {
      ra.style.display="block";
      ra.textContent = buildReportText();
    } else { ra.style.display="none"; }
  });
}

function buildReportText() {
  const users = getUsers();
  let text = "Отчёт по тестированию:\n\n";
  for (const [name,data] of Object.entries(users)) {
    text += `Имя: ${name}\nДата: ${data.date}\nРезультат: ${data.score}/${TEST_COUNT}\n\n`;
    Object.keys(data.answers||{}).forEach(i => {
      const idx = Number(i);
      text += `${idx+1}. ${questions[idx].text}\nОтвет: ${data.answers[i]}\nПравильный: ${questions[idx].correct}\n\n`;
    });
    text += "--------------------------------------\n\n";
  }
  return text;
}

function downloadReport() {
  const text = buildReportText();
  const blob = new Blob([text], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Отчёт_ArizonaRP.docx";
  a.click();
}

/* --- Инициализация --- */
initUI();
