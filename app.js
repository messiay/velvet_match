
// ─── Storage ────────────────────────────────────────────────────────────────
const SK = {
  event: "vm.event",
  formLink: "vm.formLink",
  waitlist: "vm.waitlist",
  user: "vm.user",
};

function loadJson(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function saveJson(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function escHtml(v) {
  return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}
function pad(n) { return String(n).padStart(2,"0"); }

// ─── State ───────────────────────────────────────────────────────────────────
const state = {
  event: { name:"", date:"", time:"", revealTime:"", venue:"", note:"" },
  formLink: loadJson(SK.formLink, { url:"", active: false }),
  user: loadJson(SK.user, null),
};

// ─── Countdown ───────────────────────────────────────────────────────────────
let countdownInterval = null;

function getEventMs() {
  if (!state.event.date) return null;
  const d = new Date(`${state.event.date}T${state.event.time || "00:00"}`);
  return isNaN(d.getTime()) ? null : d.getTime();
}

let revealTriggered = false;

function updateCountdown() {
  const ev = state.event;
  const target = getEventMs();
  const cdWrap = document.getElementById("epCountdownWrap");
  if (!target || !cdWrap) return;

  const now = Date.now();
  const diff = Math.max(0, target - now);

  const secs  = Math.floor(diff / 1000) % 60;
  const mins  = Math.floor(diff / 60000) % 60;
  const hours = Math.floor(diff / 3600000) % 24;
  const days  = Math.floor(diff / 86400000);

  const el = (id) => document.getElementById(id);
  el("cdDays")  && (el("cdDays").textContent  = pad(days));
  el("cdHours") && (el("cdHours").textContent = pad(hours));
  el("cdMins")  && (el("cdMins").textContent  = pad(mins));
  el("cdSecs")  && (el("cdSecs").textContent  = pad(secs));

  // Reveal Logic
  if (ev.reveal_time && state.user && !revealTriggered) {
    const revealDate = new Date(`${ev.date}T${ev.reveal_time}`);
    const revealMs = revealDate.getTime();
    const timeToReveal = revealMs - now;

    if (timeToReveal <= 60000 && timeToReveal > 0) {
      showRevealTimer(Math.floor(timeToReveal / 1000));
    } else if (timeToReveal <= 0 && timeToReveal > -300000) { // Within 5 mins after
      revealTriggered = true;
      triggerMatchReveal();
    }
  }

  if (diff === 0 && !ev.reveal_time) {
    cdWrap.innerHTML = `<div class="cd-started"><span>🔔</span><p>The event has started! Match reveals are going out.</p></div>`;
    clearInterval(countdownInterval);
  }
}

function showRevealTimer(seconds) {
  const overlay = document.getElementById("revealOverlay");
  const clockTime = document.getElementById("revealClockTime");
  const progress = document.getElementById("revealClockProgress");
  
  if (overlay && overlay.style.display !== "flex") {
    overlay.style.display = "flex";
    // Play a subtle tick sound or trigger a haptic if possible (browser limited)
  }
  if (clockTime) clockTime.textContent = seconds;
  if (progress) {
    const offset = (seconds / 60) * 283;
    progress.style.strokeDashoffset = 283 - offset;
  }
}

function triggerMatchReveal() {
  const overlay = document.getElementById("revealOverlay");
  const modal = document.getElementById("matchRevealModal");
  if (overlay) overlay.style.display = "none";
  if (modal && modal.style.display !== "flex") {
    modal.style.display = "flex";
    
    // Pick a random match from local simulation (in real app, this comes from server)
    const matches = [
      { name: "Aarav Sharma", insta: "@aarav_s" },
      { name: "Ananya Iyer", insta: "@ananya_iyer" },
      { name: "Ishaan Malhotra", insta: "@ishaan_m" },
      { name: "Diya Mehra", insta: "@diya_mehra" }
    ];
    const match = matches[Math.floor(Math.random() * matches.length)];
    document.getElementById("mrcName").textContent = match.name;
    document.getElementById("mrcInsta").textContent = match.insta;

    // Modal Close
    document.getElementById("mrcClose").onclick = () => {
      modal.style.display = "none";
    };
  }
}

// ─── Render Event Panel ───────────────────────────────────────────────────────
function renderEventPanel() {
  const ev = state.event;
  const fl = state.formLink;

  const el = (id) => document.getElementById(id);
  if (!el("epName")) return;

  el("epName").textContent = ev.name || "Coming Soon";

  if (ev.date) {
    const d = new Date(`${ev.date}T${ev.time || "00:00"}`);
    const dateStr = new Intl.DateTimeFormat("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      ...(ev.time ? { hour: "numeric", minute: "2-digit" } : {}),
    }).format(d);
    el("epDate").textContent = dateStr;
    el("epStatus").textContent = "Confirmed";
    el("epStatus").classList.add("ep-status-live");
    el("epCountdownWrap") && (el("epCountdownWrap").style.display = "block");
    updateCountdown();
    clearInterval(countdownInterval);
    countdownInterval = setInterval(updateCountdown, 1000);
  } else {
    el("epDate").textContent = "Date TBA";
    el("epCountdownWrap") && (el("epCountdownWrap").style.display = "none");
  }

  el("epVenue").textContent = ev.venue || "Venue TBA";
  el("epNote").textContent = ev.note || "";

  // Form CTA
  const formCta = el("epFormCta");
  const formLink = el("epFormLink");
  if (formCta && formLink) {
    if (fl.active && fl.url) {
      formCta.style.display = "block";
      formLink.href = fl.url;
    } else {
      formCta.style.display = "none";
    }
  }
}

// ─── Particles ────────────────────────────────────────────────────────────────
function initParticles() {
  const container = document.getElementById("heroParticles");
  if (!container) return;
  for (let i = 0; i < 28; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      width: ${2 + Math.random() * 4}px;
      height: ${2 + Math.random() * 4}px;
      animation-delay: ${Math.random() * 6}s;
      animation-duration: ${5 + Math.random() * 8}s;
      opacity: ${0.15 + Math.random() * 0.45};
    `;
    container.appendChild(p);
  }
}

// ─── Waitlist Form ────────────────────────────────────────────────────────────
function initWaitlistForm() {
  const form = document.getElementById("waitlistForm");
  const success = document.getElementById("waitlistSuccess");
  const errEl = document.getElementById("wlError");
  const submitBtn = document.getElementById("wlSubmit");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errEl.textContent = "";

    const name   = document.getElementById("wlName").value.trim();
    const email  = document.getElementById("wlEmail").value.trim();
    const insta  = document.getElementById("wlInsta").value.trim();
    const gender = document.getElementById("wlGender").value;
    const status = document.getElementById("wlStatus").value;
    const about  = document.getElementById("wlAbout").value.trim();

    if (!name) { errEl.textContent = "Please enter your name."; return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent = "Please enter a valid email address."; return;
    }
    if (!gender) { errEl.textContent = "Please select your gender."; return; }
    if (!status) { errEl.textContent = "Please select your attending status."; return; }

    // Save to local storage (admin reads this)
    const list = loadJson(SK.waitlist, []);
    const alreadyIn = list.some((r) => r.email.toLowerCase() === email.toLowerCase());
    if (alreadyIn) {
      errEl.textContent = "You're already on the waitlist! We'll be in touch."; return;
    }

    const newId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    submitBtn.disabled = true;
    submitBtn.querySelector("span").textContent = "Joining...";

    const guest = { name, email, insta, gender, status, about, badge_num: pad(Math.floor(Math.random()*9999)) };
    
    const { error } = await db.joinWaitlist(guest);
    
    if (error) {
      errEl.textContent = error.code === '23505' ? "This email is already registered." : "Something went wrong. Try again.";
      submitBtn.disabled = false;
      submitBtn.querySelector("span").textContent = "Get Me on the List";
      return;
    }

    state.user = guest;
    saveJson(SK.user, guest);
    form.style.display = "none";
    success.style.display = "block";
    showProfileCard(guest);

    // Scroll to success card
    document.getElementById("profileSection").scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // Initial check
  if (state.user) {
    showProfileCard(state.user);
  }
}

function showProfileCard(user) {
  const regSection = document.getElementById("register");
  const profSection = document.getElementById("profileSection");
  const cardContainer = document.getElementById("userProfileCard");
  const joinBtns = document.querySelectorAll(".header-action, #heroJoinBtn");
  const headerProf = document.getElementById("headerProfile");
  const headerJoin = document.getElementById("headerJoinBtn");

  if (regSection) regSection.style.display = "none";
  if (profSection) profSection.style.display = "block";
  joinBtns.forEach(btn => btn.style.display = "none");

  if (user) {
    const parts = user.name.split(" ");
    const initials = (parts.length > 1 ? (parts[0][0] + parts[parts.length-1][0]) : user.name.substring(0,2)).toUpperCase();
    
    if (cardContainer) {
      cardContainer.innerHTML = `
        <div class="profile-badge-container">
          <div class="profile-badge-coin">
            <div class="pb-monogram">${initials}</div>
            <div class="pb-name">${escHtml(user.name)}</div>
            <div class="pb-meta">${escHtml(user.gender)} · ${escHtml(user.status)}</div>
            <div class="pb-num-tag">MEMBER #${user.badgeNum || '0000'}</div>
          </div>
        </div>
        <p class="badge-caption">Your official Velvet Match membership seal.<br>Screenshot this — it's your entry token.</p>
        <a class="button primary full" href="./community.html" style="margin-top:24px">Join the Community</a>
      `;
    }

    if (headerProf) {
      headerProf.style.display = "flex";
      headerProf.querySelector(".hp-monogram").textContent = initials;
      headerProf.onclick = () => {
        const target = document.getElementById('profileSection');
        if (target) window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
      };
    }
    if (headerJoin) headerJoin.style.display = "none";
  }

  const resetBtn = document.getElementById("resetWaitlist");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset your registration? You will need to join the waitlist again.")) {
        localStorage.removeItem(SK.user);
        window.location.reload();
      }
    });
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function initApp() {
  const ev = await db.getEvent();
  if (ev) state.event = ev;
  
  if (state.user && state.user.email) {
    const dbUser = await db.checkRegistration(state.user.email);
    if (dbUser) state.user = dbUser;
  }

  renderEventPanel();
  initParticles();
  initWaitlistForm();
}
initApp();

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const id = link.getAttribute("href").slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: Math.max(0, target.offsetTop - 80), behavior: "smooth" });
  });
});

// Header scroll effect
window.addEventListener("scroll", () => {
  const header = document.querySelector(".site-header");
  if (header) header.classList.toggle("scrolled", window.scrollY > 40);
}, { passive: true });

// ─── Scroll Reveal (Intersection Observer) ────────────────────────────────────
function initScrollReveal() {
  const revealEls = document.querySelectorAll(
    ".hiw-step, .event-feature-card, .about-stat-card, .register-form-card, .register-text, .section-heading, .about-text, .about-cards"
  );
  revealEls.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${(i % 4) * 80}ms`;
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach((el) => io.observe(el));
}
initScrollReveal();

// ─── Animated Stat Counters ───────────────────────────────────────────────────
function animateCounter(el, target, duration = 1400) {
  const isSymbol = isNaN(target);
  if (isSymbol) return;
  const start = performance.now();
  const update = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(eased * target);
    if (p < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const statNums = document.querySelectorAll(".stat-num");
const statIO = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const val = parseInt(el.textContent, 10);
    if (!isNaN(val)) animateCounter(el, val);
    statIO.unobserve(el);
  });
}, { threshold: 0.5 });
statNums.forEach((el) => statIO.observe(el));

