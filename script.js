/**
 * Cyber Arcade Pro — Complete Multi-Device Multiplayer
 * ====================================================
 * Features:
 *  - Step-by-step Landing Wizard (Game → Mode → Profile/Room → Arena)
 *  - Server API integration for real-time room state sync across devices
 *  - PeerJS WebRTC fallback for direct peer connections
 *  - Tic-Tac-Toe with Minimax AI, turn timers, auto-restart
 *  - Coin Toss with cryptographic fairness & streak prevention
 *  - Confetti, sound effects, floating reactions, speech bubbles
 */

// ==========================================
// 1. Built-in SVG Avatars
// ==========================================
const PRESET_AVATARS = [
  "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#1e293b"/>
      <rect x="25" y="30" width="50" height="42" rx="10" fill="#00e5ff"/>
      <circle cx="40" cy="48" r="6" fill="#0f172a"/>
      <circle cx="60" cy="48" r="6" fill="#0f172a"/>
      <rect x="36" y="60" width="28" height="4" rx="2" fill="#0f172a"/>
      <rect x="47" y="16" width="6" height="14" fill="#00e5ff"/>
      <circle cx="50" cy="14" r="5" fill="#ff2a8d"/>
    </svg>`),
  "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#090d16"/>
      <circle cx="50" cy="50" r="38" fill="#1e1b4b"/>
      <path d="M22 45 Q50 35 78 45 L78 60 Q50 50 22 60 Z" fill="#ff2a8d"/>
      <rect x="34" y="48" width="12" height="5" rx="2" fill="#00e5ff"/>
      <rect x="54" y="48" width="12" height="5" rx="2" fill="#00e5ff"/>
    </svg>`),
  "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#0f172a"/>
      <circle cx="50" cy="50" r="36" fill="#f8fafc"/>
      <ellipse cx="50" cy="50" rx="26" ry="22" fill="#0284c7"/>
      <ellipse cx="44" cy="44" rx="10" ry="6" fill="rgba(255,255,255,0.4)" transform="rotate(-20 44 44)"/>
    </svg>`),
  "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#18181b"/>
      <circle cx="50" cy="54" r="28" fill="#fbcfe8"/>
      <path d="M25 40 Q50 15 75 40 Q75 65 72 70 Q50 30 28 70 Z" fill="#ec4899"/>
      <circle cx="42" cy="52" r="4" fill="#0f172a"/>
      <circle cx="58" cy="52" r="4" fill="#0f172a"/>
      <path d="M22 36 A30 30 0 0 1 78 36" fill="none" stroke="#a855f7" stroke-width="7"/>
      <rect x="18" y="40" width="8" height="18" rx="4" fill="#a855f7"/>
      <rect x="74" y="40" width="8" height="18" rx="4" fill="#a855f7"/>
    </svg>`),
  "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#1e1b4b"/>
      <polygon points="50,15 25,65 75,65" fill="#6366f1"/>
      <ellipse cx="50" cy="65" rx="34" ry="10" fill="#4338ca"/>
      <polygon points="50,28 53,35 60,35 55,40 57,47 50,43 43,47 45,40 40,35 47,35" fill="#facc15"/>
      <circle cx="50" cy="74" r="14" fill="#fed7aa"/>
      <circle cx="45" cy="73" r="2" fill="#1e1b4b"/>
      <circle cx="55" cy="73" r="2" fill="#1e1b4b"/>
    </svg>`),
  "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#064e3b"/>
      <ellipse cx="50" cy="52" rx="30" ry="34" fill="#10b981"/>
      <ellipse cx="38" cy="46" rx="9" ry="14" fill="#022c22" transform="rotate(-15 38 46)"/>
      <ellipse cx="62" cy="46" rx="9" ry="14" fill="#022c22" transform="rotate(15 62 46)"/>
      <ellipse cx="37" cy="43" rx="3" ry="5" fill="#a7f3d0" transform="rotate(-15 37 43)"/>
      <ellipse cx="61" cy="43" rx="3" ry="5" fill="#a7f3d0" transform="rotate(15 61 43)"/>
    </svg>`)
];

const PRESET_EMOJIS = ["🔥", "⚡", "🤖", "👑", "🎯", "😎", "💀", "🐱", "🚀", "💎", "⭐", "🐉", "🎮", "🧠", "🍕", "🦾"];

// ==========================================
// 2. Sound Effects (Web Audio API)
// ==========================================
class SoundFX {
  constructor() { this.ctx = null; this.enabled = true; }

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggle() { this.enabled = !this.enabled; return this.enabled; }

  _play(type, freq, freqEnd, dur, vol = 0.18) {
    if (!this.enabled) return; this.init(); if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + dur);
  }

  playMove(isP1) { this._play(isP1 ? 'sine' : 'triangle', isP1 ? 520 : 380, isP1 ? 780 : 260, 0.1); }
  playTick() { this._play('sine', 800, null, 0.05, 0.09); }
  playBuzzer() { this._play('sawtooth', 150, 90, 0.3, 0.2); }
  playJoin() { this._play('sine', 440, 880, 0.18); }
  playCoinToss() { this._play('sine', 320, 1400, 0.25, 0.2); }

  playTie() { this._play('sine', 320, 200, 0.22, 0.16); }

  playCoinLand() {
    if (!this.enabled) return; this.init(); if (!this.ctx) return;
    [0, 0.05].forEach((d, i) => {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(i === 0 ? 920 : 1380, this.ctx.currentTime + d);
      g.gain.setValueAtTime(0.16, this.ctx.currentTime + d);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d + 0.15);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(this.ctx.currentTime + d); o.stop(this.ctx.currentTime + d + 0.15);
    });
  }

  playWin() {
    if (!this.enabled) return; this.init(); if (!this.ctx) return;
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.08);
      g.gain.setValueAtTime(0.18, this.ctx.currentTime + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.08 + 0.3);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(this.ctx.currentTime + i * 0.08); o.stop(this.ctx.currentTime + i * 0.08 + 0.3);
    });
  }
}

// ==========================================
// 3. Confetti Engine
// ==========================================
class ConfettiEngine {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.particles = []; this.animId = null; this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
  burst(count = 70) {
    const colors = ['#00e5ff', '#ff2a8d', '#f59e0b', '#10b981', '#ffffff', '#a855f7'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 80,
        y: this.canvas.height / 2 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 1.5) * 11,
        size: Math.random() * 7 + 4, color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360, vRot: (Math.random() - 0.5) * 8, alpha: 1, life: 0.99
      });
    }
    if (!this.animId) this.loop();
  }
  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.24; p.vx *= 0.98;
      p.rotation += p.vRot; p.alpha *= p.life;
      this.ctx.save(); this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color; this.ctx.globalAlpha = Math.max(p.alpha, 0);
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      this.ctx.restore();
      if (p.alpha <= 0.05 || p.y > this.canvas.height + 20) this.particles.splice(i, 1);
    }
    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.loop());
    } else { this.animId = null; this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
  }
}

// ==========================================
// 4. Clipboard Helper
// ==========================================
async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  }
  const t = document.createElement("textarea");
  t.value = text; t.style.position = "fixed"; t.style.left = "-9999px";
  document.body.appendChild(t); t.focus(); t.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) {}
  t.remove(); return ok;
}

// ==========================================
// 5. Server API Client
// ==========================================
class ServerAPI {
  constructor() {
    this.baseUrl = window.location.origin;
    this.pollAbort = null;
  }

  async request(method, path, body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(this.baseUrl + path, opts);
      return await res.json();
    } catch (e) {
      console.warn('API error:', e);
      return { error: e.message };
    }
  }

  async getInfo() { return this.request('GET', '/api/info'); }

  async createRoom(data) { return this.request('POST', '/api/room/create', data); }

  async joinRoom(data) { return this.request('POST', '/api/room/join', data); }

  async sendAction(roomId, role, action, payload = {}) {
    return this.request('POST', '/api/room/action', { roomId, role, action, payload });
  }

  async leaveRoom(roomId, role) {
    return this.request('POST', '/api/room/leave', { roomId, role });
  }

  async pollState(roomId, version = 0, waitSecs = 8) {
    if (this.isPollingState) return { waiting: true };
    this.isPollingState = true;
    this.pollAbort = new AbortController();
    try {
      const res = await fetch(
        `${this.baseUrl}/api/room/state?roomId=${roomId}&version=${version}&wait=${waitSecs}`,
        { signal: this.pollAbort.signal }
      );
      this.isPollingState = false;
      return await res.json();
    } catch (e) {
      this.isPollingState = false;
      if (e.name === 'AbortError') return { aborted: true };
      return { error: e.message };
    }
  }

  stopPolling() {
    this.isPollingState = false;
    if (this.pollAbort) { this.pollAbort.abort(); this.pollAbort = null; }
  }
}

// ==========================================
// 6. Player Profile (localStorage Persistence)
// ==========================================
class PlayerProfile {
  static STORAGE_KEY = 'cyber_arcade_profile_v1';

  /** Load profile from localStorage. Returns null if nothing saved. */
  static load() {
    try {
      const raw = localStorage.getItem(PlayerProfile.STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data && data.name) return data;
      return null;
    } catch (e) { return null; }
  }

  /** Persist profile to localStorage. */
  static save({ name, avatar, emoji }) {
    try {
      localStorage.setItem(PlayerProfile.STORAGE_KEY, JSON.stringify({ name, avatar, emoji, savedAt: Date.now() }));
    } catch (e) { console.warn('Profile save failed:', e); }
  }

  /** Wipe saved profile. */
  static clear() {
    try { localStorage.removeItem(PlayerProfile.STORAGE_KEY); } catch (e) {}
  }

  /** Return true if a profile is already saved. */
  static exists() { return PlayerProfile.load() !== null; }
}

// ==========================================
// 7. Landing Wizard Controller
// ==========================================
class LandingWizard {
  constructor(app) {
    this.app = app;
    this.selectedGame = 'ttt';
    this.selectedMode = 'ai';
    this.aiDifficulty = 'medium';
    this.turnTimer = 10;

    // Load saved profile or use defaults
    const saved = PlayerProfile.load();
    this.playerName   = saved ? saved.name   : 'Player 1';
    this.playerAvatar = saved ? saved.avatar : PRESET_AVATARS[1];
    this.playerEmoji  = saved ? saved.emoji  : '🔥';
    this._hasSavedProfile = !!saved;

    this.cacheDOM();
    this.initAvatarPresets();
    this.initEmojiPresets();
    this.applyLoadedProfile(saved);
    this.bindEvents();
    this.checkInviteUrl();
  }

  cacheDOM() {
    this.screenLanding = document.getElementById('screen-landing');
    this.screenGame = document.getElementById('screen-game');

    // Game picks
    this.pickTTT = document.getElementById('pick-game-ttt');
    this.pickCoin = document.getElementById('pick-game-coin');
    this.pickChess = document.getElementById('pick-game-chess');
    this.gamePicks = [this.pickTTT, this.pickCoin, this.pickChess];

    // Mode picks
    this.pickAI = document.getElementById('pick-mode-ai');
    this.pickPVP = document.getElementById('pick-mode-pvp');
    this.pickOnline = document.getElementById('pick-mode-online');

    // Profile
    this.nameInput = document.getElementById('landing-name-input');
    this.avatarPreview = document.getElementById('landing-avatar-preview');
    this.fileInput = document.getElementById('landing-file-input');
    this.avatarPresetsEl = document.getElementById('landing-avatar-presets');
    this.emojiPresetsEl = document.getElementById('landing-emoji-presets');

    // Dynamic sections
    this.sectionAI = document.getElementById('setup-section-ai');
    this.sectionPVP = document.getElementById('setup-section-pvp');
    this.sectionOnline = document.getElementById('setup-section-online');

    // AI controls
    this.aiDiffSelect = document.getElementById('landing-ai-difficulty');
    this.timerSelect = document.getElementById('landing-timer-select');

    // PVP
    this.p2NameInput = document.getElementById('landing-p2-name-input');

    // Online
    this.subtabCreate = document.getElementById('subtab-create-room');
    this.subtabJoin = document.getElementById('subtab-join-room');
    this.panelCreate = document.getElementById('panel-create-room');
    this.panelJoin = document.getElementById('panel-join-room');
    this.onlineSubtabs = this.sectionOnline.querySelector('.online-subtabs');
    this.onlineChessInfo = document.getElementById('online-chess-info');
    this.onlineTimerSelect = document.getElementById('online-turn-timer-select');

    // Room lobby
    this.roomLobby = document.getElementById('landing-room-lobby');
    this.lobbyWaitTitle = document.getElementById('lobby-waiting-title');
    this.inviteInput = document.getElementById('landing-invite-input');
    this.btnCopyLink = document.getElementById('btn-copy-landing-link');
    this.wifiInput = document.getElementById('landing-wifi-input');
    this.btnCopyWifi = document.getElementById('btn-copy-wifi-link');
    this.roomCodeDisplay = document.getElementById('landing-room-code-display');
    this.lobbyFriendJoined = document.getElementById('lobby-friend-joined');
    this.lobbyFriendName = document.getElementById('lobby-friend-name');

    // Join room
    this.joinInput = document.getElementById('landing-join-input');
    this.joinStatus = document.getElementById('landing-join-status');

    // Invite banner
    this.inviteBanner = document.getElementById('invite-detected-banner');
    this.detectedRoomCode = document.getElementById('detected-room-code');
    this.btnQuickAccept = document.getElementById('btn-quick-accept-invite');

    // Action buttons
    this.btnStartAI = document.getElementById('btn-start-ai-game');
    this.btnStartPVP = document.getElementById('btn-start-pvp-game');
    this.btnCreateRoom = document.getElementById('btn-create-online-room');
    this.btnJoinRoom = document.getElementById('btn-join-online-room');
  }

