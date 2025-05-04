const apiURL = "https://api.aladhan.com/v1/timingsByCity?city=Marseille&country=France&method=3";
const adhanAudio = document.getElementById("adhan-audio");
const notifAudio = document.getElementById("notif-audio");

let soundEnabled = true;
document.getElementById("toggle-sound").addEventListener("change", (e) => {
  soundEnabled = e.target.checked;
});

let prayerTimeMap = {};
let nextPrayerName = null;
let nextPrayerDate = null;
let notifiedPrayers = new Set();
let notifiedAdvance = new Set();
let lastDate = "";

function formatTime24h(timeStr) {
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute };
}

function fetchTimings() {
  fetch(apiURL)
    .then(res => res.json())
    .then(data => {
      const timings = data.data.timings;
      const date = data.data.date.readable;
      lastDate = new Date().toISOString().split('T')[0];
      document.getElementById("date").innerText = `Date : ${date}`;
      const tbody = document.getElementById("prayer-times");
      tbody.innerHTML = "";

      const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      prayerTimeMap = {};

      prayers.forEach(prayer => {
        const timeStr = timings[prayer];
        prayerTimeMap[prayer] = formatTime24h(timeStr);

        const row = document.createElement("tr");
        row.id = `row-${prayer}`;
        row.innerHTML = `<td>${prayer}</td><td>${timeStr}</td>`;
        tbody.appendChild(row);
      });

      findNextPrayer();
    })
    .catch(err => {
      document.getElementById("date").innerText = "Erreur de chargement.";
      console.error("Erreur API :", err);
    });
}

function getCurrentTime() {
  const now = new Date();
  return {
    now,
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds()
  };
}

function playAdhan(prayerName) {
  const row = document.getElementById(`row-${prayerName}`);
  if (row) {
    row.classList.add('highlight');
    setTimeout(() => row.classList.remove('highlight'), 60 * 1000);
  }
  if (soundEnabled) {
    adhanAudio.play().catch(() => {});
  }
}

function playAdvanceNotif() {
  if (soundEnabled) {
    notifAudio.play().catch(() => {});
  }
}

function updateCountdown() {
  const now = new Date();
  if (!nextPrayerDate) return;

  const diff = nextPrayerDate - now;
  if (diff <= 0) {
    document.getElementById("next-prayer").innerText = "L'Adhan est en cours...";
    return;
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById("next-prayer").innerText =
    `Prochaine prière (${nextPrayerName}) dans ${hours}h ${minutes}m ${seconds}s`;
}

function findNextPrayer() {
  const now = new Date();
  nextPrayerDate = null;
  nextPrayerName = null;

  for (const [prayer, time] of Object.entries(prayerTimeMap)) {
    const target = new Date(now);
    target.setHours(time.hour, time.minute, 0, 0);

    if (target > now) {
      nextPrayerDate = target;
      nextPrayerName = prayer;
      break;
    }
  }

  if (!nextPrayerDate) {
    document.getElementById("next-prayer").innerText = "Toutes les prières sont passées.";
  }
}

function checkEvents() {
  const { now, hour, minute, second } = getCurrentTime();
  const todayStr = now.toISOString().split('T')[0];

  if (todayStr !== lastDate) {
    fetchTimings();
    notifiedPrayers.clear();
    notifiedAdvance.clear();
  }

  for (const [prayer, time] of Object.entries(prayerTimeMap)) {
    const prayerTime = new Date(now);
    prayerTime.setHours(time.hour, time.minute, 0, 0);

    if (hour === time.hour && minute === time.minute && second === 0) {
      if (!notifiedPrayers.has(prayer)) {
        playAdhan(prayer);
        findNextPrayer();
        notifiedPrayers.add(prayer);
      }
    }

    const advanceTime = new Date(prayerTime.getTime() - 5 * 60 * 1000);
    if (
      hour === advanceTime.getHours() &&
      minute === advanceTime.getMinutes() &&
      second === 0 &&
      !notifiedAdvance.has(prayer)
    ) {
      playAdvanceNotif();
      alert(`🕐 La prière de ${prayer} est dans 5 minutes.`);
      notifiedAdvance.add(prayer);
    }
  }

  updateCountdown();
}

fetchTimings();
setInterval(checkEvents, 1000);