// ─── Hero Title Text Scramble ─────────────────────────────────────────────────
function scrambleText(el, finalText, duration = 900) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%&*";
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = finalText.split("").map((ch, i) => {
      if (ch === " ") return " ";
      if (i / finalText.length < p) return ch;
      return chars[Math.floor(Math.random() * chars.length)];
    }).join("");
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = finalText;
  };
  requestAnimationFrame(tick);
}
setTimeout(() => {
  const badge = document.querySelector(".hero-badge span:last-child");
  if (badge) scrambleText(badge, badge.textContent);
}, 600);

// ─── Cursor Heart Trail ───────────────────────────────────────────────────────
function initCursorTrail() {
  const hearts = ["♥","♡","✦","✧","·","⭒"];
  let lastTime = 0;
  document.addEventListener("mousemove", (e) => {
    const now = Date.now();
    if (now - lastTime < 90) return;
    lastTime = now;
    const el = document.createElement("span");
    el.className = "cursor-trail";
    el.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    el.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;font-size:${16 + Math.random() * 12}px;color:hsl(${330 + Math.random() * 30}, 100%, 55%);`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  });
}
initCursorTrail();

// ─── Click Spark Burst ────────────────────────────────────────────────────────
function initClickSparks() {
  document.addEventListener("click", (e) => {
    if (e.target.closest("a,button,input,textarea")) {
      for (let i = 0; i < 8; i++) {
        const spark = document.createElement("span");
        spark.className = "click-spark";
        const angle = (i / 8) * 360;
        const dist = 28 + Math.random() * 24;
        spark.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--angle:${angle}deg;--dist:${dist}px;`;
        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), 600);
      }
    }
  });
}
initClickSparks();