  initAvatarPresets() {
    this.avatarPreview.src = this.playerAvatar;
    this.avatarPresetsEl.innerHTML = '';
    PRESET_AVATARS.forEach((src, i) => {
      const btn = document.createElement('button');
      const isSelected = (src === this.playerAvatar);
      btn.className = 'preset-avatar-btn' + (isSelected ? ' selected' : '');
      btn.innerHTML = `<img src="${src}" alt="Avatar ${i + 1}">`;
      btn.addEventListener('click', () => {
        this.playerAvatar = src;
        this.avatarPreview.src = src;
        this.avatarPresetsEl.querySelectorAll('.preset-avatar-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      this.avatarPresetsEl.appendChild(btn);
    });
  }

  initEmojiPresets() {
    this.emojiPresetsEl.innerHTML = '';
    PRESET_EMOJIS.forEach(emoji => {
      const btn = document.createElement('button');
      const isSelected = (emoji === this.playerEmoji);
      btn.className = 'preset-emoji-btn' + (isSelected ? ' selected' : '');
      btn.textContent = emoji;
      btn.addEventListener('click', () => {
        this.playerEmoji = emoji;
        this.emojiPresetsEl.querySelectorAll('.preset-emoji-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
      this.emojiPresetsEl.appendChild(btn);
    });
  }

  applyLoadedProfile(saved) {
    // Always populate form fields from current state
    this.nameInput.value = this.playerName;
    this.avatarPreview.src = this.playerAvatar;

    // Show or hide the "Saved Profile" banner
    const banner   = document.getElementById('saved-profile-banner');
    const editArea = document.getElementById('profile-edit-area');
    if (!banner) return;

    if (saved) {
      // Populate the banner preview
      const bannerAvatar = document.getElementById('saved-profile-avatar');
      const bannerName   = document.getElementById('saved-profile-name');
      const bannerEmoji  = document.getElementById('saved-profile-emoji');
      if (bannerAvatar) bannerAvatar.src = saved.avatar;
      if (bannerName)   bannerName.textContent = saved.name;
      if (bannerEmoji)  bannerEmoji.textContent = saved.emoji;
      banner.classList.remove('hidden');
      // Hide the edit fields — the saved profile is used automatically
      if (editArea) editArea.classList.add('hidden');
    } else {
      banner.classList.add('hidden');
      // Show edit fields for first-time players
      if (editArea) editArea.classList.remove('hidden');
    }
  }


  bindEvents() {
    // Game selection
    this.gamePicks.forEach(el => {
      el.addEventListener('click', () => {
        this.selectedGame = el.dataset.game;
        this.gamePicks.forEach(pick => pick.classList.toggle('active', pick.dataset.game === this.selectedGame));
        this.updateGameModeAvailability();
      });
    });

    // Mode selection
    [this.pickAI, this.pickPVP, this.pickOnline].forEach(el => {
      el.addEventListener('click', () => {
        this.selectedMode = el.dataset.mode;
        [this.pickAI, this.pickPVP, this.pickOnline].forEach(e => e.classList.remove('active'));
        el.classList.add('active');
        this.updateModeSection();
      });
    });

    // File upload
    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.playerAvatar = ev.target.result;
        this.avatarPreview.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    // Online subtabs
    this.subtabCreate.addEventListener('click', () => this.switchOnlineSubtab('create'));
    this.subtabJoin.addEventListener('click', () => this.switchOnlineSubtab('join'));

    // Start buttons
    this.btnStartAI.addEventListener('click', () => this.launchGame('ai'));
    this.btnStartPVP.addEventListener('click', () => this.launchGame('pvp'));
    this.btnCreateRoom.addEventListener('click', () => this.createOnlineRoom());
    this.btnJoinRoom.addEventListener('click', () => this.joinOnlineRoom());

    // Copy link
    this.btnCopyLink.addEventListener('click', () => {
      copyToClipboard(this.inviteInput.value).then(ok => {
        if (ok) {
          this.btnCopyLink.textContent = '✅ Copied!';
          setTimeout(() => { this.btnCopyLink.textContent = '📋 Copy Public'; }, 2000);
        }
      });
    });

    if (this.btnCopyWifi) {
      this.btnCopyWifi.addEventListener('click', () => {
        copyToClipboard(this.wifiInput.value).then(ok => {
          if (ok) {
            this.btnCopyWifi.textContent = '✅ Copied!';
            setTimeout(() => { this.btnCopyWifi.textContent = '📋 Copy Wi-Fi'; }, 2000);
          }
        });
      });
    }

    // Quick accept invite
    this.btnQuickAccept.addEventListener('click', () => {
      const code = this.detectedRoomCode.textContent;
      this.selectedMode = 'online';
      this.updateModeSection();
      this.switchOnlineSubtab('join');
      this.joinInput.value = code;
      this.joinOnlineRoom();
    });

    // Saved profile banner actions
    const btnUseSaved  = document.getElementById('btn-use-saved-profile');
    const btnEditProfile = document.getElementById('btn-edit-profile');
    const btnClearProfile = document.getElementById('btn-clear-profile');

    if (btnUseSaved) {
      btnUseSaved.addEventListener('click', () => {
        // Profile is already loaded in fields — just scroll down / confirm
        const banner = document.getElementById('saved-profile-banner');
        if (banner) {
          banner.classList.add('profile-confirmed');
          btnUseSaved.textContent = '✅ Profile Ready!';
          setTimeout(() => {
            btnUseSaved.textContent = '✅ Use This Profile';
            banner.classList.remove('profile-confirmed');
          }, 2000);
        }
      });
    }

    if (btnEditProfile) {
      btnEditProfile.addEventListener('click', () => {
        // Collapse banner, show edit fields
        const banner = document.getElementById('saved-profile-banner');
        const editArea = document.getElementById('profile-edit-area');
        if (banner) banner.classList.add('hidden');
        if (editArea) editArea.classList.remove('hidden');
      });
    }

    if (btnClearProfile) {
      btnClearProfile.addEventListener('click', () => {
        PlayerProfile.clear();
        this._hasSavedProfile = false;
        // Reset to defaults
        this.playerName   = 'Player 1';
        this.playerAvatar = PRESET_AVATARS[1];
        this.playerEmoji  = '🔥';
        this.nameInput.value = this.playerName;
        this.avatarPreview.src = this.playerAvatar;
        this.initAvatarPresets();
        this.initEmojiPresets();
        const banner = document.getElementById('saved-profile-banner');
        if (banner) banner.classList.add('hidden');
        const editArea = document.getElementById('profile-edit-area');
        if (editArea) editArea.classList.remove('hidden');
      });
    }
  }

  updateModeSection() {
    this.sectionAI.classList.toggle('hidden', this.selectedMode !== 'ai');
    this.sectionPVP.classList.toggle('hidden', this.selectedMode !== 'pvp');
    this.sectionOnline.classList.toggle('hidden', this.selectedMode !== 'online');
  }

  updateGameModeAvailability() {
    const chessSelected = this.selectedGame === 'chess';
    this.onlineChessInfo.classList.toggle('hidden', !chessSelected);
    this.updateModeSection();
  }

  switchOnlineSubtab(tab) {
    this.subtabCreate.classList.toggle('active', tab === 'create');
    this.subtabJoin.classList.toggle('active', tab === 'join');
    this.panelCreate.classList.toggle('hidden', tab !== 'create');
    this.panelJoin.classList.toggle('hidden', tab !== 'join');
  }

  checkInviteUrl() {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const code = roomParam.trim().toUpperCase();
      this.inviteBanner.classList.remove('hidden');
      this.detectedRoomCode.textContent = code;
      // Only fall back to 'Player 2' if there's no saved name and the field is still the raw default
      if (!this._hasSavedProfile && (this.nameInput.value === 'Player 1' || !this.nameInput.value)) {
        this.nameInput.value = 'Player 2';
      }
      // Auto-select online mode
      this.selectedMode = 'online';
      [this.pickAI, this.pickPVP, this.pickOnline].forEach(e => e.classList.remove('active'));
      this.pickOnline.classList.add('active');
      this.updateModeSection();
      this.switchOnlineSubtab('join');
      this.joinInput.value = code;
    }
  }

  getProfile() {
    const profile = {
      name: (this.nameInput.value.trim() || 'Player 1'),
      avatar: this.playerAvatar,
      emoji: this.playerEmoji
    };
    // Auto-save every time a game is launched
    PlayerProfile.save(profile);
    this._hasSavedProfile = true;
    return profile;
  }

  // ---- Launch local games (AI / PVP) ----
  launchGame(mode) {
    const profile = this.getProfile();
    let p2Profile;

    if (mode === 'ai') {
      p2Profile = { name: 'Cyber AI', avatar: PRESET_AVATARS[0], emoji: '🤖' };
      this.app.aiDifficulty = this.aiDiffSelect.value;
      this.app.turnTimer = parseInt(this.timerSelect.value, 10);
    } else {
      p2Profile = {
        name: (this.p2NameInput.value.trim() || 'Player 2'),
        avatar: PRESET_AVATARS[3],
        emoji: '⚡'
      };
      this.app.turnTimer = 10;
    }

    this.app.startArena(this.selectedGame, mode, profile, p2Profile);
  }

  // ---- Create Online Room ----
  async createOnlineRoom() {
    const profile = this.getProfile();
    this.btnCreateRoom.disabled = true;
    this.btnCreateRoom.innerHTML = '<span>⏳</span> Creating Room...';

    const turnTimer = parseInt(this.onlineTimerSelect.value, 10);
    const gameType = this.selectedGame;

    // Try server API first
    const res = await this.app.api.createRoom({
      gameType,
      hostName: profile.name,
      hostAvatar: profile.avatar,
      hostEmoji: profile.emoji,
      turnTimer
    });

    if (res.success && res.roomId) {
      // Server API worked
      this.app.networkMode = 'server';
      this.app.networkRole = 'host';
      this.app.roomId = res.roomId;
      this.app.turnTimer = turnTimer;

      const inviteUrl = res.inviteUrl || `${window.location.origin}/?room=${res.roomId}`;
      this.inviteInput.value = inviteUrl;
      this.wifiInput.value = res.localInviteUrl
        || (res.localIp && res.port
          ? `${res.tlsEnabled ? 'https' : 'http'}://${res.localIp}:${res.port}/?room=${res.roomId}`
          : '');
      this.roomCodeDisplay.textContent = res.roomId;
      this.roomLobby.classList.remove('hidden');
      this.lobbyFriendJoined.classList.add('hidden');
      this.lobbyWaitTitle.textContent = 'Room Created! Waiting for Friend...';

      window.history.replaceState({}, '', `/?room=${res.roomId}`);

      // Start polling for player 2
      this.pollForGuest(res.roomId, profile, gameType);

    } else {
      // Server not available — fall back to PeerJS
      console.log('Server API unavailable, falling back to PeerJS');
      this.createPeerJSRoom(profile, turnTimer);
    }

    this.btnCreateRoom.disabled = false;
    this.btnCreateRoom.innerHTML = '<span>🎮</span> Create Room & Generate Invite Link';
  }

  async pollForGuest(roomId, hostProfile, gameType) {
    let version = 1;
    const poll = async () => {
      if (this.app.networkMode !== 'server' || this.app.roomId !== roomId) return;
      const res = await this.app.api.pollState(roomId, version, 10);
      if (res.aborted || res.error) {
        // Retry
        setTimeout(poll, 2000);
        return;
      }
      if (res.room) {
        version = res.version || version;
        if (res.room.status === 'playing' && res.room.p2 && res.room.p2.connected) {
          // Guest joined!
          this.lobbyFriendJoined.classList.remove('hidden');
          this.lobbyFriendName.textContent = res.room.p2.name || 'Friend';
          this.lobbyWaitTitle.textContent = 'Friend Connected! 🎉';
          this.app.sound.playJoin();

          const p2Profile = {
            name: res.room.p2.name || 'Player 2',
            avatar: res.room.p2.avatar || PRESET_AVATARS[3],
            emoji: res.room.p2.emoji || '⚡'
          };

          setTimeout(() => {
            this.app.startArena(gameType, 'online', hostProfile, p2Profile);
          }, 1200);
          return;
        }
      }
      setTimeout(poll, 500);
    };
    poll();
  }

  async createPeerJSRoom(profile, turnTimer) {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

    this.app.networkMode = 'peerjs';
    this.app.networkRole = 'host';
    this.app.roomId = code;
    this.app.turnTimer = turnTimer;

    const inviteUrl = `${window.location.origin}/?room=${code}`;
    this.inviteInput.value = inviteUrl;
    const serverInfo = await this.app.api.getInfo();
    this.wifiInput.value = serverInfo.localIp && serverInfo.port
      ? `${serverInfo.tlsEnabled ? 'https' : 'http'}://${serverInfo.localIp}:${serverInfo.port}/?room=${code}`
      : inviteUrl;
    this.roomCodeDisplay.textContent = code;
    this.roomLobby.classList.remove('hidden');
    this.lobbyFriendJoined.classList.add('hidden');

    window.history.replaceState({}, '', `/?room=${code}`);

    const peerId = `cyber-ttt-${code.toLowerCase()}`;
    try {
      this.app.peer = new Peer(peerId, {
        debug: 0,
        config: { iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]}
      });

      this.app.peer.on('open', () => {
        this.lobbyWaitTitle.textContent = 'Room Created! Waiting for Friend...';
      });

      this.app.peer.on('connection', (conn) => {
        this.app.conn = conn;
        this.app.setupPeerHandlers(conn, profile);
      });

      this.app.peer.on('error', (err) => {
        console.warn('PeerJS host error:', err);
        if (err.type === 'unavailable-id') {
          setTimeout(() => this.createPeerJSRoom(profile, turnTimer), 500);
        }
      });
    } catch (e) {
      console.error('PeerJS create failed:', e);
    }
  }

  // ---- Join Online Room ----
  async joinOnlineRoom() {
    let input = this.joinInput.value.trim();
    if (!input) return;

    // Extract room code from URL if pasted
    if (input.includes('?room=')) {
      try { input = new URL(input, window.location.href).searchParams.get('room') || input; }
      catch (e) { const m = input.match(/room=([^&]+)/); if (m) input = m[1]; }
    }
    const roomId = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!roomId) { this.showJoinStatus('❌ Invalid room code.', true); return; }

    const profile = this.getProfile();
    this.btnJoinRoom.disabled = true;
    this.showJoinStatus('📡 Connecting to room...', false);

    // Try server API first
    const res = await this.app.api.joinRoom({
      roomId,
      guestName: profile.name,
      guestAvatar: profile.avatar,
      guestEmoji: profile.emoji
    });

    if (res.success && res.room) {
      // Server API worked
      this.app.networkMode = 'server';
      this.app.networkRole = 'guest';
      this.app.roomId = roomId;
      this.app.turnTimer = res.room.turnTimer || 10;
      this.app.sound.playJoin();

      const hostProfile = {
        name: res.room.p1.name || 'Host',
        avatar: res.room.p1.avatar || PRESET_AVATARS[1],
        emoji: res.room.p1.emoji || '🔥'
      };

      this.showJoinStatus('✅ Connected! Entering match...', false);
      window.history.replaceState({}, '', `/?room=${roomId}`);

      const targetGame = (res.room && res.room.gameType) ? res.room.gameType : (this.selectedGame || 'ttt');
      setTimeout(() => {
        this.app.startArena(targetGame, 'online', hostProfile, profile);
      }, 800);

    } else {
      // Try PeerJS fallback
      this.joinViaPeerJS(roomId, profile);
    }

    this.btnJoinRoom.disabled = false;
  }

  joinViaPeerJS(roomId, profile) {
    this.app.networkMode = 'peerjs';
    this.app.networkRole = 'guest';
    this.app.roomId = roomId;

    const hostPeerId = `cyber-ttt-${roomId.toLowerCase()}`;
    try {
      this.app.peer = new Peer(null, {
        debug: 0,
        config: { iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]}
      });

      this.app.peer.on('open', () => {
        this.showJoinStatus('📡 Searching for host...', false);
        const conn = this.app.peer.connect(hostPeerId, { reliable: true });
        this.app.conn = conn;
        this.app.setupPeerHandlers(conn, profile);
      });

      this.app.peer.on('error', (err) => {
        console.warn('PeerJS join error:', err);
        this.showJoinStatus(`❌ Room "${roomId}" not found or host is offline.`, true);
      });
    } catch (e) {
      this.showJoinStatus('❌ Connection error.', true);
    }
  }

  showJoinStatus(msg, isError) {
    this.joinStatus.classList.remove('hidden');
    this.joinStatus.textContent = msg;
    this.joinStatus.style.borderColor = isError ? '#ff3366' : '';
    this.joinStatus.style.color = isError ? '#ff3366' : '';
  }
}

// ==========================================
// 7. Tic-Tac-Toe Game Engine
// ==========================================
class TicTacToeGame {
  constructor(app) {
    this.app = app;
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.isGameOver = false;
    this.scores = { p1: 0, p2: 0, ties: 0 };

    this.turnTimerInterval = null;
    this.turnRemainingMs = 0;
    this.autoRestartInterval = null;
    this.autoRestartRemaining = null;
    this.aiMoveTimeout = null;
    this.isPaused = false;

    this.cacheDOM();
    this.bindEvents();
  }

  cacheDOM() {
    this.boardEl = document.getElementById('board');
    this.cells = Array.from(document.querySelectorAll('.board-cell'));
    this.statusText = document.getElementById('status-text');
    this.statusBanner = document.getElementById('status-banner');
    this.autoRestartPill = document.getElementById('auto-restart-pill');
    this.autoRestartNum = document.getElementById('auto-restart-num');
    this.btnSkip = document.getElementById('btn-skip-auto-restart');

    this.p1Card = document.getElementById('player1-card');
    this.p2Card = document.getElementById('player2-card');
    this.p1NameEl = document.getElementById('p1-name-display');
    this.p2NameEl = document.getElementById('p2-name-display');
    this.p1AvatarEl = document.getElementById('p1-avatar-img');
    this.p2AvatarEl = document.getElementById('p2-avatar-img');
    this.p1EmojiEl = document.getElementById('p1-emoji-badge');
    this.p2EmojiEl = document.getElementById('p2-emoji-badge');
    this.p1ScoreEl = document.getElementById('p1-score');
    this.p2ScoreEl = document.getElementById('p2-score');
    this.tieScoreEl = document.getElementById('tie-score');
    this.p1TurnPill = document.getElementById('p1-turn-pill');
    this.p2TurnPill = document.getElementById('p2-turn-pill');

    this.p1TimerBar = document.getElementById('p1-timer-bar');
    this.p2TimerBar = document.getElementById('p2-timer-bar');
    this.p1TimerText = document.getElementById('p1-timer-text');
    this.p2TimerText = document.getElementById('p2-timer-text');

    this.winLineSvg = document.getElementById('win-strike-svg');
    this.winLine = document.getElementById('win-strike-line');

    this.btnRestart = document.getElementById('btn-restart-round');
    this.btnPause = document.getElementById('btn-ttt-pause');
    this.btnReset = document.getElementById('btn-reset-scores');
    this.btnInvite = document.getElementById('btn-invite-friend-action');
  }

  bindEvents() {
    this.cells.forEach(cell => {
      cell.addEventListener('click', () => {
        this.handleCellClick(parseInt(cell.dataset.index, 10));
      });
    });

    this.btnRestart.addEventListener('click', () => {
      this.cancelAutoRestart();
      this.setPaused(false);
      if (this.app.gameMode === 'online') {
        this.app.sendOnlineAction('NEW_ROUND', {});
      }
      this.startRound();
    });
    this.btnPause.addEventListener('click', () => this.setPaused(!this.isPaused));
    this.btnReset.addEventListener('click', () => {
      if (this.app.gameMode === 'online') {
        this.app.sendOnlineAction('RESET_SCORES', {});
      }
      this.resetScores();
    });
    this.btnSkip.addEventListener('click', () => {
      this.cancelAutoRestart();
      if (this.app.gameMode === 'online') {
        this.app.sendOnlineAction('NEW_ROUND', {});
      }
      this.startRound();
    });

    this.btnInvite.addEventListener('click', () => {
      if (this.app.roomId) {
        const inviteInput = document.getElementById('landing-invite-input');
        const url = (inviteInput && inviteInput.value) ? inviteInput.value : `${window.location.origin}/?room=${this.app.roomId}`;
        copyToClipboard(url).then(ok => {
          if (ok) { this.btnInvite.innerHTML = '<span>✅</span> Copied!'; setTimeout(() => { this.btnInvite.innerHTML = '<span>🌐</span> Invite Link'; }, 2000); }
        });
      }
    });

    // Chat chips
    document.querySelectorAll('#view-tic-tac-toe .chat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const msg = chip.dataset.msg;
        const sender = this.currentPlayer === 'X' ? 'p1' : 'p2';
        this.showSpeechBubble(sender, msg);
        if (this.app.gameMode === 'online') {
          this.app.sendOnlineAction('CHAT', { player: sender, message: msg });
        }
      });
    });

