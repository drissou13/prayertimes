const coordinates = new adhan.Coordinates(43.2965, 5.3698); // Marseille
const params = adhan.CalculationMethod.MuslimWorldLeague();
params.madhab = adhan.Madhab.Shafi;

const date = new Date();
document.getElementById("date").innerText = date.toLocaleDateString("fr-FR");

const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);

const times = {
  Fajr: prayerTimes.fajr,
  Sunrise: prayerTimes.sunrise,
  Dhuhr: prayerTimes.dhuhr,
  Asr: prayerTimes.asr,
  Maghrib: prayerTimes.maghrib,
  Isha: prayerTimes.isha
};

const formatTime = time => {
  return time.toLocaleTimeString("fr-FR", {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const tbody = document.getElementById("prayer-times");
for (let [name, time] of Object.entries(times)) {
  const row = document.createElement("tr");
  row.innerHTML = `<td>${name}</td><td>${formatTime(time)}</td>`;
  tbody.appendChild(row);
}

const adhanAudio = document.getElementById("adhan-audio");

function playAdhan() {
  adhanAudio.play().catch(err => {
    console.log("Lecture refusée :", err);
  });
}

// Vérifie chaque seconde si on est à l'heure de prière
setInterval(() => {
  const now = new Date();
  for (let time of Object.values(times)) {
    const prayerTime = new Date(time);
    if (
      now.getHours() === prayerTime.getHours() &&
      now.getMinutes() === prayerTime.getMinutes() &&
      now.getSeconds() < 5
    ) {
      playAdhan();
    }
  }
}, 1000);