// ─── Magnetic Buttons ─────────────────────────────────────────────────────────
function initMagneticButtons() {
  document.querySelectorAll(".button.primary.large, .header-action").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.28;
      const dy = (e.clientY - cy) * 0.28;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}
initMagneticButtons();

// ─── Parallax Orbs on mouse ───────────────────────────────────────────────────
function initParallax() {
  const orbs = document.querySelectorAll(".hero-orb");
  if (!orbs.length) return;
  document.addEventListener("mousemove", (e) => {
    const xRatio = (e.clientX / window.innerWidth - 0.5) * 2;
    const yRatio = (e.clientY / window.innerHeight - 0.5) * 2;
    orbs.forEach((orb, i) => {
      const factor = (i + 1) * 12;
      orb.style.transform = `translate(${xRatio * factor}px, ${yRatio * factor}px) scale(1)`;
    });
  }, { passive: true });
}
initParallax();

// ─── EASTER EGG: Konami Code → confetti hearts ────────────────────────────────
(function initKonami() {
  const CODE = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let pos = 0;
  document.addEventListener("keydown", (e) => {
    if (e.key === CODE[pos]) {
      pos++;
      if (pos === CODE.length) {
        pos = 0;
        triggerKonamiEasterEgg();
      }
    } else { pos = 0; }
  });
  function triggerKonamiEasterEgg() {
    const overlay = document.createElement("div");
    overlay.className = "easter-egg-overlay";
    overlay.innerHTML = `<div class="ee-card"><div class="ee-hearts" id="eeHearts"></div><h2>you found the secret</h2><p>now imagine finding your match this easily.</p><button class="button primary" id="eeDismiss">close & register →</button></div>`;
    document.body.appendChild(overlay);
    const hc = document.getElementById("eeHearts");
    const icons = ["♥", "♡", "✦", "✧"]; // Using text symbols instead of emojis
    for (let i = 0; i < 40; i++) {
      const h = document.createElement("span");
      h.textContent = icons[Math.floor(Math.random() * icons.length)];
      h.style.cssText = `left:${Math.random()*100}%;animation-delay:${Math.random()*2}s;animation-duration:${1.5+Math.random()*2}s;font-size:${14+Math.random()*24}px;color:rgba(218,98,125,0.7);`;
      hc.appendChild(h);
    }
    document.getElementById("eeDismiss").addEventListener("click", () => {
      overlay.remove();
      document.getElementById("register")?.scrollIntoView({ behavior:"smooth" });
    });
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  }
})();