    // Reaction buttons
    document.querySelectorAll('#view-tic-tac-toe .reactions-dock').forEach(dock => {
      const playerKey = dock.dataset.player;
      dock.querySelectorAll('.rxn-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.triggerFloatingReaction(playerKey, btn.dataset.emoji);
          if (this.app.gameMode === 'online') {
            this.app.sendOnlineAction('REACTION', { player: playerKey, emoji: btn.dataset.emoji });
          }
        });
      });
    });
  }

  initProfiles(p1, p2) {
    this.p1NameEl.textContent = p1.name;
    this.p1AvatarEl.src = p1.avatar;
    this.p1EmojiEl.textContent = p1.emoji;
    this.p2NameEl.textContent = p2.name;
    this.p2AvatarEl.src = p2.avatar;
    this.p2EmojiEl.textContent = p2.emoji;
  }

  startRound() {
    this.cancelAutoRestart();
    this.setPaused(false);
    if (this.aiMoveTimeout) { clearTimeout(this.aiMoveTimeout); this.aiMoveTimeout = null; }
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.isGameOver = false;
    this.statusBanner.className = 'game-status-banner';
    this.winLineSvg.style.display = 'none';

    this.cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'board-cell';
      cell.disabled = false;
      cell.setAttribute('data-preview', 'X');
    });

    this.updateScoreUI();
    this.updateTurnDisplay();
    this.startTurnTimer();
  }

  updateScoreUI() {
    this.p1ScoreEl.textContent = this.scores.p1;
    this.p2ScoreEl.textContent = this.scores.p2;
    this.tieScoreEl.textContent = this.scores.ties;
  }

  resetScores() {
    this.cancelAutoRestart();
    this.scores = { p1: 0, p2: 0, ties: 0 };
    this.startRound();
  }

  updateTurnDisplay() {
    if (this.isGameOver) return;

    this.cells.forEach(cell => {
      if (!cell.classList.contains('taken')) {
        cell.setAttribute('data-preview', this.currentPlayer);
      }
    });

    const mode = this.app.gameMode;

    if (mode === 'online') {
      const isMyTurn = (this.app.networkRole === 'host' && this.currentPlayer === 'X') ||
                       (this.app.networkRole === 'guest' && this.currentPlayer === 'O');

      this.p1TurnPill.textContent = this.app.networkRole === 'host' ? 'YOU (X)' : `${this.app.player1.name} (X)`;
      this.p2TurnPill.textContent = this.app.networkRole === 'guest' ? 'YOU (O)' : `${this.app.player2.name} (O)`;

      this.p1Card.classList.toggle('active-turn', this.currentPlayer === 'X');
      this.p2Card.classList.toggle('active-turn', this.currentPlayer === 'O');

      this.cells.forEach(cell => {
        if (!cell.classList.contains('taken')) cell.classList.toggle('locked', !isMyTurn);
      });

      this.statusText.textContent = isMyTurn
        ? `⚡ Your Turn (${this.currentPlayer}) — Pick a cell!`
        : `⏳ Waiting for opponent's move...`;
    } else {
      this.p1TurnPill.textContent = 'MY TURN';
      this.p2TurnPill.textContent = 'MY TURN';

      this.p1Card.classList.toggle('active-turn', this.currentPlayer === 'X');
      this.p2Card.classList.toggle('active-turn', this.currentPlayer === 'O');

      this.cells.forEach(cell => {
        if (!cell.classList.contains('taken')) cell.classList.remove('locked');
      });

      if (mode === 'ai' && this.currentPlayer === 'O') {
        this.statusText.textContent = `${this.app.player2.name} is calculating... 🤖`;
      } else {
        const name = this.currentPlayer === 'X' ? this.app.player1.name : this.app.player2.name;
        const emoji = this.currentPlayer === 'X' ? this.app.player1.emoji : this.app.player2.emoji;
        this.statusText.textContent = `${name}'s Turn ${emoji} — Pick a cell!`;
      }
    }
  }

  // ---- Turn Timer ----
  startTurnTimer(preserveRemaining = false) {
    if (this.turnTimerInterval) { clearInterval(this.turnTimerInterval); this.turnTimerInterval = null; }
    const limit = this.app.turnTimer;
    if (!limit || this.isGameOver || this.isPaused) {
      this.p1TimerBar.style.width = '100%'; this.p2TimerBar.style.width = '100%';
      this.p1TimerBar.className = 'turn-timer-bar'; this.p2TimerBar.className = 'turn-timer-bar';
      this.p1TimerText.textContent = '♾️'; this.p2TimerText.textContent = '♾️';
      return;
    }

    const totalMs = limit * 1000;
    if (!preserveRemaining || this.turnRemainingMs <= 0) this.turnRemainingMs = totalMs;
    this.updateTimerUI();

    this.turnTimerInterval = setInterval(() => {
      this.turnRemainingMs -= 100;
      if (this.turnRemainingMs > 0 && this.turnRemainingMs <= 3000 && this.turnRemainingMs % 1000 === 0) {
        this.app.sound.playTick();
      }
      if (this.turnRemainingMs <= 0) {
        clearInterval(this.turnTimerInterval); this.turnTimerInterval = null;
        this.handleTimeout(); return;
      }
      this.updateTimerUI();
    }, 100);
  }

  updateTimerUI() {
    const total = this.app.turnTimer * 1000;
    const pct = Math.max(0, (this.turnRemainingMs / total) * 100);
    const secs = Math.ceil(this.turnRemainingMs / 1000);

    const aBar = this.currentPlayer === 'X' ? this.p1TimerBar : this.p2TimerBar;
    const iBar = this.currentPlayer === 'X' ? this.p2TimerBar : this.p1TimerBar;
    const aTxt = this.currentPlayer === 'X' ? this.p1TimerText : this.p2TimerText;
    const iTxt = this.currentPlayer === 'X' ? this.p2TimerText : this.p1TimerText;

    aBar.style.width = `${pct}%`;
    aTxt.textContent = `${secs}s`;
    iBar.style.width = '100%';
    iTxt.textContent = `${this.app.turnTimer}s`;

    aBar.classList.remove('warning', 'critical');
    if (secs <= 2) aBar.classList.add('critical');
    else if (secs <= Math.max(3, Math.floor(this.app.turnTimer * 0.4))) aBar.classList.add('warning');
  }

  handleTimeout() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.app.sound.playBuzzer();

    const loser = this.currentPlayer === 'X' ? this.app.player1.name : this.app.player2.name;
    const winner = this.currentPlayer === 'X' ? this.app.player2.name : this.app.player1.name;

    if (this.currentPlayer === 'X') { this.scores.p2++; } else { this.scores.p1++; }
    this.updateScoreUI();

    this.statusBanner.className = 'game-status-banner timeout-banner';
    this.statusText.textContent = `⏰ Time's up! ${loser} forfeited. ${winner} wins!`;
    this.p1Card.classList.remove('active-turn');
    this.p2Card.classList.remove('active-turn');
    this.startAutoRestart(3);
  }

  // ---- Cell Click & Move ----
  handleCellClick(index) {
    if (this.isPaused || this.isGameOver || this.board[index] !== null) return;
    const mode = this.app.gameMode;

    if (mode === 'ai' && this.currentPlayer === 'O') return;

    if (mode === 'online') {
      const isMyTurn = (this.app.networkRole === 'host' && this.currentPlayer === 'X') ||
                       (this.app.networkRole === 'guest' && this.currentPlayer === 'O');
      if (!isMyTurn) return;
      this.app.sendOnlineAction('MOVE', { index });
    }

    this.executeMove(index);
  }

  executeMove(index, isRemote = false) {
    if ((this.isPaused && !isRemote) || this.board[index] !== null || this.isGameOver) return;

    this.board[index] = this.currentPlayer;
    const cell = this.cells[index];
    cell.textContent = this.currentPlayer;
    cell.classList.add('taken', this.currentPlayer === 'X' ? 'cell-x' : 'cell-o');
    cell.classList.remove('locked');
    cell.removeAttribute('data-preview');

    this.app.sound.playMove(this.currentPlayer === 'X');

    const winData = this.checkWin(this.board);
    if (winData) { this.handleWin(winData); return; }
    if (this.isBoardFull(this.board)) { this.handleTie(); return; }

    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    this.updateTurnDisplay();
    this.startTurnTimer();

    if (this.app.gameMode === 'ai' && this.currentPlayer === 'O' && !this.isGameOver) {
      this.aiMoveTimeout = setTimeout(() => {
        this.aiMoveTimeout = null;
        this.executeAIMove();
      }, 450);
    }
  }

  handleWin(winData) {
    this.isGameOver = true;
    if (this.turnTimerInterval) clearInterval(this.turnTimerInterval);

    if (winData.player === 'X') this.scores.p1++; else this.scores.p2++;
    this.updateScoreUI();

    winData.combination.forEach(i => this.cells[i].classList.add('winning-cell'));
    this.drawStrikeLine(winData.combination);

    this.statusBanner.className = 'game-status-banner win-banner';
    const wName = winData.player === 'X' ? this.app.player1.name : this.app.player2.name;
    const wEmoji = winData.player === 'X' ? this.app.player1.emoji : this.app.player2.emoji;

    if (this.app.gameMode === 'online') {
      const isMe = (this.app.networkRole === 'host' && winData.player === 'X') ||
                   (this.app.networkRole === 'guest' && winData.player === 'O');
      this.statusText.textContent = isMe ? `🏆 VICTORY! You won! 🎉` : `⚔️ ${wName} won this round!`;
    } else {
      this.statusText.textContent = `🎉 Victory! ${wName} ${wEmoji} wins!`;
    }

    this.app.sound.playWin();
    this.app.confetti.burst(90);
    this.p1Card.classList.remove('active-turn');
    this.p2Card.classList.remove('active-turn');
    this.startAutoRestart(3);
  }

  handleTie() {
    this.isGameOver = true;
    if (this.turnTimerInterval) clearInterval(this.turnTimerInterval);
    this.scores.ties++;
    this.updateScoreUI();
    this.statusBanner.className = 'game-status-banner';
    this.statusText.textContent = `🤝 It's a draw! Well played both!`;
    this.app.sound.playTie();
    this.p1Card.classList.remove('active-turn');
    this.p2Card.classList.remove('active-turn');
    this.startAutoRestart(3);
  }

  drawStrikeLine(combo) {
    const bRect = this.boardEl.getBoundingClientRect();
    const a = this.cells[combo[0]].getBoundingClientRect();
    const c = this.cells[combo[2]].getBoundingClientRect();
    this.winLine.setAttribute('x1', a.left + a.width / 2 - bRect.left);
    this.winLine.setAttribute('y1', a.top + a.height / 2 - bRect.top);
    this.winLine.setAttribute('x2', c.left + c.width / 2 - bRect.left);
    this.winLine.setAttribute('y2', c.top + c.height / 2 - bRect.top);
    this.winLineSvg.style.display = 'block';
  }

  // ---- Auto-Restart ----
  startAutoRestart(secs = 3) {
    this.cancelAutoRestart();
    this.autoRestartRemaining = secs;
    this.autoRestartPill.classList.remove('hidden');
    this.autoRestartNum.textContent = this.autoRestartRemaining;
    this.autoRestartInterval = setInterval(() => {
      this.autoRestartRemaining--;
      if (this.autoRestartRemaining > 0) { this.autoRestartNum.textContent = this.autoRestartRemaining; }
      else {
        this.cancelAutoRestart();
        if (this.app.gameMode === 'online') {
          this.app.sendOnlineAction('NEW_ROUND', {});
        }
        this.startRound();
      }
    }, 1000);
  }

  cancelAutoRestart() {
    if (this.autoRestartInterval) { clearInterval(this.autoRestartInterval); this.autoRestartInterval = null; }
    this.autoRestartRemaining = null;
    this.autoRestartPill.classList.add('hidden');
  }

  setPaused(paused) {
    if (this.isPaused === paused) return;
    this.isPaused = paused;
    this.btnPause.innerHTML = paused ? '<span>▶️</span> Play' : '<span>⏸️</span> Pause';
    this.btnPause.setAttribute('aria-pressed', String(paused));
    if (paused) {
      if (this.turnTimerInterval) { clearInterval(this.turnTimerInterval); this.turnTimerInterval = null; }
      if (this.aiMoveTimeout) { clearTimeout(this.aiMoveTimeout); this.aiMoveTimeout = null; }
      if (this.autoRestartInterval) { clearInterval(this.autoRestartInterval); this.autoRestartInterval = null; }
      this.cells.forEach(cell => { cell.disabled = true; });
      this.statusText.textContent = '⏸ Game paused.';
    } else {
      this.updateTurnDisplay();
      if (this.isGameOver) {
        if (this.autoRestartRemaining !== null) this.startAutoRestart(this.autoRestartRemaining);
      } else {
        this.cells.forEach(cell => { cell.disabled = false; });
        this.startTurnTimer(true);
        if (this.app.gameMode === 'ai' && this.currentPlayer === 'O') {
          this.aiMoveTimeout = setTimeout(() => {
            this.aiMoveTimeout = null;
            this.executeAIMove();
          }, 450);
        }
      }
    }
  }

  // ---- Reactions & Chat ----
  triggerFloatingReaction(playerKey, emoji) {
    const container = document.getElementById(`${playerKey}-floating-rxn`);
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'floating-reaction';
    el.textContent = emoji;
    el.style.setProperty('--rxn-x', `${(Math.random() - 0.5) * 50}px`);
    container.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  showSpeechBubble(playerKey, message) {
    const bubble = document.getElementById(`${playerKey}-speech-bubble`);
    if (!bubble) return;
    bubble.textContent = message;
    bubble.classList.add('show');
    if (bubble._hideTimeout) clearTimeout(bubble._hideTimeout);
    bubble._hideTimeout = setTimeout(() => bubble.classList.remove('show'), 2400);
  }

  // ---- AI Logic ----
  executeAIMove() {
    if (this.isGameOver || this.currentPlayer !== 'O') return;
    let idx;
    const diff = this.app.aiDifficulty;
    if (diff === 'easy') idx = this.getRandomMove();
    else if (diff === 'medium') idx = Math.random() < 0.65 ? this.getTacticalMove() : this.getRandomMove();
    else idx = this.getMinimaxMove();
    if (idx != null) this.executeMove(idx);
  }

  getAvailable(board) { return board.reduce((a, c, i) => c === null ? a.concat(i) : a, []); }
  getRandomMove() { const a = this.getAvailable(this.board); return a.length ? a[Math.floor(Math.random() * a.length)] : null; }

  getTacticalMove() {
    const a = this.getAvailable(this.board);
    for (let i of a) { const c = [...this.board]; c[i] = 'O'; if (this.checkWin(c)) return i; }
    for (let i of a) { const c = [...this.board]; c[i] = 'X'; if (this.checkWin(c)) return i; }
    if (this.board[4] === null) return 4;
    return this.getRandomMove();
  }

  getMinimaxMove() {
    if (this.board[4] === null) return 4;
    let best = -Infinity, move = null;
    for (let i of this.getAvailable(this.board)) {
      this.board[i] = 'O';
      const s = this.minimax(this.board, 0, false);
      this.board[i] = null;
      if (s > best) { best = s; move = i; }
    }
    return move;
  }

  minimax(board, depth, isMax) {
    const w = this.checkWin(board);
    if (w) return w.player === 'O' ? 10 - depth : depth - 10;
    if (this.isBoardFull(board)) return 0;
    const avail = this.getAvailable(board);
    if (isMax) {
      let v = -Infinity;
      for (let i of avail) { board[i] = 'O'; v = Math.max(v, this.minimax(board, depth + 1, false)); board[i] = null; }
      return v;
    } else {
      let v = Infinity;
      for (let i of avail) { board[i] = 'X'; v = Math.min(v, this.minimax(board, depth + 1, true)); board[i] = null; }
      return v;
    }
  }

  checkWin(board) {
    const combos = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let c of combos) {
      if (board[c[0]] && board[c[0]] === board[c[1]] && board[c[0]] === board[c[2]])
        return { player: board[c[0]], combination: c };
    }
    return null;
  }

  isBoardFull(board) { return board.every(c => c !== null); }

  // ---- Apply server state (for polling) ----
  applyServerState(gs, scores) {
    if (scores) { this.scores = { ...scores }; this.updateScoreUI(); }
    if (!gs) return;
    this.board = gs.board.map(v => v || null);
    this.currentPlayer = gs.currentPlayer || 'X';
    this.isGameOver = gs.isGameOver || false;

    this.cells.forEach((cell, i) => {
      if (this.board[i]) {
        cell.textContent = this.board[i];
        cell.classList.add('taken', this.board[i] === 'X' ? 'cell-x' : 'cell-o');
      } else {
        cell.textContent = '';
        cell.className = 'board-cell';
      }
    });

    if (gs.winCombination) {
      gs.winCombination.forEach(i => this.cells[i].classList.add('winning-cell'));
      this.drawStrikeLine(gs.winCombination);
    } else {
      this.winLineSvg.style.display = 'none';
      if (!this.isGameOver) {
        this.statusBanner.className = 'game-status-banner';
      }
    }

    this.updateTurnDisplay();
  }
}

