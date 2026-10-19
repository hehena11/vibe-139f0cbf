// /my-api-key 화면에서 발급한 API 키를 아래 따옴표 안에 붙여넣어주세요.
// AI 호출 시 개인 크레딧에서 사용한 토큰만큼 차감됩니다.
const API_KEY = "여기에 /my-api-key에서 발급받은 키를 붙여넣으세요";
const API_URL = "https://leapax-lms.vercel.app/api/external/v1/chat/completions";

const emotionList = [
  { emoji: "😊", name: "행복해요" },
  { emoji: "😌", name: "뿌듯해요" },
  { emoji: "✨", name: "설레요" },
  { emoji: "🌿", name: "평온해요" },
  { emoji: "😮‍💨", name: "피곤해요" },
  { emoji: "😟", name: "불안해요" },
  { emoji: "😢", name: "속상해요" },
  { emoji: "😠", name: "화나요" },
  { emoji: "😣", name: "답답해요" },
  { emoji: "🎯", name: "집중됐어요" },
  { emoji: "🔥", name: "의욕적이에요" },
  { emoji: "🫠", name: "무기력해요" }
];

const categoryIcon = {
  건강: "💪",
  공부: "📚",
  업무: "💼",
  생활: "🏠",
  취미: "🎨",
  마음관리: "🌿"
};

const defaultRoutines = [
  { id: 1, name: "물 2L 마시기", category: "건강", target: "2L", days: [0, 1, 2, 3, 4, 5, 6] },
  { id: 2, name: "운동 30분", category: "건강", target: "30분", days: [1, 3, 5] },
  { id: 3, name: "영어 단어 암기", category: "공부", target: "20개", days: [1, 2, 3, 4, 5] },
  { id: 4, name: "하루 회고하기", category: "마음관리", target: "1회", days: [0, 1, 2, 3, 4, 5, 6] }
];

let selectedEmotions = [];
let selectedRoutineDays = [0, 1, 2, 3, 4, 5, 6];
let calendarDate = new Date();
let selectedDate = getDateString(new Date());

