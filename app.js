const TEST_COUNT = 15;
const ADMIN_PASSWORD = "TryToPassTheExam";

const questions = [
  { text: "Что обязаны знать и соблюдать сотрудники Военной полиции?" },
  { text: "Как должны разговаривать сотрудники военной полиции?" },
  { text: "При каких условиях сотрудник ВП может покинуть свою ВЧ без формы в рабочее время?" },
  { text: "Что должны иметь при себе сотрудники военной полиции?" },
  { text: "Что должен делать сотрудник ВП при проверке ВЧ на ЧС, помимо самой проверки?" },
  { text: "Что запрещается сотрудникам ВП при выполнении спец.задачи?" },
  { text: "При каком приказе сотрудник ВП обязан снять маску?" },
  { text: "Каким цветом должен быть автомобиль сотрудника ВП?" },
  { text: "Что можно носить сотруднику ВП?(аксессуары)" },
  { text: "Какая приписка в рации департамента?" },
  { text: "Сколько минимум минут проверять ВЧ на ЧС?" },
  { text: "Кому подчиняются сотрудники ВП?" },
  { text: "Последовательность действий офицера ВП при виде нарушителя?" },
  { text: "Какие места помимо ВЧ нужно проверить?" },
  { text: "Недельная норма проверок от состава ВП?" }
];

let test = null;
let unlockCodes = []; // Одноразовые коды

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// ======= ФУНКЦИИ ДЛЯ ШИФРОВАНИЯ =======
function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
  if (!hex) return new Uint8Array();
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
function cryptoRandomHex(bytesLen) {
  const arr = crypto.getRandomValues(new Uint8Array(bytesLen));
  return bytesToHex(arr);
}

async function deriveKeyFromPassword(password, saltHex) {
  const salt = hexToBytes(saltHex);
  const baseKey = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return key;
}

async function encryptTextWithPassword(plainText, masterCode, saltHex) {
  const key = await deriveKeyFromPassword(masterCode, saltHex);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plainText));
  return `${arrayBufferToBase64(iv)}:${arrayBufferToBase64(ct)}`;
}

async function decryptTextWithPassword(encryptedStr, masterCode, saltHex) {
  const [ivB64, ctB64] = encryptedStr.split(":");
  if (!ivB64 || !ctB64) throw new Error("Формат зашифрованной строки неверен.");
  const iv = new Uint8Array(base64ToArrayBuffer(ivB64));
  const ct = base64ToArrayBuffer(ctB64);
  const key = await deriveKeyFromPassword(masterCode, saltHex);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return decoder.decode(plainBuf);
}

// ======= MASTER CODE =======
function getOrCreateMasterCode() {
  let mc = localStorage.getItem("masterCode");
  let salt = localStorage.getItem("masterCodeSalt");
  if (!mc || !salt) {
    mc = cryptoRandomHex(8);
    salt = cryptoRandomHex(16);
    localStorage.setItem("masterCode", mc);
    localStorage.setItem("masterCodeSalt", salt);
  }
  return { masterCode: mc, saltHex: salt };
}

function setNewMasterCode() {
  const mc = cryptoRandomHex(8);
  const salt = cryptoRandomHex(16);
  localStorage.setItem("masterCode", mc);
  localStorage.setItem("masterCodeSalt", salt);
  return { masterCode: mc, saltHex: salt };
}

// ======= UI И БЛОКИРОВКА =======
let isBlocked = false;
const overlay = document.getElementById("blockOverlay");
const unlockInput = document.getElementById("unlockCodeInput");
const unlockBtn = document.getElementById("overlayUnlockBtn");

function showOverlay() {
  overlay.classList.remove("hidden");
  isBlocked = true;
}

function hideOverlay() {
  overlay.classList.add("hidden");
  isBlocked = false;
}

function setupLocking() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) showOverlay();
  });
  window.addEventListener("blur", () => {
    if (!document.hidden) showOverlay();
  });
}

unlockBtn.addEventListener("click", () => {
  const code = unlockInput.value.trim();
  if (!code) return alert("Введите код!");
  const idx = unlockCodes.indexOf(code);
  if (idx !== -1) {
    unlockCodes.splice(idx, 1);
    hideOverlay();
    alert("Сайт разблокирован!");
  } else {
    alert("Неверный код!");
  }
});