// ==========================================
// 8. Coin Toss Game Engine
// ==========================================
class CoinTossGame {
  constructor(app) {
    this.app = app;
    this.player1Choice = 'heads';
    this.player2Choice = 'tails';
    this.isFlipping = false;
    this.currentRotation = 0;
    this.scores = { p1: 0, p2: 0 };
    this.stats = { total: 0, heads: 0, tails: 0, streak: 0, bestStreak: 0 };
    this.history = [];
    this.positionCounts = new Map();
    this.autoRestartInterval = null;
    this.isPaused = false;
    this.flipTimeout = null;
    this.flipStartedAt = null;
    this.flipRemainingMs = 1800;
    this.flipTarget = 0;
    this.pendingOutcome = null;

    this.cacheDOM();
    this.bindEvents();
  }

  cacheDOM() {
    this.p1NameEl = document.getElementById('coin-p1-name');
    this.p2NameEl = document.getElementById('coin-p2-name');
    this.p1AvatarEl = document.getElementById('coin-p1-avatar-img');
    this.p2AvatarEl = document.getElementById('coin-p2-avatar-img');
    this.p1EmojiEl = document.getElementById('coin-p1-emoji-badge');
    this.p2EmojiEl = document.getElementById('coin-p2-emoji-badge');
    this.p1ScoreEl = document.getElementById('coin-p1-score');
    this.p2ScoreEl = document.getElementById('coin-p2-score');
    this.p1ChoiceBadge = document.getElementById('coin-p1-choice-badge');
    this.p2ChoiceBadge = document.getElementById('coin-p2-choice-badge');
    this.streakCount = document.getElementById('coin-streak-count');
    this.p1Card = document.getElementById('coin-p1-card');
    this.p2Card = document.getElementById('coin-p2-card');

    this.statusBanner = document.getElementById('coin-status-banner');
    this.statusText = document.getElementById('coin-status-text');
    this.autoRestartPill = document.getElementById('coin-auto-restart-pill');
    this.autoRestartNum = document.getElementById('coin-auto-restart-num');
    this.btnSkip = document.getElementById('btn-coin-skip-auto');

    this.coinEl = document.getElementById('coin-element');
    this.coinShadow = document.getElementById('coin-shadow');
    this.btnHeads = document.getElementById('btn-call-heads');
    this.btnTails = document.getElementById('btn-call-tails');
    this.btnFlip = document.getElementById('btn-flip-coin');

    this.statTotal = document.getElementById('stat-total-flips');
    this.statHeads = document.getElementById('stat-heads-flips');
    this.statTails = document.getElementById('stat-tails-flips');
    this.statRatio = document.getElementById('stat-fairness-ratio');
    this.statBest = document.getElementById('stat-best-streak');

    this.btnResetCoin = document.getElementById('btn-coin-reset');
    this.btnPause = document.getElementById('btn-coin-pause');
    this.btnSwitchTTT = document.getElementById('btn-coin-switch-ttt');
  }