// ─── EASTER EGG: Logo click 5x ────────────────────────────────────────────────
(function initLogoEgg() {
  const brand = document.querySelector(".brand");
  if (!brand) return;
  let clicks = 0, timer;
  brand.addEventListener("click", (e) => {
    e.preventDefault();
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(() => { clicks = 0; }, 1200);
    if (clicks >= 5) {
      clicks = 0;
      const toast = document.createElement("div");
      toast.className = "egg-toast";
      toast.textContent = "psst. the real match is whoever laughs at this";
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add("visible"), 10);
      setTimeout(() => { toast.classList.remove("visible"); setTimeout(() => toast.remove(), 400); }, 3200);
    }
  });
})();

// ─── EASTER EGG: Type "match" anywhere ───────────────────────────────────────
(function initTypingEgg() {
  let buf = "";
  document.addEventListener("keydown", (e) => {
    if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") return;
    buf = (buf + e.key).slice(-5).toLowerCase();
    if (buf === "match") {
      buf = "";
      const toast = document.createElement("div");
      toast.className = "egg-toast";
      toast.textContent = "match detected. see you at the event.";
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add("visible"), 10);
      setTimeout(() => { toast.classList.remove("visible"); setTimeout(() => toast.remove(), 400); }, 3200);
    }
  });
})();

// ─── FUN FACTS ────────────────────────────────────────────────────────────────
(function initFunFacts() {
  const btn = document.getElementById("funFactBtn");
  if (!btn) return;

  const facts = [
    "It takes just 90 seconds to 4 minutes to decide if you are attracted to someone.",
    "Looking into each other's eyes can synchronize heart rates between two people.",
    "People are generally more attracted to those who have similar DNA.",
    "Holding hands with someone you care about can actually alleviate physical pain and stress.",
    "Couples whose personalities are too similar are less likely to stay together.",
    "The word 'love' is derived from the Sanskrit word 'lubhyati', meaning desire.",
    "Falling in love produces the same neurological effect as getting high.",
    "A person's smell is one of the strongest subconscious factors in attraction.",
    "Expressing gratitude towards a partner spikes the release of oxytocin.",
    "The brain regions associated with obsessive-compulsive behavior are active during the early stages of love."
  ];

  let toastContainer = null;

  btn.addEventListener("click", () => {
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
    }

    const fact = facts[Math.floor(Math.random() * facts.length)];
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<strong>Fun Fact:</strong> ${fact}`;
    
    toastContainer.appendChild(t);
    
    // Auto-remove after 6 seconds
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateY(10px) scale(0.95)";
      t.style.transition = "all 0.3s ease";
      setTimeout(() => t.remove(), 300);
    }, 6000);
  });
})();
