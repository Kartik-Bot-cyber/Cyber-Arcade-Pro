#!/usr/bin/env python3
"""
Cyber Arcade Pro — High Performance Multiplayer Backend Server & REST API
Zero external dependencies (uses standard Python 3 libraries).
Supports real-time synchronization across multiple devices (laptops, phones, tablets) on the local network or internet.
"""

import http.server
import socket
import socketserver
import sys
import os
import json
import time
import threading
import urllib.parse
import urllib.request
import ssl

# Ensure Windows stdout/stderr never crash on emojis
try:
    if sys.stdout:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)
    if sys.stderr:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)
except Exception:
    pass

DEFAULT_PORT = 8000
TLS_CERTFILE_ENV = 'ARCADE_TLS_CERTFILE'
TLS_KEYFILE_ENV = 'ARCADE_TLS_KEYFILE'

# Thread-safe in-memory room storage
rooms = {}
rooms_lock = threading.Lock()
room_conditions = {} # roomId -> threading.Condition()

def get_local_ip():
    """Identifies the computer's local IP address on Wi-Fi/LAN."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def get_public_url():
    """Reads configured public tunnel URL (e.g. Cloudflare tunnel) if present."""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        fpath = os.path.join(script_dir, 'tunnel_url.txt')
        if os.path.exists(fpath):
            with open(fpath, 'r', encoding='utf-8') as f:
                url = f.read().strip().rstrip('/')
                parsed_url = urllib.parse.urlsplit(url)
                if parsed_url.scheme.lower() == 'https' and parsed_url.hostname and not parsed_url.username:
                    with urllib.request.urlopen(url, timeout=3) as response:
                        if response.status == 200:
                            return url
                    print(f"⚠️ Public invite tunnel returned an unexpected status: {url}")
                elif url:
                    print("⚠️ Ignoring public invite URL because it must use HTTPS.")
    except (OSError, ValueError, urllib.error.URLError) as error:
        print(f"⚠️ Public invite tunnel is unavailable; using the local Wi-Fi link instead: {error}")
    return None

def get_room_condition(room_id):
    with rooms_lock:
        if room_id not in room_conditions:
            room_conditions[room_id] = threading.Condition(rooms_lock)
        return room_conditions[room_id]

class ArcadeRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
        if getattr(self.server, 'hsts_enabled', False):
            self.send_header('Strict-Transport-Security', 'max-age=31536000')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path.startswith('/api/'):
            self.handle_api_get(path, query)
        else:
            # Fall back to serving static files
            super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith('/api/'):
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
            try:
                data = json.loads(post_data.decode('utf-8'))
            except Exception:
                data = {}
            self.handle_api_post(path, data)
        else:
            self.send_error(404, "Not Found")

    def send_json(self, data, status=200):
        try:
            body = json.dumps(data).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception:
            pass

    def handle_api_get(self, path, query):
        if path == '/api/info':
            local_ip = get_local_ip()
            port = self.server.server_address[1]
            public_url = get_public_url()
            scheme = 'https' if getattr(self.server, 'tls_enabled', False) else 'http'
            base_url = public_url if public_url else f"{scheme}://{local_ip}:{port}"
            self.send_json({
                "status": "ok",
                "localIp": local_ip,
                "port": port,
                "publicUrl": public_url,
                "tlsEnabled": getattr(self.server, 'tls_enabled', False),
                "baseInviteUrl": f"{base_url}/",
                "serverTime": time.time()
            })
            return

        elif path == '/api/room/state':
            room_id = query.get('roomId', [''])[0].upper()
            client_version = int(query.get('version', [0])[0])
            wait_timeout = min(int(query.get('wait', [8])[0]), 15)

            if not room_id:
                self.send_json({"error": "Missing roomId"}, status=400)
                return

            cond = get_room_condition(room_id)
            start_time = time.time()

            with cond:
                if room_id not in rooms:
                    self.send_json({"error": "Room not found"}, status=404)
                    return

                room = rooms[room_id]
                # If room version is already ahead of client, return immediately
                if room['version'] > client_version or wait_timeout == 0:
                    self.send_json({
                        "status": "ok",
                        "room": room,
                        "version": room['version']
                    })
                    return

                # Otherwise, wait for an action to update room version
                cond.wait(timeout=wait_timeout)

                # Return latest state
                if room_id in rooms:
                    self.send_json({
                        "status": "ok",
                        "room": rooms[room_id],
                        "version": rooms[room_id]['version']
                    })
                else:
                    self.send_json({"error": "Room closed"}, status=404)
            return

        self.send_error(404, "API endpoint not found")

    def handle_api_post(self, path, data):
        if path == '/api/room/create':
            game_type = data.get('gameType', 'ttt')
            host_name = data.get('hostName', 'Player 1').strip() or 'Player 1'
            host_avatar = data.get('hostAvatar', '')
            host_emoji = data.get('hostEmoji', '🔥')
            turn_timer = int(data.get('turnTimer', 10))

            room_id = data.get('roomId', '')
            if not room_id:
                # Generate unique 6-char room code
                chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
                import random
                room_id = ''.join(random.choice(chars) for _ in range(6))
            else:
                room_id = room_id.upper().replace(' ', '')

            local_ip = get_local_ip()
            port = self.server.server_address[1]
            port = self.server.server_address[1]
            room_obj = {
                "id": room_id,
                "gameType": game_type,
                "status": "waiting",
                "createdAt": time.time(),
                "lastActive": time.time(),
                "turnTimer": turn_timer,
                "p1": {
                    "name": host_name,
                    "avatar": host_avatar,
                    "emoji": host_emoji,
                    "connected": True
                },
                "p2": {
                    "name": "Waiting for Friend...",
                    "avatar": "",
                    "emoji": "🤖",
                    "connected": False
                },
                "scores": {"p1": 0, "p2": 0, "ties": 0},
                "gameState": {
                    "board": [None] * 9,
                    "currentPlayer": "X",
                    "chessTurn": "w",
                    "chessMoves": [],
                    "isGameOver": False,
                    "winner": None,
                    "winCombination": None,
                    "coinLastFlip": None,
                    "coinStreak": 0,
                    "coinHistory": []
                },
                "version": 1,
                "events": []
            }

            with rooms_lock:
                rooms[room_id] = room_obj

            public_url = get_public_url()
            scheme = 'https' if getattr(self.server, 'tls_enabled', False) else 'http'
            base_url = public_url if public_url else f"{scheme}://{local_ip}:{port}"
            local_invite_url = f"{scheme}://{local_ip}:{port}/?room={room_id}"
            invite_url = f"{base_url}/?room={room_id}"

            self.send_json({
                "success": True,
                "roomId": room_id,
                "inviteUrl": invite_url,
                "localInviteUrl": local_invite_url,
                "publicUrl": public_url,
                "tlsEnabled": getattr(self.server, 'tls_enabled', False),
                "localIp": local_ip,
                "port": port,
                "room": room_obj
            })
            return

        elif path == '/api/room/join':
            room_id = data.get('roomId', '').upper().strip()
            guest_name = data.get('guestName', 'Player 2').strip() or 'Player 2'
            guest_avatar = data.get('guestAvatar', '')
            guest_emoji = data.get('guestEmoji', '⚡')

            cond = get_room_condition(room_id)
            with cond:
                if room_id not in rooms:
                    self.send_json({"success": False, "error": f"Room '{room_id}' not found."}, status=404)
                    return

                room = rooms[room_id]
                room['p2'] = {
                    "name": guest_name,
                    "avatar": guest_avatar,
                    "emoji": guest_emoji,
                    "connected": True
                }
                room['status'] = 'playing'
                room['lastActive'] = time.time()
                room['version'] += 1
                room['events'].append({
                    "type": "JOINED",
                    "player": "p2",
                    "name": guest_name,
                    "timestamp": time.time()
                })

                cond.notify_all()

            self.send_json({
                "success": True,
                "room": room,
                "role": "p2"
            })
            return

        elif path == '/api/room/action':
            room_id = data.get('roomId', '').upper().strip()
            role = data.get('role', '') # 'p1' or 'p2'
            action = data.get('action', '')
            payload = data.get('payload', {})

            if not room_id or room_id not in rooms:
                self.send_json({"success": False, "error": "Room not found"}, status=404)
                return

            cond = get_room_condition(room_id)
            with cond:
                room = rooms[room_id]
                room['lastActive'] = time.time()
                gs = room['gameState']

                if action == 'CHESS_MOVE':
                    move = payload.get('move', {})
                    chess_turn = gs.get('chessTurn', 'w')
                    expected_role = 'p1' if chess_turn == 'w' else 'p2'
                    if room.get('gameType') != 'chess' or role != expected_role or gs.get('isGameOver'):
                        self.send_json({"success": False, "error": "It is not your turn or this Chess game has ended."}, status=400)
                        return
                    if (not isinstance(move, dict)
                            or type(move.get('from')) is not int
                            or type(move.get('to')) is not int
                            or not 0 <= move['from'] < 64
                            or not 0 <= move['to'] < 64
                            or move['from'] == move['to']):
                        self.send_json({"success": False, "error": "Invalid Chess move."}, status=400)
                        return

                    gs.setdefault('chessMoves', []).append({
                        "from": move['from'],
                        "to": move['to']
                    })
                    gs['chessTurn'] = 'b' if chess_turn == 'w' else 'w'
                    result = payload.get('result')
                    if isinstance(result, dict) and result.get('winner') in ('w', 'b', 'draw'):
                        gs['isGameOver'] = True
                        if result['winner'] == 'w':
                            room['scores']['p1'] += 1
                        elif result['winner'] == 'b':
                            room['scores']['p2'] += 1
                        else:
                            room['scores']['ties'] += 1

                elif action in ('CHESS_NEW_GAME', 'CHESS_RESET_SCORES'):
                    if room.get('gameType') != 'chess' or role not in ('p1', 'p2'):
                        self.send_json({"success": False, "error": "This is not a Chess room."}, status=400)
                        return
                    gs['chessMoves'] = []
                    gs['chessTurn'] = 'w'
                    gs['isGameOver'] = False
                    if action == 'CHESS_RESET_SCORES':
                        room['scores'] = {"p1": 0, "p2": 0, "ties": 0}

                elif action == 'MOVE':
                    idx = payload.get('index')
                    if idx is not None and 0 <= idx < 9 and gs['board'][idx] is None and not gs['isGameOver']:
                        curr = gs['currentPlayer']
                        gs['board'][idx] = curr

                        # Win check
                        win_combos = [
                            [0, 1, 2], [3, 4, 5], [6, 7, 8],
                            [0, 3, 6], [1, 4, 7], [2, 5, 8],
                            [0, 4, 8], [2, 4, 6]
                        ]
                        win = None
                        for combo in win_combos:
                            if gs['board'][combo[0]] and gs['board'][combo[0]] == gs['board'][combo[1]] == gs['board'][combo[2]]:
                                win = {"player": gs['board'][combo[0]], "combination": combo}
                                break

                        if win:
                            gs['isGameOver'] = True
                            gs['winner'] = win['player']
                            gs['winCombination'] = win['combination']
                            if win['player'] == 'X':
                                room['scores']['p1'] += 1
                            else:
                                room['scores']['p2'] += 1
                        elif all(c is not None for c in gs['board']):
                            gs['isGameOver'] = True
                            gs['winner'] = 'TIE'
                            room['scores']['ties'] += 1
                        else:
                            gs['currentPlayer'] = 'O' if curr == 'X' else 'X'

                elif action == 'COIN_TOSS':
                    outcome = payload.get('outcome') # 'heads' or 'tails'
                    p1_call = payload.get('p1Choice', 'heads')
                    p2_call = 'tails' if p1_call == 'heads' else 'heads'
                    gs['coinLastFlip'] = outcome
                    gs['coinHistory'].append(outcome)

                    is_p1_win = (p1_call == outcome)
                    if is_p1_win:
                        room['scores']['p1'] += 1
                        gs['coinStreak'] = gs.get('coinStreak', 0) + 1
                    else:
                        room['scores']['p2'] += 1
                        gs['coinStreak'] = 0

                elif action == 'TIMEOUT':
                    loser = payload.get('loser', 'X')
                    gs['isGameOver'] = True
                    gs['winner'] = 'O' if loser == 'X' else 'X'
                    if gs['winner'] == 'X':
                        room['scores']['p1'] += 1
                    else:
                        room['scores']['p2'] += 1

                elif action == 'NEW_ROUND':
                    gs['board'] = [None] * 9
                    gs['currentPlayer'] = 'X'
                    gs['isGameOver'] = False
                    gs['winner'] = None
                    gs['winCombination'] = None

                elif action == 'RESET_SCORES':
                    room['scores'] = {"p1": 0, "p2": 0, "ties": 0}
                    gs['board'] = [None] * 9
                    gs['currentPlayer'] = 'X'
                    gs['isGameOver'] = False
                    gs['winner'] = None
                    gs['winCombination'] = None
                    gs['coinStreak'] = 0

                elif action == 'PROFILE_UPDATE':
                    p_role = payload.get('role', role)
                    if p_role in ('p1', 'p2'):
                        profile = payload.get('profile', {})
                        if profile.get('name'): room[p_role]['name'] = profile['name']
                        if profile.get('avatar'): room[p_role]['avatar'] = profile['avatar']
                        if profile.get('emoji'): room[p_role]['emoji'] = profile['emoji']

                # Append event to event log for animations (chat, reaction)
                event_item = {
                    "type": action,
                    "sender": role,
                    "payload": payload,
                    "timestamp": time.time()
                }
                room['events'].append(event_item)
                if len(room['events']) > 30:
                    room['events'] = room['events'][-30:]

                room['version'] += 1
                cond.notify_all()

            self.send_json({"success": True, "version": room['version']})
            return

        elif path == '/api/room/leave':
            room_id = data.get('roomId', '').upper().strip()
            role = data.get('role', '')
            cond = get_room_condition(room_id)
            with cond:
                if room_id in rooms:
                    room = rooms[room_id]
                    if role in ('p1', 'p2'):
                        room[role]['connected'] = False
                    room['version'] += 1
                    cond.notify_all()
            self.send_json({"success": True})
            return

        self.send_error(404, "API endpoint not found")

def find_available_port(start_port=8000):
    port = start_port
    while port < start_port + 50:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
            port += 1
    return start_port

def configure_tls(httpd):
    certfile = os.environ.get(TLS_CERTFILE_ENV, '').strip()
    keyfile = os.environ.get(TLS_KEYFILE_ENV, '').strip()
    if bool(certfile) != bool(keyfile):
        raise RuntimeError(
            f"Set both {TLS_CERTFILE_ENV} and {TLS_KEYFILE_ENV} to enable HTTPS."
        )
    if not certfile:
        return False

    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    context.load_cert_chain(certfile=certfile, keyfile=keyfile)
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    return True

def run_server():
    try:
        sys.stdout.reconfigure(line_buffering=True)
    except Exception:
        pass
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    port = DEFAULT_PORT
    # Try default port 8000 first, fall back only if truly unavailable
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex(('127.0.0.1', port)) == 0:
            port = find_available_port(DEFAULT_PORT + 1)

    local_ip = get_local_ip()
    public_url = get_public_url()

    ArcadeRequestHandler.extensions_map.update({
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.svg': 'image/svg+xml',
        '.json': 'application/json',
        '.map': 'application/json'
    })

    socketserver.TCPServer.allow_reuse_address = True

    try:
        with socketserver.ThreadingTCPServer(("0.0.0.0", port), ArcadeRequestHandler) as httpd:
            tls_enabled = configure_tls(httpd)
            httpd.tls_enabled = tls_enabled
            httpd.hsts_enabled = tls_enabled or bool(public_url)
            scheme = 'https' if tls_enabled else 'http'
            print("=" * 68)
            print("⚡ CYBER ARCADE PRO — MULTIPLAYER BACKEND & REST API SERVER ⚡")
            print("=" * 68)
            print()
            print(f"💻 LOCAL DEVICE (Host):")
            print(f"   {scheme}://localhost:{port}")
            print()
            if public_url:
                print(f"🌐 PUBLIC INTERNET TUNNEL (HTTPS):")
                print(f"   {public_url}")
                print()
            print(f"👥 LOCAL WI-FI (Same Wi-Fi Network):")
            print(f"   {scheme}://{local_ip}:{port}")
            print()
            if not tls_enabled:
                print("⚠️ Direct local connections use unencrypted HTTP. Configure a certificate/key for HTTPS.")
                print()
            print("🌐 REST API Endpoints Active:")
            print(f"   • POST /api/room/create")
            print(f"   • POST /api/room/join")
            print(f"   • GET  /api/room/state")
            print(f"   • POST /api/room/action")
            print(f"   • GET  /api/info")
            print()
            print("=" * 68)
            print("🎮 Instructions:")
            print("1. Open the landing screen in your browser.")
            print("2. Choose your game mode, name, and profile.")
            print("3. Click 'Online Multiplayer' to generate a unique room link.")
            print("4. Send the link to your friend to play simultaneously!")
            print("=" * 68)
            print("Press Ctrl+C to stop the server anytime.")
            print()

            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped. Thanks for playing!")
        sys.exit(0)

if __name__ == '__main__':
    run_server()