  bindEvents() {
    this.btnHeads.addEventListener('click', () => this.setChoice('heads'));
    this.btnTails.addEventListener('click', () => this.setChoice('tails'));
    this.btnFlip.addEventListener('click', () => this.tossCoin());
    this.coinEl.addEventListener('click', () => this.tossCoin());
    this.btnPause.addEventListener('click', () => this.setPaused(!this.isPaused));
    if (this.btnSkip) this.btnSkip.addEventListener('click', () => { this.cancelAutoRestart(); this.tossCoin(); });
    this.btnResetCoin.addEventListener('click', () => this.resetStats());
    this.btnSwitchTTT.addEventListener('click', () => this.app.switchGameView('ttt'));
  }

  initProfiles(p1, p2) {
    this.p1NameEl.textContent = p1.name;
    this.p1AvatarEl.src = p1.avatar;
    this.p1EmojiEl.textContent = p1.emoji;
    this.p2NameEl.textContent = p2.name;
    this.p2AvatarEl.src = p2.avatar;
    this.p2EmojiEl.textContent = p2.emoji;
  }

  setChoice(choice, isRemote = false) {
    if (this.isPaused || this.isFlipping) return;
    const isGuest = this.app.gameMode === 'online' && this.app.networkRole === 'guest';
    if (isGuest) {
      this.player2Choice = choice;
      this.player1Choice = choice === 'heads' ? 'tails' : 'heads';
    } else {
      this.player1Choice = choice;
      this.player2Choice = choice === 'heads' ? 'tails' : 'heads';
    }

    const myChoice = isGuest ? this.player2Choice : this.player1Choice;
    this.btnHeads.classList.toggle('active', myChoice === 'heads');
    this.btnTails.classList.toggle('active', myChoice === 'tails');
    this.p1ChoiceBadge.textContent = this.player1Choice === 'heads' ? '👑 HEADS' : '⚡ TAILS';
    this.p2ChoiceBadge.textContent = this.player2Choice === 'heads' ? '👑 HEADS' : '⚡ TAILS';

    if (!isRemote && this.app.gameMode === 'online') {
      this.app.sendOnlineAction('COIN_CHOICE', { choice, role: this.app.networkRole });
    }
  }

  getFairResult() {
    const buf = new Uint32Array(2);
    window.crypto.getRandomValues(buf);
    let outcome = (buf[0] % 2 === 0) ? 'heads' : 'tails';
    if (this.history.length >= 3) {
      const last3 = this.history.slice(-3);
      if (last3.every(h => h === outcome)) {
        if ((buf[1] % 100) < 65) outcome = outcome === 'heads' ? 'tails' : 'heads';
      }
    }
    return outcome;
  }

  tossCoin(forcedOutcome = null, isRemote = false) {
    if (this.isPaused || this.isFlipping) return;
    this.cancelAutoRestart();
    this.isFlipping = true;
    this.btnFlip.disabled = true;
    this.btnFlip.innerHTML = '<span>⏳</span> <span>FLIPPING...</span>';

    const outcome = forcedOutcome || this.getFairResult();
    this.pendingOutcome = outcome;
    this.history.push(outcome);

    if (!isRemote && this.app.gameMode === 'online') {
      this.app.sendOnlineAction('COIN_TOSS', { outcome, caller: this.app.networkRole });
    }

    this.statusBanner.className = 'game-status-banner';
    this.statusText.textContent = '🪙 Coin is spinning in the air...';
    this.app.sound.playCoinToss();

    const baseTurns = 5;
    const fullTurns = Math.floor(this.currentRotation / 360);
    let target = (fullTurns + baseTurns) * 360;
    if (outcome === 'tails') target += 180;
    this.currentRotation = target;
    this.flipTarget = target;
    this.flipRemainingMs = 1800;

    this.coinEl.style.transition = 'transform 1.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
    this.coinEl.style.transform = `rotateY(${target}deg) scale(1.15)`;
    this.coinShadow.style.transform = 'scale(0.65)';
    this.coinShadow.style.opacity = '0.3';

    this.flipStartedAt = performance.now();
    this.flipTimeout = setTimeout(() => this.finishFlip(), this.flipRemainingMs);
  }

  finishFlip() {
    const outcome = this.pendingOutcome;
    this.flipTimeout = null;
    this.flipStartedAt = null;
    this.pendingOutcome = null;
    this.coinEl.style.transition = 'transform 0.2s ease-out';
    this.coinEl.style.transform = `rotateY(${this.flipTarget}deg) scale(1)`;
    this.coinShadow.style.transform = 'scale(1)';
    this.coinShadow.style.opacity = '1';
    this.app.sound.playCoinLand();
    this.isFlipping = false;
    this.btnHeads.disabled = this.isPaused;
    this.btnTails.disabled = this.isPaused;
    this.btnFlip.disabled = this.isPaused;
    this.btnFlip.innerHTML = '<span>🪙</span> <span>TOSS AGAIN</span>';
    if (outcome) this.resolveToss(outcome);
  }

  setPaused(paused) {
    if (this.isPaused === paused) return;
    this.isPaused = paused;
    this.btnPause.innerHTML = paused ? '<span>▶️</span> Play' : '<span>⏸️</span> Pause';
    this.btnPause.setAttribute('aria-pressed', String(paused));
    this.coinEl.classList.toggle('paused', paused);
    this.btnHeads.disabled = paused || this.isFlipping;
    this.btnTails.disabled = paused || this.isFlipping;
    this.btnFlip.disabled = paused || this.isFlipping;
    if (paused) {
      if (this.flipTimeout) {
        this.flipRemainingMs = Math.max(0, this.flipRemainingMs - (performance.now() - this.flipStartedAt));
        clearTimeout(this.flipTimeout);
        this.flipTimeout = null;
        this.flipStartedAt = null;
        const currentTransform = getComputedStyle(this.coinEl).transform;
        this.coinEl.style.transition = 'none';
        this.coinEl.style.transform = currentTransform;
        this.coinEl.offsetHeight;
      }
      this.statusText.textContent = '⏸ Game paused.';
    } else if (this.isFlipping && this.pendingOutcome) {
      this.coinEl.style.transition = `transform ${this.flipRemainingMs}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
      this.coinEl.style.transform = `rotateY(${this.flipTarget}deg) scale(1.15)`;
      this.flipStartedAt = performance.now();
      this.flipTimeout = setTimeout(() => this.finishFlip(), this.flipRemainingMs);
      this.statusText.textContent = '🪙 Coin is spinning in the air...';
    } else {
      this.btnFlip.innerHTML = this.stats.total ? '<span>🪙</span> <span>TOSS AGAIN</span>' : '<span>🪙</span> <span>TOSS COIN</span>';
      this.statusText.textContent = this.stats.total ? 'Game resumed — toss again when ready.' : 'Pick your side, then flip the coin!';
    }
    this.btnPause.setAttribute('aria-pressed', String(paused));
  }

  resolveToss(outcome) {
    const isGuest = this.app.gameMode === 'online' && this.app.networkRole === 'guest';
    const myChoice = isGuest ? this.player2Choice : this.player1Choice;
    const isMeWin = myChoice === outcome;
    const isP1Win = this.player1Choice === outcome;
    const label = outcome === 'heads' ? '👑 HEADS' : '⚡ TAILS';
    this.stats.total++;
    if (outcome === 'heads') this.stats.heads++; else this.stats.tails++;

    if (isP1Win) {
      this.scores.p1++;
    } else {
      this.scores.p2++;
    }

    if (isMeWin) {
      this.stats.streak++;
      if (this.stats.streak > this.stats.bestStreak) this.stats.bestStreak = this.stats.streak;
      this.statusBanner.className = 'game-status-banner win-banner';
      this.statusText.textContent = `🎉 It's ${label}! You predicted correctly! Click 'Toss Again' when ready.`;
      this.app.sound.playWin();
      this.app.confetti.burst(80);
    } else {
      this.stats.streak = 0;
      const winnerName = isP1Win ? this.p1NameEl.textContent : this.p2NameEl.textContent;
      this.statusBanner.className = 'game-status-banner timeout-banner';
      this.statusText.textContent = `⚔️ It's ${label}! ${winnerName} won this toss! Click 'Toss Again' when ready.`;
      this.app.sound.playTie();
    }

    this.updateStatsUI();
    // Coin is tossed only once. No auto-restart timer is started.
    // The coin will not be tossed again unless a player clicks "TOSS AGAIN".
  }

  updateStatsUI() {
    this.p1ScoreEl.textContent = this.scores.p1;
    this.p2ScoreEl.textContent = this.scores.p2;
    this.streakCount.textContent = this.stats.streak;
    this.statTotal.textContent = this.stats.total;
    this.statHeads.textContent = this.stats.heads;
    this.statTails.textContent = this.stats.tails;
    this.statBest.textContent = this.stats.bestStreak;
    if (this.stats.total > 0) {
      const h = Math.round((this.stats.heads / this.stats.total) * 100);
      this.statRatio.textContent = `${h}% / ${100 - h}%`;
    } else {
      this.statRatio.textContent = '50% / 50%';
    }
  }

  startAutoRestart(secs = 3) {
    // Disabled for coin toss: coin is tossed only once per player request
    this.cancelAutoRestart();
  }

  cancelAutoRestart() {
    if (this.autoRestartInterval) { clearInterval(this.autoRestartInterval); this.autoRestartInterval = null; }
    if (this.autoRestartPill) this.autoRestartPill.classList.add('hidden');
  }

  resetStats() {
    this.cancelAutoRestart();
    if (this.flipTimeout) { clearTimeout(this.flipTimeout); this.flipTimeout = null; }
    this.flipStartedAt = null;
    this.flipRemainingMs = 1800;
    this.pendingOutcome = null;
    this.isFlipping = false;
    this.setPaused(false);
    this.scores = { p1: 0, p2: 0 };
    this.stats = { total: 0, heads: 0, tails: 0, streak: 0, bestStreak: 0 };
    this.history = [];
    this.statusBanner.className = 'game-status-banner';
    this.statusText.textContent = 'Pick Heads or Tails, then flip the coin!';
    this.coinEl.style.transition = 'transform 0.2s ease-out';
    this.coinEl.style.transform = 'rotateY(0deg) scale(1)';
    this.coinShadow.style.transform = 'scale(1)';
    this.coinShadow.style.opacity = '1';
    this.currentRotation = 0;
    this.btnHeads.disabled = false;
    this.btnTails.disabled = false;
    this.btnFlip.disabled = false;
    this.btnFlip.innerHTML = '<span>🪙</span> <span>TOSS COIN</span>';
    this.updateStatsUI();
  }
}

// ==========================================
// 9. Chess
// ==========================================
class ChessGame {
  constructor(app) {
    this.app = app;
    this.boardEl = document.getElementById('chess-board');
    this.statusEl = document.getElementById('chess-status-text');
    this.turnLabel = document.getElementById('chess-turn-label');
    this.turnDot = document.getElementById('chess-turn-dot');
    this.p1Card = document.getElementById('chess-p1-card');
    this.p2Card = document.getElementById('chess-p2-card');
    this.selected = null;
    this.legalTargets = [];
    this.history = [];
    this.onlineMoves = [];
    this.onlineMoveSignature = '[]';
    this.scores = { w: 0, b: 0 };
    this.flipped = false;
    this.gameOver = false;
    this.lastWinner = null;
    this.isPaused = false;
    this.aiMoveTimeout = null;
    this.bindEvents();
    this.newGame();
  }

  initialState() {
    return {
      board: [
        'rnbqkbnr'.split(''), 'pppppppp'.split(''),
        Array(8).fill(null), Array(8).fill(null), Array(8).fill(null), Array(8).fill(null),
        'PPPPPPPP'.split(''), 'RNBQKBNR'.split('')
      ],
      turn: 'w',
      castling: { K: true, Q: true, k: true, q: true },
      enPassant: null,
      halfMoves: 0,
      fullMoves: 1
    };
  }

  bindEvents() {
    this.boardEl.addEventListener('click', event => {
      const square = event.target.closest('[data-square]');
      if (square) this.handleSquareClick(Number(square.dataset.square));
    });
    this.btnNewGame = document.getElementById('btn-chess-new-game');
    this.btnNewGame.addEventListener('click', () => this.requestNewGame());
    this.btnPause = document.getElementById('btn-chess-pause');
    this.btnPause.addEventListener('click', () => this.setPaused(!this.isPaused));
    this.btnUndo = document.getElementById('btn-chess-undo');
    document.getElementById('btn-chess-undo').addEventListener('click', () => this.undo());
    document.getElementById('btn-chess-flip').addEventListener('click', () => {
      this.flipped = !this.flipped;
      this.render();
    });
    document.getElementById('btn-chess-reset-scores').addEventListener('click', () => {
      if (this.app.gameMode === 'online') {
        this.app.sendOnlineAction('CHESS_RESET_SCORES');
      }
      this.scores = { w: 0, b: 0 };
      this.updateScores();
      this.newGame();
    });
  }

