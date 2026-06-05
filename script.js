"use strict";

const wallpaperImagePath = "./assets/images/wallpaper.jpg";

const wallpaper = document.getElementById("wallpaper");
const placeholder = document.getElementById("placeholder");
const mainImage = document.getElementById("main-image");
const backdropImage = document.getElementById("backdrop-image");
const clockElement = document.getElementById("clock");
const mediaPanel = document.getElementById("media-panel");
const mediaArtist = document.getElementById("media-artist");
const mediaTitle = document.getElementById("media-title");
const mediaArtistMarquee = document.getElementById("media-artist-marquee");
const mediaTitleMarquee = document.getElementById("media-title-marquee");
const mediaCover = document.getElementById("media-cover");
const mediaProgress = document.getElementById("media-progress");
const progressCurrent = document.getElementById("progress-current");
const progressDuration = document.getElementById("progress-duration");
const progressFill = document.getElementById("progress-fill");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const settings = {
  animationSpeed: reduceMotion ? 0.3 : 1,
  breathingStrength: reduceMotion ? 0.2 : 1,
  parallaxStrength: reduceMotion ? 0.2 : 1,
  motionStrength: reduceMotion ? 0.25 : 1,
  hudOpacity: 1,
  mediaOpacity: 1,
  progressOpacity: 0.92,
  dimAmount: 0.12,
};

const pointer = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
};

const timeline = {
  position: 0,
  duration: 0,
  lastUpdateTime: 0,
  isPlaying: false,
  previewMode: typeof window.wallpaperRegisterMediaTimelineListener !== "function",
};

let clockTimer = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizedSlider(value, fallback = 100) {
  const number = Number(value ?? fallback);
  return clamp(number, 0, 100) / 100;
}

function propertyBoolean(value, fallback = true) {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return value !== "0" && value !== "false";
}

function updateVisualSettings() {
  wallpaper.style.setProperty("--dim", settings.dimAmount.toFixed(3));
  wallpaper.style.setProperty("--hud-opacity", settings.hudOpacity.toFixed(2));
  wallpaper.style.setProperty("--media-opacity", settings.mediaOpacity.toFixed(2));
  wallpaper.style.setProperty("--progress-opacity", settings.progressOpacity.toFixed(2));
}

function setWallpaperImage(path) {
  mainImage.src = path;
  backdropImage.src = path;
  mediaCover.style.backgroundImage = `url("${path}")`;

  mainImage.addEventListener(
    "load",
    () => {
      document.body.classList.add("has-image");
      mediaCover.classList.add("has-thumbnail");
      placeholder.hidden = true;
    },
    { once: true }
  );

  mainImage.addEventListener(
    "error",
    () => {
      document.body.classList.remove("has-image");
      mediaCover.classList.remove("has-thumbnail");
      mediaCover.style.backgroundImage = "";
      placeholder.hidden = false;
    },
    { once: true }
  );
}

function updatePointer(clientX, clientY) {
  pointer.targetX = (clientX / window.innerWidth - 0.5) * 2;
  pointer.targetY = (clientY / window.innerHeight - 0.5) * 2;
}

function centerPointer() {
  pointer.targetX = 0;
  pointer.targetY = 0;
}

window.addEventListener("pointermove", (event) => {
  updatePointer(event.clientX, event.clientY);
});

window.addEventListener("pointerleave", centerPointer);
window.addEventListener("blur", centerPointer);

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  clockElement.textContent = `${hours}:${minutes}`;
  clockElement.dateTime = now.toISOString();
}

function startClock() {
  updateClock();
  window.clearInterval(clockTimer);
  clockTimer = window.setInterval(updateClock, 1000);
}

function setMarqueeText(textElement, value) {
  const text = String(value || "").trim();
  const safeText = text || "Unknown";
  const track = textElement.closest(".marquee-track");
  const copies = track.querySelectorAll(".marquee-text");

  copies.forEach((copy) => {
    copy.textContent = safeText;
  });
}

