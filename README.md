# Cyber Arcade Pro ⚡🪙

A feature-packed, modern cyberpunk arcade featuring three games:
1. **⚡ Tic-Tac-Toe Pro**: Turn Countdown Timers, Match Stopwatch, Minimax AI (Unbeatable), Local 2-Player, and **Live Online Multiplayer across 2 Laptops (WebRTC P2P)**.
2. **🪙 Coin Toss (Heads & Tails)**: 3D Animated Coin, Cryptographically Fair Randomizer, Streak Tracking, and AI Decider.
3. **♟️ Chess Pro**: Legal chess moves, check/checkmate and stalemate detection, castling, en passant, pawn promotion, undo, and a Minimax AI opponent. Supports AI, local two-player, and online friend matches.

---

## 🌟 What's New

1. **🪙 Coin Toss (Heads & Tails) Game**:
   - Easily switch between **Tic-Tac-Toe** and **Coin Toss** anytime from the top navigation bar.
   - **Fair & Unpredictable AI**: Utilizes the browser's cryptographic randomness (`window.crypto.getRandomValues`) with an anti-clustering balance algorithm so neither Heads nor Tails repeats endlessly.
   - **Tactile 3D Coin Physics**: Dual-sided 3D medal disc with Gold Crown (Heads) and Silver Lightning (Tails) tumbling realistically in 3D perspective with shadows and metallic audio.
   - **Streak & Stats Tracking**: Keeps track of total flips, Heads count, Tails count, win streaks, and 50/50 fairness ratio.

2. **🔄 Automatic Game Restart & Timer Reset**:
   - When a match finishes (win, draw, or timeout), a smooth 3-second countdown automatically restarts the next game!
   - Both the board and the turn timer reset automatically so you can play round after round effortlessly.
   - A convenient **"Play Now ⏩"** button allows skipping the countdown if you want immediate action.

3. **🖱️ Enhanced Interactive Hover Cursor**:
   - Empty, clickable Tic-Tac-Toe cells now display an interactive pointer cursor with elevated lift, glowing border, and a subtle **ghost preview** showing the symbol (`X` or `O`) that will be placed.
   - Taken or locked cells display an explicit `not-allowed` cursor.

4. **🎨 Refined, Lighter Studio Aesthetic**:
   - Upgraded from ultra-dark to an elegant slate & deep navy studio palette (`#151a2d`, `#1e243c`).
   - Higher-contrast text, softer ambient glows, and clean glassmorphism cards that look professional and easy on the eyes.

---

## 🎮 Features

- **♟️ Chess Pro**:
  - Play against the Minimax AI, pass and play locally, or create/join an online room. The host plays White; the joining friend plays Black.
  - Legal moves, check/checkmate, stalemate, castling, en passant, queen promotion, undo, and board flip.
- **⏸️ Pause, Play & Restart Controls**:
  - Pause and resume gameplay in Tic-Tac-Toe, Coin Toss, and Chess.
  - Restart the current round or game from each game screen.
- **🌐 Real-Time Online Multiplayer**:
  - Room-based game-state synchronization lets friends play Tic-Tac-Toe or Chess online; Chess moves are checked against the legal-move engine on both devices.
  - Direct WebRTC peer-to-peer data channels powered by PeerJS are also used as a connection fallback.
  - Generate a unique invite link (e.g. `https://.../?room=CYBER-7X9K`) and send it to your friend.
  - When they open the link on their laptop, they join as Player 2 (`O`) and both of you play simultaneously!
- **⏱️ Turn Countdown Timer & Stopwatch**:
  - Blitz (5s), Fast (10s), Standard (15s), Relaxed (30s), or No Limit.
  - Automatic forfeit with buzzer when the timer runs out.
- **🤖 Smart AI Modes**:
  - Easy, Tactical Medium, and Unbeatable Minimax algorithm.
- **👤 Custom Profiles & Photos**:
  - Upload your own picture from your computer or choose from 6 built-in cyberpunk avatars.
  - Pick from 16 emoji badges.
- **💬 Quick Taunts & Emojis**:
  - Send quick chat taunts ("Good luck! ⚡", "Nice move! 🎯", "Close one! 😱") that float as speech bubbles over player cards.
  - Floating emoji reactions (`🔥`, `😎`, `💀`, `🤖`).
- **🔊 Synthesized Web Audio**:
  - Zero external sound files needed — pure Web Audio API synthesis for moves, timer ticks, victory fanfares, and metallic coin flips.

---

## 🚀 How to Play on 2 Different Laptops

### Method A: Same Wi-Fi Network (Home, Office, Dorm)
1. On your laptop, open PowerShell or Terminal in this folder and run:
   ```powershell
   python server.py
   ```
2. The server script displays your computer's local Wi-Fi address, for example:
   ```
   💻 THIS LAPTOP:           http://localhost:8000
   👥 FRIEND'S LAPTOP:       http://192.168.1.15:8000
   ```
   These direct local links use unencrypted HTTP by default. Do not use them for private traffic on an untrusted network.
3. Open `http://localhost:8000` in your web browser.
4. Click **"🌐 Online Friend"** (or **"Invite Friend"**), copy the link, and send it to your friend!
5. Once your friend opens the link on their laptop, both laptops connect in real time!

### Method B: Over the Internet (Anywhere in the World)
The Cloudflare Tunnel public URL uses HTTPS, encrypting traffic between players' browsers and Cloudflare. Encryption from the tunnel process to the origin depends on the tunnel's origin URL; if it uses `http://localhost`, that last hop is unencrypted loopback traffic on the host. Keep the tunnel URL in `tunnel_url.txt`; the server ignores public invite URLs that do not use HTTPS.
- **Netlify Drop (Takes 30 seconds, 100% Free)**:
  1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
  2. Drag and drop this folder.
  3. You get an instant public HTTPS URL!
- **GitHub Pages**:
  1. Push this folder to a GitHub repository and enable Pages in Settings.

## 🔒 HTTPS / TLS for Direct Hosting

The Python server can serve HTTPS directly when given a certificate and its private key. Use a certificate trusted by the devices that will connect, with Subject Alternative Names matching the hostname or IP address they use. For example, in PowerShell:

```powershell
$env:ARCADE_TLS_CERTFILE = "C:\path\to\fullchain.pem"
$env:ARCADE_TLS_KEYFILE = "C:\path\to\privkey.pem"
python server.py
```

Set both environment variables; startup fails with an explicit error if only one is set or the certificate cannot be loaded. TLS is restricted to TLS 1.2 or newer. Do not commit private keys or distribute self-signed certificates as if they were trusted. Without a certificate, localhost and same-Wi-Fi connections remain HTTP; a public HTTPS tunnel still encrypts browser-to-Cloudflare traffic.

The server also sends browser security headers, including HSTS when direct TLS or a validated HTTPS tunnel is configured. API access is same-origin; cross-origin access is not enabled.