  newGame() {
    if (this.aiMoveTimeout) { clearTimeout(this.aiMoveTimeout); this.aiMoveTimeout = null; }
    this.state = this.initialState();
    this.history = [];
    this.onlineMoves = [];
    this.onlineMoveSignature = '[]';
    this.selected = null;
    this.legalTargets = [];
    this.gameOver = false;
    this.lastWinner = null;
    if (this.app.gameMode === 'online') {
      this.isPaused = false;
      this.btnPause.innerHTML = '<span>⏸️</span> Pause';
      this.btnPause.setAttribute('aria-pressed', 'false');
    } else {
      this.setPaused(false);
    }
    this.btnPause.disabled = this.app.gameMode === 'online';
    this.btnUndo.disabled = this.app.gameMode === 'online';
    this.positionCounts = new Map();
    this.recordPosition(this.state);
    this.render();
    this.updateStatus();
  }

  pieceAt(state, square) {
    return state.board[Math.floor(square / 8)][square % 8];
  }

  colorOf(piece) {
    return piece === piece.toUpperCase() ? 'w' : 'b';
  }

  inside(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  isAttacked(state, square, byColor) {
    const row = Math.floor(square / 8), col = square % 8;
    const pawnRow = row + (byColor === 'w' ? 1 : -1);
    for (const dc of [-1, 1]) {
      if (this.inside(pawnRow, col + dc)) {
        const p = this.pieceAt(state, pawnRow * 8 + col + dc);
        if (p && p.toLowerCase() === 'p' && this.colorOf(p) === byColor) return true;
      }
    }
    const knightSteps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of knightSteps) {
      if (!this.inside(row + dr, col + dc)) continue;
      const p = this.pieceAt(state, (row + dr) * 8 + col + dc);
      if (p && p.toLowerCase() === 'n' && this.colorOf(p) === byColor) return true;
    }
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        let r = row + dr, c = col + dc, distance = 1;
        while (this.inside(r, c)) {
          const p = this.pieceAt(state, r * 8 + c);
          if (p) {
            if (this.colorOf(p) === byColor) {
              const kind = p.toLowerCase();
              if (distance === 1 && kind === 'k') return true;
              if ((dr === 0 || dc === 0) && (kind === 'r' || kind === 'q')) return true;
              if (dr !== 0 && dc !== 0 && (kind === 'b' || kind === 'q')) return true;
            }
            break;
          }
          r += dr; c += dc; distance++;
        }
      }
    }
    return false;
  }

  kingInCheck(state, color) {
    const king = color === 'w' ? 'K' : 'k';
    for (let i = 0; i < 64; i++) {
      if (this.pieceAt(state, i) === king) return this.isAttacked(state, i, color === 'w' ? 'b' : 'w');
    }
    return true;
  }

  pseudoMoves(state, color) {
    const moves = [];
    const add = (from, to, extra = {}) => {
      const target = this.pieceAt(state, to);
      if (!target || this.colorOf(target) !== color) moves.push({ from, to, ...extra });
    };
    for (let from = 0; from < 64; from++) {
      const piece = this.pieceAt(state, from);
      if (!piece || this.colorOf(piece) !== color) continue;
      const row = Math.floor(from / 8), col = from % 8, kind = piece.toLowerCase();
      if (kind === 'p') {
        const direction = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 : 1;
        const promotionRow = color === 'w' ? 0 : 7;
        const oneRow = row + direction;
        if (this.inside(oneRow, col) && !this.pieceAt(state, oneRow * 8 + col)) {
          const to = oneRow * 8 + col;
          add(from, to, oneRow === promotionRow ? { promotion: color === 'w' ? 'Q' : 'q' } : {});
          const twoRow = row + direction * 2;
          if (row === startRow && !this.pieceAt(state, twoRow * 8 + col)) add(from, twoRow * 8 + col, { doublePawn: true });
        }
        for (const dc of [-1, 1]) {
          const r = row + direction, c = col + dc;
          if (!this.inside(r, c)) continue;
          const to = r * 8 + c, target = this.pieceAt(state, to);
          if ((target && this.colorOf(target) !== color) || to === state.enPassant) {
            add(from, to, {
              ...(r === promotionRow ? { promotion: color === 'w' ? 'Q' : 'q' } : {}),
              ...(to === state.enPassant ? { enPassant: true } : {})
            });
          }
        }
      } else if (kind === 'n' || kind === 'k') {
        const steps = kind === 'n'
          ? [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
          : [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        for (const [dr, dc] of steps) {
          if (this.inside(row + dr, col + dc)) add(from, (row + dr) * 8 + col + dc);
        }
        if (kind === 'k' && !this.kingInCheck(state, color)) {
          const base = color === 'w' ? 60 : 4;
          const rights = color === 'w' ? ['K', 'Q'] : ['k', 'q'];
          if (state.castling[rights[0]] && !this.pieceAt(state, base + 1) && !this.pieceAt(state, base + 2)
              && this.pieceAt(state, base + 3) === (color === 'w' ? 'R' : 'r')
              && !this.isAttacked(state, base + 1, color === 'w' ? 'b' : 'w')
              && !this.isAttacked(state, base + 2, color === 'w' ? 'b' : 'w')) {
            moves.push({ from, to: base + 2, castle: 'king' });
          }
          if (state.castling[rights[1]] && !this.pieceAt(state, base - 1) && !this.pieceAt(state, base - 2)
              && !this.pieceAt(state, base - 3)
              && this.pieceAt(state, base - 4) === (color === 'w' ? 'R' : 'r')
              && !this.isAttacked(state, base - 1, color === 'w' ? 'b' : 'w')
              && !this.isAttacked(state, base - 2, color === 'w' ? 'b' : 'w')) {
            moves.push({ from, to: base - 2, castle: 'queen' });
          }
        }
      } else {
        const directions = kind === 'b' ? [[-1,-1],[-1,1],[1,-1],[1,1]]
          : kind === 'r' ? [[-1,0],[1,0],[0,-1],[0,1]]
          : [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
        for (const [dr, dc] of directions) {
          let r = row + dr, c = col + dc;
          while (this.inside(r, c)) {
            const to = r * 8 + c, target = this.pieceAt(state, to);
            if (!target) moves.push({ from, to });
            else {
              if (this.colorOf(target) !== color) moves.push({ from, to });
              break;
            }
            r += dr; c += dc;
          }
        }
      }
    }
    return moves;
  }

  applyMove(state, move) {
    const next = {
      board: state.board.map(row => row.slice()),
      turn: state.turn === 'w' ? 'b' : 'w',
      castling: { ...state.castling },
      enPassant: null,
      halfMoves: state.halfMoves + 1,
      fullMoves: state.fullMoves + (state.turn === 'b' ? 1 : 0)
    };
    const piece = this.pieceAt(state, move.from);
    const captureSquare = move.enPassant ? move.to + (state.turn === 'w' ? 8 : -8) : move.to;
    const captured = this.pieceAt(state, captureSquare);
    next.board[Math.floor(move.from / 8)][move.from % 8] = null;
    if (move.enPassant) next.board[Math.floor(captureSquare / 8)][captureSquare % 8] = null;
    next.board[Math.floor(move.to / 8)][move.to % 8] = move.promotion || piece;
    if (move.castle) {
      const rookFrom = move.castle === 'king' ? move.from + 3 : move.from - 4;
      const rookTo = move.castle === 'king' ? move.from + 1 : move.from - 1;
      next.board[Math.floor(rookFrom / 8)][rookFrom % 8] = null;
      next.board[Math.floor(rookTo / 8)][rookTo % 8] = state.turn === 'w' ? 'R' : 'r';
    }
    if (piece.toLowerCase() === 'k') {
      if (state.turn === 'w') { next.castling.K = false; next.castling.Q = false; }
      else { next.castling.k = false; next.castling.q = false; }
    }
    if (move.from === 0 || move.to === 0) next.castling.q = false;
    if (move.from === 7 || move.to === 7) next.castling.k = false;
    if (move.from === 56 || move.to === 56) next.castling.Q = false;
    if (move.from === 63 || move.to === 63) next.castling.K = false;
    if (move.doublePawn) next.enPassant = (move.from + move.to) / 2;
    if (piece.toLowerCase() === 'p' || captured) next.halfMoves = 0;
    return next;
  }

  legalMoves(state = this.state, color = state.turn) {
    return this.pseudoMoves(state, color).filter(move => !this.kingInCheck(this.applyMove({ ...state, turn: color }, move), color));
  }

  handleSquareClick(square) {
    if (this.isPaused || this.gameOver || (this.app.gameMode === 'ai' && this.state.turn === 'b')) return;
    if (this.app.gameMode === 'online') {
      const playerColor = this.app.networkRole === 'host' ? 'w' : 'b';
      if (this.state.turn !== playerColor) return;
    }
    if (this.selected !== null) {
      const move = this.legalTargets.find(candidate => candidate.to === square);
      if (move) {
        this.playMove(move);
        return;
      }
    }
    const piece = this.pieceAt(this.state, square);
    if (piece && this.colorOf(piece) === this.state.turn) {
      this.selected = square;
      this.legalTargets = this.legalMoves().filter(move => move.from === square);
    } else {
      this.selected = null;
      this.legalTargets = [];
    }
    this.render();
  }

  playMove(move, fromRemote = false) {
    this.history.push(this.state);
    this.state = this.applyMove(this.state, move);
    this.recordPosition(this.state);
    this.selected = null;
    this.legalTargets = [];
    this.app.sound.playMove(move.from >= 48);
    this.render();
    const gameFinished = this.finishIfNeeded();
    if (this.app.gameMode === 'online') {
      this.onlineMoves.push({ from: move.from, to: move.to });
      this.onlineMoveSignature = JSON.stringify(this.onlineMoves);
      if (!fromRemote) {
        const result = gameFinished ? { winner: this.lastWinner || 'draw' } : null;
        this.app.sendOnlineAction('CHESS_MOVE', {
          move: { from: move.from, to: move.to },
          result
        }).then(response => {
          if (!response || !response.success) {
            this.statusEl.textContent = 'Online move was not accepted. Syncing the board...';
            if (this.app.networkMode === 'server' && this.app.roomId) {
              this.app.api.pollState(this.app.roomId, 0, 0).then(roomResponse => {
                if (roomResponse.room) {
                  this.app.processServerRoom(roomResponse.room);
                }
              });
            }
          }
        });
      }
    }
    if (gameFinished) return;
    if (this.app.gameMode === 'ai' && this.state.turn === 'b') {
      this.statusEl.textContent = 'Cyber AI is thinking...';
      this.aiMoveTimeout = setTimeout(() => {
        this.aiMoveTimeout = null;
        if (!this.isPaused && !this.gameOver && this.state.turn === 'b') {
          const aiMove = this.chooseAIMove();
          if (aiMove) this.playMove(aiMove);
        }
      }, 250);
    }
  }

  requestNewGame() {
    if (this.app.gameMode === 'online') this.app.sendOnlineAction('CHESS_NEW_GAME');
    this.newGame();
  }

  applyRemoteMove(move) {
    if (!Number.isInteger(move.from) || !Number.isInteger(move.to)) return;
    const legalMove = this.legalMoves().find(candidate => candidate.from === move.from && candidate.to === move.to);
    if (legalMove) this.playMove(legalMove, true);
  }

  applyOnlineMoves(moves, roomScores) {
    const normalizedMoves = moves.map(move => ({ from: move.from, to: move.to }));
    const signature = JSON.stringify(normalizedMoves);
    if (roomScores) {
      this.scores = { w: roomScores.p1 || 0, b: roomScores.p2 || 0 };
      this.updateScores();
    }
    if (signature === this.onlineMoveSignature) return;

    let state = this.initialState();
    const history = [];
    const positionCounts = new Map();
    const addPosition = position => {
      const key = this.positionKey(position);
      positionCounts.set(key, (positionCounts.get(key) || 0) + 1);
    };
    addPosition(state);

    for (const move of normalizedMoves) {
      if (!Number.isInteger(move.from) || !Number.isInteger(move.to)) return;
      const legalMove = this.legalMoves(state).find(candidate => candidate.from === move.from && candidate.to === move.to);
      if (!legalMove) {
        this.statusEl.textContent = 'Received an invalid Chess move. Waiting for a valid board update.';
        return;
      }
      history.push(state);
      state = this.applyMove(state, legalMove);
      addPosition(state);
    }

    this.state = state;
    this.history = history;
    this.positionCounts = positionCounts;
    this.onlineMoves = normalizedMoves;
    this.onlineMoveSignature = signature;
    this.selected = null;
    this.legalTargets = [];
    this.gameOver = false;
    this.lastWinner = null;
    this.finishIfNeeded(false);
    this.render();
  }

  setPaused(paused) {
    if (this.app.gameMode === 'online') return;
    if (this.isPaused === paused) return;
    this.isPaused = paused;
    this.btnPause.innerHTML = paused ? '<span>▶️</span> Play' : '<span>⏸️</span> Pause';
    this.btnPause.setAttribute('aria-pressed', String(paused));
    if (paused) {
      if (this.aiMoveTimeout) { clearTimeout(this.aiMoveTimeout); this.aiMoveTimeout = null; }
      this.statusEl.textContent = '⏸ Game paused.';
    } else {
      this.updateStatus();
      if (!this.gameOver && this.app.gameMode === 'ai' && this.state.turn === 'b') {
        this.statusEl.textContent = 'Cyber AI is thinking...';
        this.aiMoveTimeout = setTimeout(() => {
          this.aiMoveTimeout = null;
          if (!this.isPaused && !this.gameOver && this.state.turn === 'b') {
            const aiMove = this.chooseAIMove();
            if (aiMove) this.playMove(aiMove);
          }
        }, 250);
      }
    }
    this.render();
  }

  chooseAIMove() {
    const moves = this.legalMoves();
    if (!moves.length) return null;
    let bestMove = moves[0], bestScore = -Infinity;
    for (const move of moves) {
      const score = this.search(this.applyMove(this.state, move), 2, -Infinity, Infinity);
      if (score > bestScore) { bestScore = score; bestMove = move; }
    }
    return bestMove;
  }

  search(state, depth, alpha, beta) {
    const moves = this.legalMoves(state);
    if (!moves.length) {
      if (this.kingInCheck(state, state.turn)) return state.turn === 'b' ? -100000 : 100000;
      return 0;
    }
    if (!depth || state.halfMoves >= 100) return this.evaluate(state);
    const maximizing = state.turn === 'b';
    let value = maximizing ? -Infinity : Infinity;
    for (const move of moves) {
      const score = this.search(this.applyMove(state, move), depth - 1, alpha, beta);
      value = maximizing ? Math.max(value, score) : Math.min(value, score);
      if (maximizing) alpha = Math.max(alpha, value); else beta = Math.min(beta, value);
      if (beta <= alpha) break;
    }
    return value;
  }

  evaluate(state) {
    const values = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
    let score = 0;
    for (let square = 0; square < 64; square++) {
      const piece = this.pieceAt(state, square);
      if (!piece) continue;
      const val = values[piece.toLowerCase()];
      const row = Math.floor(square / 8), col = square % 8;
      const center = 7 - (Math.abs(3.5 - row) + Math.abs(3.5 - col));
      const positional = piece.toLowerCase() === 'p' ? (piece === piece.toUpperCase() ? 6 - row : row - 1) * 3 : center * 2;
      score += (piece === piece.toUpperCase() ? -1 : 1) * (val + positional);
    }
    return score;
  }

  finishIfNeeded(recordScore = true) {
    const moves = this.legalMoves();
    const inCheck = this.kingInCheck(this.state, this.state.turn);
    if (!moves.length) {
      this.gameOver = true;
      if (inCheck) {
        const winner = this.state.turn === 'w' ? 'b' : 'w';
        this.lastWinner = winner;
        if (recordScore) this.scores[winner]++;
        this.app.sound.playWin();
        this.statusEl.textContent = `Checkmate — ${winner === 'w' ? 'White' : 'Black'} wins!`;
      } else {
        this.statusEl.textContent = 'Draw by stalemate.';
        this.app.sound.playTie();
      }
      this.updateScores();
    } else if (this.state.halfMoves >= 100) {
      this.gameOver = true;
      this.statusEl.textContent = 'Draw by the 50-move rule.';
      this.app.sound.playTie();
    } else if ((this.positionCounts.get(this.positionKey(this.state)) || 0) >= 3) {
      this.gameOver = true;
      this.statusEl.textContent = 'Draw by threefold repetition.';
      this.app.sound.playTie();
    } else if (this.isInsufficientMaterial()) {
      this.gameOver = true;
      this.statusEl.textContent = 'Draw by insufficient material.';
      this.app.sound.playTie();
    } else if (inCheck) {
      this.statusEl.textContent = `${this.state.turn === 'w' ? 'White' : 'Black'} is in check.`;
    } else {
      this.updateStatus();
    }
    this.updateTurnIndicator();
    return this.gameOver;
  }

  updateStatus() {
    const side = this.state.turn === 'w' ? 'White' : 'Black';
    this.statusEl.textContent = `${side}'s turn${this.app.gameMode === 'ai' && this.state.turn === 'b' ? ' — Cyber AI' : ''}.`;
    this.updateTurnIndicator();
  }

  updateTurnIndicator() {
    const whiteTurn = this.state.turn === 'w';
    this.turnLabel.textContent = this.gameOver ? 'Game over' : whiteTurn ? 'White to move' : 'Black to move';
    this.turnDot.classList.toggle('chess-dot-white', whiteTurn);
    this.turnDot.classList.toggle('chess-dot-black', !whiteTurn);
    this.p1Card.classList.toggle('active-turn', whiteTurn && !this.gameOver);
    this.p2Card.classList.toggle('active-turn', !whiteTurn && !this.gameOver);
  }

  positionKey(state) {
    const castling = ['K', 'Q', 'k', 'q'].filter(right => state.castling[right]).join('');
    return `${state.board.flat().map(piece => piece || '.').join('')}:${state.turn}:${castling}:${state.enPassant ?? '-'}`;
  }

  recordPosition(state, delta = 1) {
    const key = this.positionKey(state);
    const count = (this.positionCounts.get(key) || 0) + delta;
    if (count > 0) this.positionCounts.set(key, count);
    else this.positionCounts.delete(key);
  }

  isInsufficientMaterial() {
    const material = [];
    for (let square = 0; square < 64; square++) {
      const piece = this.pieceAt(this.state, square);
      if (piece && piece.toLowerCase() !== 'k') material.push({ piece: piece.toLowerCase(), square });
    }
    if (!material.length) return true;
    if (material.some(item => ['p', 'r', 'q'].includes(item.piece))) return false;
    if (material.length === 1) return true;
    return material.every(item => item.piece === 'b')
      && material.every(item => ((Math.floor(item.square / 8) + item.square % 8) % 2)
        === ((Math.floor(material[0].square / 8) + material[0].square % 8) % 2));
  }

  updateScores() {
    document.getElementById('chess-p1-score').textContent = this.scores.w;
    document.getElementById('chess-p2-score').textContent = this.scores.b;
  }

  render() {
    const glyphs = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
    this.boardEl.innerHTML = '';
    for (let displayRow = 0; displayRow < 8; displayRow++) {
      for (let displayCol = 0; displayCol < 8; displayCol++) {
        const row = this.flipped ? 7 - displayRow : displayRow;
        const col = this.flipped ? 7 - displayCol : displayCol;
        const square = row * 8 + col, piece = this.pieceAt(this.state, square);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `chess-square ${(row + col) % 2 ? 'dark' : 'light'}`;
        button.dataset.square = square;
        button.setAttribute('aria-label', `${String.fromCharCode(97 + col)}${8 - row}${piece ? ` ${this.colorOf(piece) === 'w' ? 'white' : 'black'} ${piece.toLowerCase()}` : ' empty'}`);
        if (square === this.selected) button.classList.add('selected');
        if (this.legalTargets.some(move => move.to === square)) button.classList.add(piece ? 'capture-target' : 'legal-target');
        if (piece) {
          const pieceEl = document.createElement('span');
          pieceEl.className = `chess-piece ${this.colorOf(piece) === 'w' ? 'white-piece' : 'black-piece'}`;
          pieceEl.textContent = glyphs[piece];
          button.appendChild(pieceEl);
        }
        this.boardEl.appendChild(button);
      }
    }
    this.updateScores();
    if (!this.gameOver) this.updateTurnIndicator();
  }

  undo() {
    if (!this.history.length) return;
    if (this.lastWinner) this.scores[this.lastWinner] = Math.max(0, this.scores[this.lastWinner] - 1);
    this.recordPosition(this.state, -1);
    this.state = this.history.pop();
    if (this.app.gameMode === 'ai' && this.state.turn === 'b' && this.history.length) {
      this.recordPosition(this.state, -1);
      this.state = this.history.pop();
    }
    this.selected = null;
    this.legalTargets = [];
    this.gameOver = false;
    this.lastWinner = null;
    if (this.aiMoveTimeout) { clearTimeout(this.aiMoveTimeout); this.aiMoveTimeout = null; }
    this.render();
    this.updateStatus();
  }
}

// ==========================================
// 10. Master App Controller
// ==========================================
class CyberArcadeApp {
  constructor() {
    this.sound = new SoundFX();
    this.confetti = new ConfettiEngine(document.getElementById('confetti-canvas'));
    this.api = new ServerAPI();

    // Profiles
    this.player1 = { name: 'Player 1', avatar: PRESET_AVATARS[1], emoji: '🔥' };
    this.player2 = { name: 'Cyber AI', avatar: PRESET_AVATARS[0], emoji: '🤖' };

    // Game config
    this.gameMode = 'ai'; // 'ai', 'pvp', 'online'
    this.aiDifficulty = 'medium';
    this.turnTimer = 10;
    this.activeView = 'ttt';

    // Network
    this.networkMode = null; // 'server' or 'peerjs'
    this.networkRole = null; // 'host' or 'guest'
    this.roomId = null;
    this.peer = null;
    this.conn = null;
    this.pollVersion = 0;
    this.isPolling = false;
    this.processedEventKeys = new Set();

    // Games
    this.tttGame = new TicTacToeGame(this);
    this.coinGame = new CoinTossGame(this);

    // Landing Wizard
    this.wizard = new LandingWizard(this);

    // Arena elements
    this.screenLanding = document.getElementById('screen-landing');
    this.screenGame = document.getElementById('screen-game');
    this.arenaHeaderIcon = document.getElementById('arena-header-icon');
    this.arenaGameTitle = document.getElementById('arena-game-title');
    this.viewTTT = document.getElementById('view-tic-tac-toe');
    this.viewCoin = document.getElementById('view-coin-toss');
    this.viewChess = document.getElementById('view-chess');
    this.navTTT = document.getElementById('arena-nav-ttt');
    this.navCoin = document.getElementById('arena-nav-coin');
    this.navChess = document.getElementById('arena-nav-chess');
    this.onlineBadge = document.getElementById('online-badge');
    this.onlineBadgeText = document.getElementById('online-badge-text');
    this.matchTimerDisplay = document.getElementById('match-timer-display');
    this.matchTimerInterval = null;
    this.matchStartTime = null;

    this.chessGame = new ChessGame(this);
    this.bindArenaEvents();

    // Sound toggle
    const btnSound = document.getElementById('btn-sound');
    const soundIcon = document.getElementById('sound-icon');
    btnSound.addEventListener('click', () => {
      const on = this.sound.toggle();
      soundIcon.textContent = on ? '🔊' : '🔇';
    });

    // Customization modal
    this.setupCustomModal();
  }

  bindArenaEvents() {
    this.navTTT.addEventListener('click', () => this.switchGameView('ttt'));
    this.navCoin.addEventListener('click', () => this.switchGameView('coin'));
    this.navChess.addEventListener('click', () => this.switchGameView('chess'));

    document.getElementById('btn-back-to-lobby').addEventListener('click', () => {
      this.backToLobby();
    });

    // Online badge buttons
    document.getElementById('btn-quick-copy-link').addEventListener('click', () => {
      if (this.roomId) {
        copyToClipboard(`${window.location.origin}/?room=${this.roomId}`).then(ok => {
          if (ok) {
            const el = document.getElementById('btn-quick-copy-link');
            el.textContent = '✅ Copied!';
            setTimeout(() => { el.textContent = '🔗 Invite'; }, 2000);
          }
        });
      }
    });

    document.getElementById('btn-disconnect-online').addEventListener('click', () => {
      this.disconnectOnline();
      this.backToLobby();
    });
  }

  setupCustomModal() {
    const modal = document.getElementById('custom-modal');
    const btnOpen = document.getElementById('btn-customize-open');
    const btnClose = document.getElementById('modal-close');
    const btnSave = document.getElementById('modal-save-btn');

    const p1NameInput = document.getElementById('p1-name-input');
    const p2NameInput = document.getElementById('p2-name-input');
    const p1Preview = document.getElementById('p1-preview-img');
    const p2Preview = document.getElementById('p2-preview-img');
    const p1FileInput = document.getElementById('p1-file-input');
    const p2FileInput = document.getElementById('p2-file-input');
    const p1AvatarPresetsEl = document.getElementById('p1-avatar-presets');
    const p2AvatarPresetsEl = document.getElementById('p2-avatar-presets');
    const p1EmojiPresetsEl = document.getElementById('p1-emoji-presets');
    const p2EmojiPresetsEl = document.getElementById('p2-emoji-presets');

    let p1TempAvatar, p2TempAvatar, p1TempEmoji, p2TempEmoji;

    const renderPresets = (container, playerNum) => {
      container.innerHTML = '';
      PRESET_AVATARS.forEach((src, i) => {
        const btn = document.createElement('button');
        btn.className = 'preset-avatar-btn';
        btn.innerHTML = `<img src="${src}" alt="Preset ${i + 1}">`;
        btn.addEventListener('click', () => {
          if (playerNum === 1) { p1TempAvatar = src; p1Preview.src = src; }
          else { p2TempAvatar = src; p2Preview.src = src; }
          container.querySelectorAll('.preset-avatar-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        });
        container.appendChild(btn);
      });
    };

    const renderEmoji = (container, playerNum) => {
      container.innerHTML = '';
      PRESET_EMOJIS.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'preset-emoji-btn';
        btn.textContent = emoji;
        btn.addEventListener('click', () => {
          if (playerNum === 1) p1TempEmoji = emoji; else p2TempEmoji = emoji;
          container.querySelectorAll('.preset-emoji-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        });
        container.appendChild(btn);
      });
    };

    renderPresets(p1AvatarPresetsEl, 1);
    renderPresets(p2AvatarPresetsEl, 2);
    renderEmoji(p1EmojiPresetsEl, 1);
    renderEmoji(p2EmojiPresetsEl, 2);

    p1FileInput.addEventListener('change', (e) => {
      const file = e.target.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = (ev) => { p1TempAvatar = ev.target.result; p1Preview.src = ev.target.result; };
      r.readAsDataURL(file);
    });

    p2FileInput.addEventListener('change', (e) => {
      const file = e.target.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = (ev) => { p2TempAvatar = ev.target.result; p2Preview.src = ev.target.result; };
      r.readAsDataURL(file);
    });

    btnOpen.addEventListener('click', () => {
      p1NameInput.value = this.player1.name;
      p2NameInput.value = this.player2.name;
      p1Preview.src = this.player1.avatar;
      p2Preview.src = this.player2.avatar;
      p1TempAvatar = this.player1.avatar;
      p2TempAvatar = this.player2.avatar;
      p1TempEmoji = this.player1.emoji;
      p2TempEmoji = this.player2.emoji;
      modal.classList.add('open');
    });

    btnClose.addEventListener('click', () => modal.classList.remove('open'));

    btnSave.addEventListener('click', () => {
      this.player1.name = p1NameInput.value.trim() || 'Player 1';
      this.player1.avatar = p1TempAvatar || this.player1.avatar;
      this.player1.emoji = p1TempEmoji || this.player1.emoji;
      this.player2.name = p2NameInput.value.trim() || 'Player 2';
      this.player2.avatar = p2TempAvatar || this.player2.avatar;
      this.player2.emoji = p2TempEmoji || this.player2.emoji;

      this.tttGame.initProfiles(this.player1, this.player2);
      this.coinGame.initProfiles(this.player1, this.player2);
      this.tttGame.updateTurnDisplay();
      document.getElementById('chess-p1-name').textContent = this.player1.name;
      document.getElementById('chess-p1-avatar').src = this.player1.avatar;
      document.getElementById('chess-p1-emoji').textContent = this.player1.emoji;
      document.getElementById('chess-p2-name').textContent = this.player2.name;
      document.getElementById('chess-p2-avatar').src = this.player2.avatar;
      document.getElementById('chess-p2-emoji').textContent = this.player2.emoji;
      modal.classList.remove('open');
    });
  }

  // ---- Start the Arena ----
  startArena(gameKey, mode, p1, p2) {
    this.player1 = p1;
    this.player2 = p2;
    this.gameMode = mode;

    // Switch screens
    this.screenLanding.classList.add('hidden');
    this.screenGame.classList.remove('hidden');

    // Init profiles in both games
    this.tttGame.initProfiles(p1, p2);
    this.coinGame.initProfiles(p1, p2);
    this.chessGame.newGame();
    document.getElementById('chess-p1-name').textContent = p1.name;
    document.getElementById('chess-p1-avatar').src = p1.avatar;
    document.getElementById('chess-p1-emoji').textContent = p1.emoji;
    document.getElementById('chess-p2-name').textContent = p2.name;
    document.getElementById('chess-p2-avatar').src = p2.avatar;
    document.getElementById('chess-p2-emoji').textContent = p2.emoji;

    // Show correct game view
    this.switchGameView(gameKey);

    // Start match timer
    this.startMatchTimer();

    // Online badge
    if (mode === 'online') {
      this.onlineBadge.classList.remove('hidden');
      const onlineLabel = gameKey === 'chess'
        ? (this.networkRole === 'host' ? 'Host (White)' : 'Guest (Black)')
        : (this.networkRole === 'host' ? 'Host (X)' : 'Guest (O)');
      this.onlineBadgeText.textContent = `Online: ${onlineLabel}`;
      // Start polling for state updates
      if (this.networkMode === 'server') {
        this.startServerPolling();
      }
    } else {
      this.onlineBadge.classList.add('hidden');
    }

    // Start the first round
    if (gameKey === 'ttt') {
      this.tttGame.startRound();
    }
  }

  switchGameView(gameKey) {
    this.activeView = gameKey;
    this.navTTT.classList.toggle('active', gameKey === 'ttt');
    this.navCoin.classList.toggle('active', gameKey === 'coin');
    this.navChess.classList.toggle('active', gameKey === 'chess');
    this.viewTTT.classList.toggle('hidden', gameKey !== 'ttt');
    this.viewCoin.classList.toggle('hidden', gameKey !== 'coin');
    this.viewChess.classList.toggle('hidden', gameKey !== 'chess');
    if (gameKey === 'ttt') {
      this.arenaHeaderIcon.textContent = '⚡';
      this.arenaGameTitle.innerHTML = 'Tic-Tac-Toe <span class="badge-neon">PRO</span>';
      this.coinGame.cancelAutoRestart();
    } else if (gameKey === 'coin') {
      this.arenaHeaderIcon.textContent = '🪙';
      this.arenaGameTitle.innerHTML = 'Coin Toss <span class="badge-neon">FAIR AI</span>';
      this.tttGame.cancelAutoRestart();
    } else {
      this.arenaHeaderIcon.textContent = '♟️';
      const chessBadge = this.gameMode === 'online' ? 'ONLINE' : 'MINIMAX';
      this.arenaGameTitle.innerHTML = `Chess <span class="badge-neon">${chessBadge}</span>`;
      this.tttGame.cancelAutoRestart();
      this.coinGame.cancelAutoRestart();
    }
  }

  startMatchTimer() {
    if (this.matchTimerInterval) clearInterval(this.matchTimerInterval);
    this.matchStartTime = Date.now();
    this.matchTimerInterval = setInterval(() => {
      const s = Math.floor((Date.now() - this.matchStartTime) / 1000);
      this.matchTimerDisplay.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }, 1000);
  }

  backToLobby() {
    this.disconnectOnline();
    if (this.matchTimerInterval) clearInterval(this.matchTimerInterval);
    this.tttGame.cancelAutoRestart();
    this.coinGame.cancelAutoRestart();
    this.screenGame.classList.add('hidden');
    this.screenLanding.classList.remove('hidden');
    window.history.replaceState({}, '', window.location.pathname);
  }

  // ---- Online Communication ----
  async sendOnlineAction(action, payload = {}) {
    if (this.networkMode === 'server' && this.roomId) {
      return this.api.sendAction(this.roomId, this.networkRole === 'host' ? 'p1' : 'p2', action, payload);
    } else if (this.networkMode === 'peerjs' && this.conn && this.conn.open) {
      try {
        this.conn.send({ type: action, ...payload });
        return { success: true };
      } catch (e) {
        console.warn('Send error:', e);
        return { success: false, error: e.message };
      }
    }
    return { success: false, error: 'Not connected to an online room.' };
  }

  // ---- Server State Polling ----
  async startServerPolling() {
    this.isPolling = true;
    this.pollVersion = 0;

    const poll = async () => {
      if (!this.isPolling || this.networkMode !== 'server' || !this.roomId) return;

      const res = await this.api.pollState(this.roomId, this.pollVersion, 8);
      if (res.aborted || !this.isPolling) return;
      if (res.waiting) {
        setTimeout(poll, 500);
        return;
      }

      if (res.error) {
        setTimeout(poll, 2500);
        return;
      }

      if (res.room && res.version > this.pollVersion) {
        this.pollVersion = res.version;
        this.processServerRoom(res.room);
      }

      setTimeout(poll, 200);
    };

    poll();
  }

  processServerRoom(room) {
    // Update profiles
    if (room.p1) {
      this.player1.name = room.p1.name || this.player1.name;
      if (room.p1.avatar) this.player1.avatar = room.p1.avatar;
      if (room.p1.emoji) this.player1.emoji = room.p1.emoji;
    }
    if (room.p2 && room.p2.connected) {
      this.player2.name = room.p2.name || this.player2.name;
      if (room.p2.avatar) this.player2.avatar = room.p2.avatar;
      if (room.p2.emoji) this.player2.emoji = room.p2.emoji;
    }

    this.tttGame.initProfiles(this.player1, this.player2);
    this.coinGame.initProfiles(this.player1, this.player2);

    if (room.gameType === 'chess' && room.gameState && Array.isArray(room.gameState.chessMoves)) {
      this.chessGame.applyOnlineMoves(room.gameState.chessMoves, room.scores);
    }

    // Apply game state for TTT
    if (room.gameState && this.activeView === 'ttt') {
      this.tttGame.applyServerState(room.gameState, room.scores);
    }

    // Process events (chat, reactions, coin toss, coin choice)
    if (room.events && room.events.length > 0) {
      const myRole = this.networkRole === 'host' ? 'p1' : 'p2';
      room.events.forEach(ev => {
        if (ev.sender === myRole) return; // Skip own events
        const evKey = `${ev.type}_${ev.sender}_${ev.timestamp}`;
        if (this.processedEventKeys.has(evKey)) return;
        this.processedEventKeys.add(evKey);

        if (ev.type === 'CHAT' && ev.payload) {
          this.tttGame.showSpeechBubble(ev.payload.player, ev.payload.message);
        } else if (ev.type === 'REACTION' && ev.payload) {
          this.tttGame.triggerFloatingReaction(ev.payload.player, ev.payload.emoji);
        } else if (ev.type === 'COIN_TOSS' && ev.payload) {
          if (!this.coinGame.isFlipping) {
            this.coinGame.tossCoin(ev.payload.outcome, true);
          }
        } else if (ev.type === 'COIN_CHOICE' && ev.payload) {
          this.coinGame.setChoice(ev.payload.choice, true);
        } else if (ev.type === 'NEW_ROUND') {
          this.tttGame.cancelAutoRestart();
          this.tttGame.startRound();
        } else if (ev.type === 'RESET_SCORES') {
          this.tttGame.resetScores();
        }
      });
    }
  }

  disconnectOnline() {
    this.isPolling = false;
    this.api.stopPolling();
    if (this.roomId && this.networkMode === 'server') {
      this.api.leaveRoom(this.roomId, this.networkRole === 'host' ? 'p1' : 'p2');
    }
    if (this.conn) { try { this.conn.close(); } catch (e) {} this.conn = null; }
    if (this.peer) { try { this.peer.destroy(); } catch (e) {} this.peer = null; }
    this.networkMode = null;
    this.networkRole = null;
    this.roomId = null;
    this.onlineBadge.classList.add('hidden');
  }

  // ---- PeerJS Connection Handlers ----
  setupPeerHandlers(conn, myProfile) {
    conn.on('open', () => {
      this.sound.playJoin();

      if (this.networkRole === 'host') {
        conn.send({
          type: 'HANDSHAKE_HOST',
          profile: myProfile,
          turnTimer: this.turnTimer,
          gameType: this.wizard.selectedGame
        });
      } else {
        conn.send({ type: 'HANDSHAKE_GUEST', profile: myProfile });
      }
    });

    conn.on('data', (data) => this.handlePeerMessage(data));

    conn.on('close', () => {
      this.tttGame.statusBanner.className = 'game-status-banner timeout-banner';
      this.tttGame.statusText.textContent = '⚠️ Opponent disconnected.';
    });
  }

  handlePeerMessage(data) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'HANDSHAKE_HOST':
        this.player1 = { ...this.player1, ...data.profile };
        if (data.turnTimer) this.turnTimer = data.turnTimer;
        this.tttGame.initProfiles(this.player1, this.player2);
        this.coinGame.initProfiles(this.player1, this.player2);

        // Guest: now enter arena
        if (this.networkRole === 'guest') {
          const selectedGame = data.gameType || this.wizard.selectedGame || 'ttt';
          this.startArena(selectedGame, 'online', this.player1, this.player2);
        }
        break;

      case 'HANDSHAKE_GUEST':
        this.player2 = { ...this.player2, ...data.profile };
        this.tttGame.initProfiles(this.player1, this.player2);
        this.coinGame.initProfiles(this.player1, this.player2);

        // Host: show friend joined in wizard, then enter arena
        if (this.networkRole === 'host') {
          this.wizard.lobbyFriendJoined.classList.remove('hidden');
          this.wizard.lobbyFriendName.textContent = this.player2.name;
          this.wizard.lobbyWaitTitle.textContent = 'Friend Connected! 🎉';
          setTimeout(() => {
            const selectedGame = this.wizard.selectedGame || 'ttt';
            this.startArena(selectedGame, 'online', this.player1, this.player2);
          }, 1200);
        }
        break;

      case 'MOVE':
        if (typeof data.index === 'number') this.tttGame.executeMove(data.index, true);
        break;

      case 'REACTION':
        if (data.player && data.emoji) this.tttGame.triggerFloatingReaction(data.player, data.emoji);
        break;

      case 'CHAT':
        if (data.player && data.message) this.tttGame.showSpeechBubble(data.player, data.message);
        break;

      case 'NEW_ROUND':
      case 'AUTO_RESTART':
        this.tttGame.cancelAutoRestart();
        this.tttGame.startRound();
        break;

      case 'RESET_SCORES':
        this.tttGame.resetScores();
        break;

      case 'COIN_TOSS':
        if (data.outcome && !this.coinGame.isFlipping) {
          this.coinGame.tossCoin(data.outcome, true);
        }
        break;

      case 'COIN_CHOICE':
        if (data.choice) {
          this.coinGame.setChoice(data.choice, true);
        }
        break;

      case 'CHESS_MOVE':
        if (data.move) this.chessGame.applyRemoteMove(data.move);
        break;

      case 'CHESS_NEW_GAME':
        this.chessGame.newGame();
        break;

      case 'CHESS_RESET_SCORES':
        this.chessGame.scores = { w: 0, b: 0 };
        this.chessGame.updateScores();
        this.chessGame.newGame();
        break;
    }
  }
}

// ==========================================
// 10. Initialize on Page Load
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  window.arcadeApp = new CyberArcadeApp();
});