// ======= ИНИЦИАЛИЗАЦИЯ UI =======
function initUI() {
  setupLocking();

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

  const usernameInput = document.getElementById("username");
  if (usernameInput && !document.getElementById("retestNote")) {
    const note = document.createElement("p");
    note.id = "retestNote";
    note.className = "small";
    note.style.marginTop = "4px";
    note.style.color = "#999";
    note.innerHTML = 'Если вы проходите переаттестацию, напишите это рядом с вашим ником:<br><em>Ник на англ. - Переаттестация 1-3</em>';
    usernameInput.parentNode.insertBefore(note, usernameInput.nextSibling);
  }

  const startBtn = document.getElementById("startBtn");
  if (startBtn) startBtn.addEventListener("click", startTest);

  render("test");
}

// ======= ТЕСТ =======
function startTest() {
  const username = (document.getElementById("username") || {}).value || "";
  const name = username.trim();
  if (!name) { alert("Введите имя!"); return; }
  const shuffled = shuffleArray([...questions]).slice(0, TEST_COUNT);
  test = { username: name, current: 0, answers: {}, shuffledQuestions: shuffled };
  renderTest();
}

function render(tab) {
  const area = document.getElementById("mainArea");
  if (!area) return;
  if (tab === "admin") renderAdmin(area);
  else renderTest();
}

function renderTest() {
  const area = document.getElementById("mainArea");
  if (!test) { area.innerHTML = `<h2>Нажмите «Начать тест»</h2>`; return; }
  const q = test.shuffledQuestions[test.current];
  area.innerHTML = `
    <div class="question-box">
      <h3>${test.current + 1}/${TEST_COUNT}: ${escapeHtml(q.text)}</h3>
      <input type="text" id="answerInput" placeholder="Введите ответ..." value="${escapeHtml(test.answers[test.current] || '')}">
      <div style="margin-top:12px;display:flex;justify-content:flex-end;">
        <button class="btn" id="nextBtn">${test.current < TEST_COUNT - 1 ? "Далее" : "Закончить"}</button>
      </div>
    </div>
  `;
  const input = document.getElementById("answerInput");
  input.addEventListener("input", e => { test.answers[test.current] = e.target.value; });
  document.getElementById("nextBtn").addEventListener("click", () => {
    if (test.current < TEST_COUNT - 1) { test.current++; renderTest(); }
    else finishTest();
  });
}

async function finishTest() {
  if (!test) return;
  let reportText = `Тест завершён\nИмя: ${test.username}\n\nОтветы:\n\n`;
  test.shuffledQuestions.forEach((q, i) => {
    const ans = test.answers[i] || "";
    reportText += `${i + 1}. ${q.text}\nОтвет: ${ans}\n\n`;
  });

  const mcObj = getOrCreateMasterCode();
  try {
    const encrypted = await encryptTextWithPassword(reportText, mcObj.masterCode, mcObj.saltHex);
    const filePayload = `ENCv1\n${mcObj.saltHex}\n${test.username}_тест.txt\n${encrypted}`;
    const blob = new Blob([filePayload], { type: "application/octet-stream" });
    saveAs(blob, `${test.username}_тест.enc`);
  } catch (err) {
    console.error("Encryption error:", err);
    alert("Ошибка при шифровании файла.");
    return;
  }

  const area = document.getElementById("mainArea");
  area.innerHTML = `
    <div class="question-box">
      <h2>Тест завершён</h2>
      <p>${escapeHtml(test.username)}, зашифрованный файл сохранён. Отправьте .enc администратору.</p>
      <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;">
        <button class="btn" id="restartBtn">Пройти снова</button>
      </div>
    </div>
  `;
  document.getElementById("restartBtn").addEventListener("click", () => { test = null; renderTest(); });
}

