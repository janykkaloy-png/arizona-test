// === НАСТРОЙКИ ===
const TEST_COUNT = 15;
const ADMIN_PASSWORD = "12345";

// === СПИСОК ВОПРОСОВ ===
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

// === ВСПОМОГАТЕЛЬНЫЕ ===
function shuffleArray(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function escapeHtml(str){
  if(typeof str!=="string") return str;
  return str.replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

// === ИНИЦИАЛИЗАЦИЯ ===
function initUI(){
  document.querySelectorAll(".tab").forEach(tab=>{
    tab.addEventListener("click",()=>{
      const tabName=tab.dataset.tab;
      document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      tab.classList.add("active");

      if(tabName==="admin"){
        const pwd=prompt("Введите пароль для Админки:");
        if(pwd!==ADMIN_PASSWORD){
          alert("Неверный пароль!");
          document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
          document.querySelector(".tab[data-tab='test']").classList.add("active");
          render("test");
          return;
        }
      }

      render(tabName);
    });
  });

  const usernameInput = document.getElementById("username");
  const note = document.createElement("p");
  note.className = "small";
  note.style.marginTop = "4px";
  note.style.color = "#999";
  note.innerHTML = 'Если вы проходите переаттестацию, напишите это рядом с вашим ником:<br><em>Ник на англ. - Переаттестация 1-3</em>';
  usernameInput.parentNode.insertBefore(note, usernameInput.nextSibling);

  document.getElementById("startBtn").addEventListener("click", startTest);
  render("test");
}

// === СТАРТ ТЕСТА ===
function startTest(){
  const username=document.getElementById("username").value.trim();
  if(!username){alert("Введите имя!"); return;}

  const shuffledQuestions=shuffleArray([...questions]).slice(0,TEST_COUNT);
  test={username,current:0,answers:{},shuffledQuestions};
  renderTest();
}

// --- РЕНДЕР ---
function render(tab){
  const area=document.getElementById("mainArea");
  if(!area) return;
  if(tab==="admin") renderAdmin(area);
  else renderTest();
}

// --- ТЕСТ ---
function renderTest(){
  const area=document.getElementById("mainArea");
  if(!test){ area.innerHTML=`<h2>Нажмите «Начать тест»</h2>`; return; }

  const q=test.shuffledQuestions[test.current];
  area.innerHTML=`
    <div class="question-box">
      <h3>${test.current+1}/${TEST_COUNT}: ${q.text}</h3>
      <input type="text" id="answerInput" placeholder="Введите ответ..." value="${test.answers[test.current]||''}">
      <div>
        <button class="btn" id="nextBtn">${test.current<TEST_COUNT-1?"Далее":"Закончить"}</button>
      </div>
    </div>
  `;
  document.getElementById("answerInput").addEventListener("input",e=>{
    test.answers[test.current]=e.target.value.trim().toLowerCase();
  });
  document.getElementById("nextBtn").addEventListener("click",nextQuestion);
}

function nextQuestion(){
  if(!test) return;
  if(test.current<TEST_COUNT-1){ test.current++; renderTest();}
  else finishTest();
}

// --- ЗАВЕРШЕНИЕ ТЕСТА ---
function finishTest(){
  if(!test) return;

  let reportText=`Тест завершён\nИмя: ${test.username}\n\nОтветы:\n`;
  test.shuffledQuestions.forEach((q,i)=>{
    const ans=test.answers[i]||"";
    reportText+=`${i+1}. ${q.text}\nВаш ответ: ${ans}\nПравильный: ${q.correct}\n\n`;
  });

  const blob=new Blob([reportText],{type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
  saveAs(blob,`${test.username}_тест.docx`);

  const area=document.getElementById("mainArea");
  area.innerHTML=`
    <div class="question-box">
      <h2>Тест завершён</h2>
      <p>${escapeHtml(test.username)}, скачайте файл и отправьте администратору.</p>
      <div>
        <button class="btn" id="restartBtn">Пройти снова</button>
      </div>
    </div>
  `;
  document.getElementById("restartBtn").addEventListener("click",()=>{ test=null; renderTest(); });
}

// --- АДМИН ---
function renderAdmin(area){
  area.innerHTML=`
    <h2>Админка — Загрузка результатов</h2>
    <p>Здесь можно загрузить файлы пользователей, посмотреть ответы, отметить пройденные тесты или удалить файл.</p>

    <input type="file" id="fileInput" multiple style="display:none;">
    <button class="btn" id="chooseFileBtn">Выбрать файл</button>

    <ul id="fileList"></ul>

    <div id="fileViewer" style="display:none;"></div>
    <button class="btn" id="clearAllBtn">Удалить все записи</button>
  `;

  const fileInput = document.getElementById("fileInput");
  const chooseFileBtn = document.getElementById("chooseFileBtn");
  const fileList = document.getElementById("fileList");
  const fileViewer = document.getElementById("fileViewer");
  let savedFiles = JSON.parse(localStorage.getItem("adminFiles") || "[]");

  chooseFileBtn.addEventListener("click", ()=> fileInput.click());

  fileInput.addEventListener("change", e=>{
    const files = e.target.files;
    Array.from(files).forEach(file=>{
      const reader = new FileReader();
      reader.onload = function(evt){
        savedFiles.push({name:file.name, passed:false, content:evt.target.result});
        localStorage.setItem("adminFiles", JSON.stringify(savedFiles));
        renderFiles();
      };
      reader.readAsText(file);
    });
    fileInput.value="";
  });

  function renderFiles(){
    fileList.innerHTML = savedFiles.map((f,i)=>`
      <li>
        <strong>${escapeHtml(f.name)}</strong>
        <input type="checkbox" ${f.passed?"checked":""} data-index="${i}" class="passCheckbox"> Пройден
        <button class="btn small openBtn" data-index="${i}">Открыть</button>
        <button class="btn small delBtn" data-index="${i}">Удалить</button>
      </li>
    `).join("");

    document.querySelectorAll(".passCheckbox").forEach(cb=>{
      cb.addEventListener("change", e=>{
        const idx = e.target.dataset.index;
        savedFiles[idx].passed = e.target.checked;
        localStorage.setItem("adminFiles", JSON.stringify(savedFiles));
      });
    });

    document.querySelectorAll(".openBtn").forEach(btn=>{
      btn.addEventListener("click", e=>{
        const idx = e.target.dataset.index;
        const content = savedFiles[idx].content || "";
        fileViewer.innerHTML = `<pre>${escapeHtml(content)}</pre><button class="btn" id="closeViewerBtn">Закрыть документ</button>`;
        fileViewer.style.display = "block";

        document.getElementById("closeViewerBtn").addEventListener("click", ()=>{
          fileViewer.style.display = "none";
        });
      });
    });

    document.querySelectorAll(".delBtn").forEach(btn=>{
      btn.addEventListener("click", e=>{
        const idx = e.target.dataset.index;
        if(confirm(`Удалить файл ${savedFiles[idx].name}?`)){
          savedFiles.splice(idx,1);
          localStorage.setItem("adminFiles", JSON.stringify(savedFiles));
          renderFiles();
          fileViewer.style.display = "none";
        }
      });
    });
  }

  renderFiles();

  document.getElementById("clearAllBtn").addEventListener("click", ()=>{
    if(confirm("Удалить все записи?")){
      savedFiles = [];
      localStorage.removeItem("adminFiles");
      renderFiles();
      fileViewer.style.display = "none";
    }
  });
}

// === СТАРТ ===
initUI();