function refreshMarquee(marquee) {
  const track = marquee.querySelector(".marquee-track");
  const firstText = marquee.querySelector(".marquee-text");
  const overflow = firstText.scrollWidth > marquee.clientWidth;
  const distance = firstText.scrollWidth;
  const duration = clamp(distance / 34, 9, 28);

  marquee.classList.toggle("is-scrolling", overflow);
  marquee.style.setProperty("--marquee-distance", `${distance}px`);
  marquee.style.setProperty("--marquee-duration", `${duration.toFixed(1)}s`);

  if (!overflow) {
    track.style.transform = "";
  }
}

function refreshAllMarquees() {
  refreshMarquee(mediaArtistMarquee);
  refreshMarquee(mediaTitleMarquee);
}

function setMediaText(artist, title) {
  setMarqueeText(mediaArtist, artist);
  setMarqueeText(mediaTitle, title);
  window.requestAnimationFrame(refreshAllMarquees);
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateProgressDisplay(position, duration) {
  const safeDuration = Math.max(0, Number(duration) || 0);
  const safePosition = clamp(Number(position) || 0, 0, safeDuration || 0);
  const percent = safeDuration > 0 ? (safePosition / safeDuration) * 100 : 0;

  progressCurrent.textContent = formatTime(safePosition);
  progressDuration.textContent = formatTime(safeDuration);
  progressFill.style.width = `${clamp(percent, 0, 100).toFixed(2)}%`;
}

function updateMediaText(event) {
  const title = event?.title || event?.subTitle || "Media Title";
  const artist = event?.artist || event?.albumArtist || "MEDIA ARTIST";

  setMediaText(artist, title);
}

function updateMediaThumbnail(event) {
  if (event?.thumbnail) {
    mediaCover.style.backgroundImage = `url("${event.thumbnail}")`;
    mediaCover.classList.add("has-thumbnail");
  }
}

function updateMediaPlayback(event) {
  const integration = window.wallpaperMediaIntegration;

  if (!integration || event?.state === undefined) {
    return;
  }

  const isPlaying = event.state === integration.PLAYBACK_PLAYING;
  timeline.isPlaying = isPlaying;
  mediaPanel.classList.toggle("is-paused", !isPlaying);

  if (event.state === integration.PLAYBACK_STOPPED) {
    timeline.position = 0;
    timeline.duration = 0;
    timeline.lastUpdateTime = performance.now();
    updateProgressDisplay(0, 0);
  }
}

function updateMediaTimeline(event) {
  timeline.previewMode = false;
  timeline.position = Math.max(0, Number(event?.position) || 0);
  timeline.duration = Math.max(0, Number(event?.duration) || 0);
  timeline.lastUpdateTime = performance.now();
  updateProgressDisplay(timeline.position, timeline.duration);
}

function updatePreviewTimeline(seconds) {
  const duration = 214;
  const position = seconds % duration;

  updateProgressDisplay(position, duration);
}

function updateTimelineProgress(time) {
  if (timeline.previewMode) {
    updatePreviewTimeline(time / 1000);
    return;
  }

  if (timeline.duration <= 0) {
    updateProgressDisplay(0, 0);
    return;
  }

  const elapsed = timeline.isPlaying ? (performance.now() - timeline.lastUpdateTime) / 1000 : 0;
  const position = clamp(timeline.position + elapsed, 0, timeline.duration);
  updateProgressDisplay(position, timeline.duration);
}

function registerWallpaperMediaIntegration() {
  if (typeof window.wallpaperRegisterMediaPropertiesListener === "function") {
    window.wallpaperRegisterMediaPropertiesListener(updateMediaText);
  }

  if (typeof window.wallpaperRegisterMediaThumbnailListener === "function") {
    window.wallpaperRegisterMediaThumbnailListener(updateMediaThumbnail);
  }

  if (typeof window.wallpaperRegisterMediaPlaybackListener === "function") {
    window.wallpaperRegisterMediaPlaybackListener(updateMediaPlayback);
  }

  if (typeof window.wallpaperRegisterMediaTimelineListener === "function") {
    window.wallpaperRegisterMediaTimelineListener(updateMediaTimeline);
  }
}

function render(time) {
  const seconds = time / 1000;
  const motion = settings.motionStrength;
  const speed = settings.animationSpeed;
  const breathing = Math.sin(seconds * 0.92 * speed);
  const slowDrift = Math.sin(seconds * 0.28 * speed);
  const lift = Math.cos(seconds * 0.46 * speed);

  pointer.x += (pointer.targetX - pointer.x) * 0.075;
  pointer.y += (pointer.targetY - pointer.y) * 0.075;

  const parallax = settings.parallaxStrength * motion;
  const breathe = settings.breathingStrength * motion;

  const mainX = pointer.x * 18 * parallax + slowDrift * 5 * motion;
  const mainY = pointer.y * 12 * parallax + breathing * 5 * breathe;
  const mainScale = 1.035 + (breathing + 1) * 0.0035 * breathe;
  const mainRotate = pointer.x * 0.7 * parallax + slowDrift * 0.18 * motion;

  const backdropX = pointer.x * -9 * parallax + slowDrift * -3 * motion;
  const backdropY = pointer.y * -7 * parallax + lift * 4 * motion;
  const backdropScale = 1.04 + (lift + 1) * 0.002 * motion;

  mainImage.style.transform = `translate3d(${mainX.toFixed(2)}px, ${mainY.toFixed(
    2
  )}px, 0) scale(${mainScale.toFixed(4)}) rotate(${mainRotate.toFixed(3)}deg)`;

  backdropImage.style.transform = `translate3d(${backdropX.toFixed(
    2
  )}px, ${backdropY.toFixed(2)}px, 0) scale(${backdropScale.toFixed(4)})`;

  updateTimelineProgress(time);
  requestAnimationFrame(render);
}

window.wallpaperPropertyListener = {
  applyUserProperties(properties) {
    if (properties.motionstrength) {
      settings.motionStrength = normalizedSlider(properties.motionstrength.value);
    }

    if (properties.breathingstrength) {
      settings.breathingStrength = normalizedSlider(properties.breathingstrength.value);
    }

    if (properties.parallaxstrength) {
      settings.parallaxStrength = normalizedSlider(properties.parallaxstrength.value);
    }

    if (properties.animationspeed) {
      settings.animationSpeed = clamp(Number(properties.animationspeed.value ?? 100), 10, 200) / 100;
    }

    if (properties.dimamount) {
      settings.dimAmount = normalizedSlider(properties.dimamount.value, 12) * 0.6;
    }

    if (properties.hudopacity) {
      settings.hudOpacity = normalizedSlider(properties.hudopacity.value, 100);
    }

    if (properties.mediaopacity) {
      settings.mediaOpacity = normalizedSlider(properties.mediaopacity.value, 100);
    }

    if (properties.progressopacity) {
      settings.progressOpacity = normalizedSlider(properties.progressopacity.value, 92);
    }

    if (properties.mediaartist) {
      setMediaText(properties.mediaartist.value, mediaTitle.textContent);
    }

    if (properties.mediatitle) {
      setMediaText(mediaArtist.textContent, properties.mediatitle.value);
    }

    if (properties.showclock) {
      clockElement.hidden = !propertyBoolean(properties.showclock.value);
    }

    if (properties.showmediainfo) {
      mediaPanel.hidden = !propertyBoolean(properties.showmediainfo.value);
    }

    if (properties.showprogressbar) {
      mediaProgress.hidden = !propertyBoolean(properties.showprogressbar.value);
    }

    updateVisualSettings();
  },
};

setWallpaperImage(wallpaperImagePath);
startClock();
refreshAllMarquees();
registerWallpaperMediaIntegration();
updateVisualSettings();
window.addEventListener("resize", refreshAllMarquees);
requestAnimationFrame(render);