// ======= АДМИНКА =======
function renderAdmin(area) {
  const mcObj = getOrCreateMasterCode();
  area.innerHTML = "";
  const wrapper = document.createElement("div");

  wrapper.innerHTML = `
    <h2>Админка — дешифровка и управление</h2>
    <p>Master unlock code (используется для дешифровки):</p>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
      <div style="background:rgba(255,255,255,0.03);padding:8px;border-radius:6px;min-width:180px;">${escapeHtml(mcObj.masterCode)}</div>
      <button class="btn" id="regenMasterBtn">Сгенерировать новый код</button>
    </div>

    <p>Генерация одноразового кода для разблокировки:</p>
    <button class="btn" id="genUnlockBtn">Сгенерировать код</button>
    <div id="currentUnlockCodes" style="margin-top:8px;color:#0ea5a4;"></div>

    <p>Загрузите .enc файл (формат ENCv1), чтобы дешифровать:</p>
    <input type="file" id="encFileInput" accept=".enc,.txt" />
    <div id="encFileList" style="margin-top:12px;"></div>
    <div id="fileViewer" class="report" style="display:none;margin-top:12px;"></div>

    <div style="margin-top:12px;">
      <button class="btn" id="unlockOverlayBtn">Разблокировать сайт</button>
      <button class="btn" id="clearMasterBtn" style="margin-left:8px;">Удалить master code</button>
    </div>
  `;
  area.appendChild(wrapper);

  // Кнопки
  wrapper.querySelector("#regenMasterBtn").addEventListener("click", () => {
    if (!confirm("Сгенерировать новый master code? Старые файлы не будут дешифроваться старым кодом.")) return;
    const newObj = setNewMasterCode();
    alert("Новый master code: " + newObj.masterCode);
    render("admin");
  });

  wrapper.querySelector("#clearMasterBtn").addEventListener("click", () => {
    if (!confirm("Удалить сохранённый master code?")) return;
    localStorage.removeItem("masterCode");
    localStorage.removeItem("masterCodeSalt");
    alert("Master code удалён.");
    render("admin");
  });

  wrapper.querySelector("#unlockOverlayBtn").addEventListener("click", () => {
    hideOverlay();
    alert("Оверлей скрыт.");
  });

  // Генерация одноразового кода
  wrapper.querySelector("#genUnlockBtn").addEventListener("click", () => {
    const code = cryptoRandomHex(4); // 8 символов
    unlockCodes.push(code);
    const display = wrapper.querySelector("#currentUnlockCodes");
    display.innerHTML = `Текущие коды: ${unlockCodes.join(", ")}`;
    alert("Сгенерирован код: " + code);
  });

  // Дешифровка
  const encFileInput = wrapper.querySelector("#encFileInput");
  const encFileList = wrapper.querySelector("#encFileList");
  const fileViewer = wrapper.querySelector("#fileViewer");

  encFileInput.addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const text = await f.text();
    const parts = text.split("\n");
    if (parts.length < 4 || parts[0].trim() !== "ENCv1") {
      alert("Файл имеет неверный формат. Ожидается ENCv1.");
      return;
    }
    const saltHex = parts[1].trim();
    const origName = parts[2].trim();
    const encryptedStr = parts.slice(3).join("\n").trim();

    encFileList.innerHTML = `
      <div style="background:rgba(255,255,255,0.03);padding:10px;border-radius:8px;">
        <strong>${escapeHtml(origName)}</strong>
        <div style="margin-top:8px;">
          <button class="btn" id="decryptBtn">Дешифровать и открыть</button>
          <button class="btn small" id="downloadRawBtn" style="margin-left:8px;">Скачать .enc</button>
        </div>
      </div>
    `;

    encFileList.querySelector("#downloadRawBtn").addEventListener("click", () => {
      const blob = new Blob([text], { type: "application/octet-stream" });
      saveAs(blob, f.name);
    });

    encFileList.querySelector("#decryptBtn").addEventListener("click", async () => {
      const master = localStorage.getItem("masterCode");
      if (!master) {
        alert("Master code отсутствует. Сначала сгенерируйте его.");
        return;
      }
      try {
        const decrypted = await decryptTextWithPassword(encryptedStr, master, saltHex);
        fileViewer.style.display = "block";
        fileViewer.innerHTML = `<h3>${escapeHtml(origName)}</h3><pre>${escapeHtml(decrypted)}</pre>`;
      } catch (err) {
        alert("Ошибка дешифровки: " + (err.message || ""));
      }
    });
  });
}

// ======= СТАРТ =======
document.addEventListener("DOMContentLoaded", () => {
  try { initUI(); } catch (err) { console.error("init error:", err); alert("Ошибка инициализации — см. консоль."); }
});