function getDateString(date) {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function getStorage(key, fallback) {
  try {
    const stored = localStorage.getItem("godlife_" + key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    return fallback;
  }
}

function setStorage(key, value) {
  localStorage.setItem("godlife_" + key, JSON.stringify(value));
}

function getRoutines() {
  return getStorage("routines", defaultRoutines);
}

function getChecks() {
  return getStorage("checks", {});
}

function getDiaries() {
  return getStorage("diaries", {});
}

function getSchedules() {
  return getStorage("schedules", []);
}

function today() {
  return getDateString(new Date());
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(function () {
    toast.classList.remove("show");
  }, 2500);
}

function showPage(pageName) {
  document.querySelectorAll(".page").forEach(function (page) {
    page.classList.remove("active");
  });

  document.getElementById(pageName).classList.add("active");

  document.querySelectorAll(".page-button").forEach(function (button) {
    button.classList.toggle("active", button.dataset.page === pageName);
  });

  if (pageName === "home") renderHome();
  if (pageName === "record") loadRecordPage();
  if (pageName === "calendar") renderCalendar();
  if (pageName === "routine") renderRoutinePage();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getTodayRoutines() {
  const day = new Date().getDay();
  return getRoutines().filter(function (routine) {
    return routine.days.includes(day);
  });
}

function renderHome() {
  const koreanDate = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date());

  document.getElementById("today-text").textContent = koreanDate;
  document.getElementById("daily-goal").value = localStorage.getItem("godlife_goal") || "";

  const todayRoutines = getTodayRoutines();
  const checks = getChecks();
  const todayChecks = checks[today()] || {};
  const routineList = document.getElementById("home-routine-list");

  if (todayRoutines.length === 0) {
    routineList.innerHTML = '<p class="empty-message">오늘은 등록된 루틴이 없어요.</p>';
  } else {
    routineList.innerHTML = todayRoutines.map(function (routine) {
      const done = Boolean(todayChecks[routine.id]);
      return `
        <label class="routine-row ${done ? "done" : ""}">
          <input class="routine-check" type="checkbox" data-routine-id="${routine.id}" ${done ? "checked" : ""}>
          <span>${categoryIcon[routine.category] || "🌱"}</span>
          <span class="routine-name">${routine.name}${routine.target ? " · " + routine.target : ""}</span>
        </label>
      `;
    }).join("");
  }

  const completeCount = todayRoutines.filter(function (routine) {
    return todayChecks[routine.id];
  }).length;

  const rate = todayRoutines.length ? Math.round((completeCount / todayRoutines.length) * 100) : 0;

  document.getElementById("routine-count").textContent = completeCount + " / " + todayRoutines.length + " 완료";
  document.getElementById("routine-rate").textContent = rate + "%";
  document.getElementById("routine-bar").style.width = rate + "%";

  renderGrowth(rate);
}

function renderGrowth(routineRate) {
  const diaries = getDiaries();
  const recentDates = [];

  for (let index = 0; index < 7; index += 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    recentDates.push(getDateString(date));
  }

  const diaryCount = recentDates.filter(function (date) {
    return Boolean(diaries[date]);
  }).length;

  const recordRate = Math.round((diaryCount / 7) * 100);
  const activityRate = Math.min(100, Math.round((recordRate * 0.55) + (routineRate * 0.45)));

  document.getElementById("record-percent").textContent = recordRate + "%";
  document.getElementById("record-bar").style.width = recordRate + "%";

  document.getElementById("growth-routine-percent").textContent = routineRate + "%";
  document.getElementById("growth-routine-bar").style.width = routineRate + "%";

  document.getElementById("activity-percent").textContent = activityRate + "%";
  document.getElementById("activity-bar").style.width = activityRate + "%";

  let message = "오늘의 작은 기록이 내일의 큰 자신감이 될 거예요.";
  if (recordRate >= 70) message = "꾸준히 기록하고 있어요. 지금의 흐름이 정말 멋져요!";
  if (routineRate >= 80) message = "오늘의 루틴을 멋지게 실천하고 있어요. 정말 잘하고 있어요!";

  document.getElementById("cheer-message").textContent = message;
}

function toggleRoutine(id, checked) {
  const checks = getChecks();
  const date = today();

  if (!checks[date]) checks[date] = {};
  checks[date][id] = checked;

  setStorage("checks", checks);
  renderHome();
}

function renderEmotions() {
  const buttonArea = document.getElementById("emotion-buttons");
  const tagArea = document.getElementById("emotion-tags");

  buttonArea.innerHTML = emotionList.map(function (emotion) {
    const isSelected = selectedEmotions.includes(emotion.name);
    return `
      <button class="emotion-button ${isSelected ? "selected" : ""}" data-emotion="${emotion.name}">
        ${emotion.emoji} ${emotion.name}
      </button>
    `;
  }).join("");

  if (selectedEmotions.length === 0) {
    tagArea.innerHTML = '<span style="color:#8b95a1;font-size:12px;">선택한 감정이 여기에 표시돼요.</span>';
  } else {
    tagArea.innerHTML = selectedEmotions.map(function (emotion) {
      return `<span class="emotion-tag">${emotion} ×</span>`;
    }).join("");
  }
}

function toggleEmotion(emotion) {
  if (selectedEmotions.includes(emotion)) {
    selectedEmotions = selectedEmotions.filter(function (item) {
      return item !== emotion;
    });
  } else {
    if (selectedEmotions.length >= 3) {
      showToast("감정은 최대 3개까지 선택할 수 있어요.");
      return;
    }
    selectedEmotions.push(emotion);
  }

  renderEmotions();
}

function formatDiaryDate() {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date());
}

function loadRecordPage() {
  const diary = getDiaries()[today()];

  document.getElementById("diary-result").classList.add("hidden");

  if (diary) {
    document.getElementById("work-input").value = diary.work || "";
    document.getElementById("keep-input").value = diary.keep || "";
    document.getElementById("problem-input").value = diary.problem || "";
    document.getElementById("try-input").value = diary.try || "";
    document.getElementById("diary-output").value = diary.content || "";
    document.getElementById("diary-date").textContent = formatDiaryDate();
    selectedEmotions = diary.emotions || [];
    document.getElementById("diary-result").classList.remove("hidden");
  } else {
    document.getElementById("work-input").value = "";
    document.getElementById("keep-input").value = "";
    document.getElementById("problem-input").value = "";
    document.getElementById("try-input").value = "";
    document.getElementById("diary-output").value = "";
    selectedEmotions = [];
  }

  renderEmotions();
}

function createBasicDiary(work, emotions, keep, problem, tryText) {
  const emotionSentence = emotions.length
    ? "오늘은 " + emotions.join(", ") + " 기분을 느꼈다."
    : "오늘의 순간과 마음을 천천히 돌아보았다.";

  const keepSentence = keep
    ? "특히 " + keep + " 점은 스스로 칭찬해주고 싶다."
    : "작은 실천도 소중한 기록으로 남겼다.";

  const problemSentence = problem
    ? "한편 " + problem + " 부분은 조금 아쉽게 느껴졌다."
    : "완벽하지 않은 순간도 있었지만, 그 자체로 충분한 하루였다.";

  const trySentence = tryText
    ? "내일은 " + tryText + " 것을 시도해보자."
    : "내일도 나에게 필요한 작은 한 걸음을 이어가보자.";

  return "오늘은 " + work + "\n\n" +
    emotionSentence + " " + keepSentence + "\n\n" +
    problemSentence + "\n\n" +
    trySentence + "\n\n" +
    "오늘의 기록이 내일의 나를 더 단단하게 만들어줄 거야.";
}

async function generateDiary() {
  const work = document.getElementById("work-input").value.trim();
  const keep = document.getElementById("keep-input").value.trim();
  const problem = document.getElementById("problem-input").value.trim();
  const tryText = document.getElementById("try-input").value.trim();

  if (!work) {
    showToast("오늘 한 일을 먼저 적어주세요.");
    document.getElementById("work-input").focus();
    return;
  }

  const button = document.getElementById("generate-diary-button");
  button.disabled = true;
  button.textContent = "AI가 오늘을 정리하고 있어요...";

  let diaryContent = "";
  const hasApiKey = API_KEY && !API_KEY.includes("여기에");

  if (hasApiKey) {
    try {
      const prompt = `
당신은 따뜻하고 부담 없는 한국어 성장 다이어리 도우미입니다.
아래 사용자의 정보를 바탕으로 자연스러운 하루 일기를 작성하세요.
과장하거나 평가하지 말고, 4~5개의 짧은 문단으로 다정하게 작성하세요.

오늘 한 일: ${work}
오늘의 감정: ${selectedEmotions.join(", ") || "기록하지 않음"}
Keep: ${keep || "없음"}
Problem: ${problem || "없음"}
Try: ${tryText || "없음"}
      `.trim();

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + API_KEY
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error("AI 요청 실패");

      const data = await response.json();
      diaryContent = data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : "";
    } catch (error) {
      showToast("AI 연결이 어려워 기본 일기 형식으로 작성했어요.");
    }
  }

  if (!diaryContent) {
    diaryContent = createBasicDiary(work, selectedEmotions, keep, problem, tryText);

    if (!hasApiKey) {
      showToast("API 키를 연결하면 실제 AI 일기를 만들 수 있어요.");
    }
  }

  document.getElementById("diary-output").value = diaryContent;
  document.getElementById("diary-date").textContent = formatDiaryDate();
  document.getElementById("diary-result").classList.remove("hidden");
  document.getElementById("diary-result").scrollIntoView({ behavior: "smooth", block: "start" });

  button.disabled = false;
  button.textContent = "✨ AI 일기 작성하기";
}

function saveDiary() {
  const content = document.getElementById("diary-output").value.trim();

  if (!content) {
    showToast("저장할 일기 내용이 없어요.");
    return;
  }

  const diaries = getDiaries();

  diaries[today()] = {
    content: content,
    work: document.getElementById("work-input").value.trim(),
    keep: document.getElementById("keep-input").value.trim(),
    problem: document.getElementById("problem-input").value.trim(),
    try: document.getElementById("try-input").value.trim(),
    emotions: selectedEmotions
  };

  setStorage("diaries", diaries);
  showToast("오늘의 일기를 곳간에 저장했어요 🌾");
  renderHome();
}

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function openRoutineModal(id) {
  const routines = getRoutines();
  const targetRoutine = id ? routines.find(function (routine) {
    return routine.id === id;
  }) : null;

  document.getElementById("routine-modal-title").textContent = targetRoutine ? "루틴 수정" : "새 루틴 추가";
  document.getElementById("routine-id").value = targetRoutine ? targetRoutine.id : "";
  document.getElementById("routine-name").value = targetRoutine ? targetRoutine.name : "";
  document.getElementById("routine-category").value = targetRoutine ? targetRoutine.category : "건강";
  document.getElementById("routine-target").value = targetRoutine ? targetRoutine.target : "";

  selectedRoutineDays = targetRoutine ? targetRoutine.days.slice() : [0, 1, 2, 3, 4, 5, 6];
  renderDaySelector();
  openModal("routine-modal");
}

function renderDaySelector() {
  document.querySelectorAll("#day-selector button").forEach(function (button) {
    const day = Number(button.dataset.day);
    button.classList.toggle("selected", selectedRoutineDays.includes(day));
  });
}

function saveRoutine() {
  const idText = document.getElementById("routine-id").value;
  const name = document.getElementById("routine-name").value.trim();
  const category = document.getElementById("routine-category").value;
  const target = document.getElementById("routine-target").value.trim();

  if (!name) {
    showToast("루틴 이름을 입력해주세요.");
    return;
  }

  if (selectedRoutineDays.length === 0) {
    showToast("반복 요일을 하나 이상 선택해주세요.");
    return;
  }

  const routines = getRoutines();
  const id = idText ? Number(idText) : null;

  if (!id && routines.length >= 10) {
    showToast("루틴은 최대 10개까지 등록할 수 있어요.");
    return;
  }

  const routineData = {
    id: id || Date.now(),
    name: name,
    category: category,
    target: target,
    days: selectedRoutineDays.slice().sort()
  };

  const index = routines.findIndex(function (routine) {
    return routine.id === id;
  });

  if (index >= 0) {
    routines[index] = routineData;
  } else {
    routines.push(routineData);
  }

  setStorage("routines", routines);
  closeModal("routine-modal");
  renderRoutinePage();
  renderHome();
  showToast(id ? "루틴을 수정했어요." : "새 루틴을 추가했어요 🌱");
}

function deleteRoutine(id) {
  const confirmed = confirm("이 루틴을 삭제할까요?");
  if (!confirmed) return;

  const updatedRoutines = getRoutines().filter(function (routine) {
    return routine.id !== id;
  });

  setStorage("routines", updatedRoutines);
  renderRoutinePage();
  renderHome();
  showToast("루틴을 삭제했어요.");
}

function daysText(days) {
  if (days.length === 7) return "매일";
  if (JSON.stringify(days) === JSON.stringify([1, 2, 3, 4, 5])) return "평일";
  if (JSON.stringify(days) === JSON.stringify([0, 6])) return "주말";

  const names = ["일", "월", "화", "수", "목", "금", "토"];
  return days.map(function (day) {
    return names[day];
  }).join(" · ");
}

function renderRoutinePage() {
  const routines = getRoutines();
  const list = document.getElementById("routine-manage-list");

  if (!routines.length) {
    list.innerHTML = '<div class="card empty-message">아직 등록된 루틴이 없어요.<br>첫 번째 작은 실천을 만들어보세요!</div>';
    return;
  }

  list.innerHTML = routines.map(function (routine) {
    return `
      <article class="manage-item">
        <div class="manage-icon">${categoryIcon[routine.category] || "🌱"}</div>
        <div class="manage-info">
          <strong>${routine.name}</strong>
          <span>${daysText(routine.days)} · ${routine.category}${routine.target ? " · 목표 " + routine.target : ""}</span>
        </div>
        <div class="manage-actions">
          <button class="small-button edit-routine" data-id="${routine.id}">수정</button>
          <button class="small-button delete delete-routine" data-id="${routine.id}">삭제</button>
        </div>
      </article>
    `;
  }).join("");
}

function openScheduleModal() {
  document.getElementById("schedule-name").value = "";
  document.getElementById("schedule-date").value = selectedDate || today();
  document.getElementById("schedule-time").value = "";
  document.getElementById("schedule-category").value = "업무";
  openModal("schedule-modal");
}

function saveSchedule() {
  const name = document.getElementById("schedule-name").value.trim();
  const date = document.getElementById("schedule-date").value;
  const time = document.getElementById("schedule-time").value;
  const category = document.getElementById("schedule-category").value;

  if (!name || !date) {
    showToast("일정 이름과 날짜를 입력해주세요.");
    return;
  }

  const schedules = getSchedules();
  schedules.push({
    id: Date.now(),
    name: name,
    date: date,
    time: time,
    category: category
  });

  setStorage("schedules", schedules);
  selectedDate = date;
  calendarDate = new Date(date + "T00:00:00");

  closeModal("schedule-modal");
  showToast("일정을 저장했어요 📌");

  if (document.getElementById("calendar").classList.contains("active")) {
    renderCalendar();
  }
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const diaries = getDiaries();
  const schedules = getSchedules();

  document.getElementById("calendar-month").textContent = year + "년 " + (month + 1) + "월";

  let calendarHtml = "";

  for (let blank = 0; blank < firstDay; blank += 1) {
    calendarHtml += '<div class="calendar-day empty"></div>';
  }

  for (let day = 1; day <= lastDate; day += 1) {
    const fullDate = getDateString(new Date(year, month, day));
    const daySchedules = schedules.filter(function (schedule) {
      return schedule.date === fullDate;
    });

    const classes = [
      "calendar-day",
      fullDate === today() ? "today" : "",
      fullDate === selectedDate ? "selected" : "",
      diaries[fullDate] ? "has-diary" : ""
    ].join(" ");

    calendarHtml += `
      <button class="${classes}" data-calendar-date="${fullDate}">
        <span class="day-number">${day}</span>
        ${daySchedules.slice(0, 2).map(function (schedule) {
          return '<span class="schedule-dot">• ' + schedule.name + '</span>';
        }).join("")}
      </button>
    `;
  }

  document.getElementById("calendar-days").innerHTML = calendarHtml;
  renderCalendarDetail();
}

function renderCalendarDetail() {
  const selected = new Date(selectedDate + "T00:00:00");
  const schedules = getSchedules()
    .filter(function (schedule) {
      return schedule.date === selectedDate;
    })
    .sort(function (a, b) {
      return (a.time || "99:99").localeCompare(b.time || "99:99");
    });

  const selectedTitle = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(selected);

  document.getElementById("selected-date-label").textContent = selectedDate === today() ? "TODAY" : "SELECTED DATE";
  document.getElementById("selected-date-title").textContent = selectedTitle;

  const scheduleList = document.getElementById("schedule-list");

  if (!schedules.length) {
    scheduleList.innerHTML = '<p class="empty-message" style="text-align:left">등록된 일정이 없어요.</p>';
  } else {
    scheduleList.innerHTML = schedules.map(function (schedule) {
      return `
        <div class="schedule-item">
          <span class="schedule-time">${schedule.time || "하루"}</span>
          <div>
            <strong>${schedule.name}</strong>
            <span class="schedule-category">${schedule.category}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  const diary = getDiaries()[selectedDate];
  const preview = document.getElementById("calendar-diary-preview");

  if (diary) {
    const shortText = diary.content.length > 90
      ? diary.content.slice(0, 90) + "..."
      : diary.content;

    preview.innerHTML = `<div class="diary-preview"><strong>✍️ 이 날의 일기</strong><br>${shortText}</div>`;
  } else {
    preview.innerHTML = "";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  renderHome();
  renderEmotions();

  document.querySelectorAll(".page-button").forEach(function (button) {
    button.addEventListener("click", function () {
      const pageName = button.dataset.page;
      if (pageName) showPage(pageName);
    });
  });

  document.getElementById("save-goal-button").addEventListener("click", function () {
    localStorage.setItem("godlife_goal", document.getElementById("daily-goal").value.trim());
    showToast("오늘의 목표를 저장했어요 🎯");
  });

  document.getElementById("home-routine-list").addEventListener("change", function (event) {
    if (event.target.classList.contains("routine-check")) {
      toggleRoutine(Number(event.target.dataset.routineId), event.target.checked);
    }
  });

  document.getElementById("emotion-buttons").addEventListener("click", function (event) {
    const button = event.target.closest(".emotion-button");
    if (button) toggleEmotion(button.dataset.emotion);
  });

  document.getElementById("generate-diary-button").addEventListener("click", generateDiary);
  document.getElementById("regenerate-button").addEventListener("click", generateDiary);
  document.getElementById("save-diary-button").addEventListener("click", saveDiary);

  document.getElementById("open-routine-button").addEventListener("click", function () {
    openRoutineModal(null);
  });

  document.getElementById("save-routine-button").addEventListener("click", saveRoutine);

  document.getElementById("day-selector").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-day]");
    if (!button) return;

    const day = Number(button.dataset.day);

    if (selectedRoutineDays.includes(day)) {
      selectedRoutineDays = selectedRoutineDays.filter(function (item) {
        return item !== day;
      });
    } else {
      selectedRoutineDays.push(day);
    }

    renderDaySelector();
  });

  document.getElementById("routine-manage-list").addEventListener("click", function (event) {
    const editButton = event.target.closest(".edit-routine");
    const deleteButton = event.target.closest(".delete-routine");

    if (editButton) openRoutineModal(Number(editButton.dataset.id));
    if (deleteButton) deleteRoutine(Number(deleteButton.dataset.id));
  });

  document.getElementById("open-schedule-button").addEventListener("click", openScheduleModal);
  document.getElementById("open-schedule-from-home").addEventListener("click", openScheduleModal);
  document.getElementById("save-schedule-button").addEventListener("click", saveSchedule);

  document.getElementById("previous-month").addEventListener("click", function () {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById("next-month").addEventListener("click", function () {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  });

  document.getElementById("calendar-days").addEventListener("click", function (event) {
    const button = event.target.closest("[data-calendar-date]");
    if (!button) return;

    selectedDate = button.dataset.calendarDate;
    renderCalendar();
  });

  document.querySelectorAll(".close-modal").forEach(function (button) {
    button.addEventListener("click", function () {
      closeModal(button.dataset.modal);
    });
  });

  document.querySelectorAll(".modal").forEach(function (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal(modal.id);
    });
  });
});