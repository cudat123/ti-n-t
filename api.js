import websocket, base64, threading, time, re
from flask import Flask, jsonify
from flask_cors import CORS

# ======================
# FLASK
# ======================
app = Flask(__name__)
CORS(app)

DATA = {
    "phien": None,
    "md5": None,
    "dice": [],
    "tong": None,
    "ketqua": None
}

@app.route("/68gb")
def api():
    return jsonify(DATA)

# ======================
# WS CONFIG
# ======================
WS_URL = "wss://ugaq8hxbh0nmjhi.cq.qnwxdhwica.com/"

HANDSHAKE = "AQAAcnsic3lzIjp7InBsYXRmb3JtIjoianMtd2Vic29ja2V0IiwiY2xpZW50QnVpbGROdW1iZXIiOiIwLjAuMSIsImNsaWVudFZlcnNpb24iOiIwYTIxNDgxZDc0NmY5MmY4NDI4ZTFiNmRlZWI3NmZlYSJ9fQ=="
LOGIN1 = "AgAAAA=="
LOGIN2 = "BAAATQEBAAEIAhDIARpAMzg4N2YzMzJmNGZjNDQ1OGI0NTA3MGI0MjJkYTE1OTFkYjRhNWMzZGYzYjg0YTFkYjc4NzJhMzBkMWI0OTRlZkIA"
ENTER_ROOM = "BAAAJQAEIm1ubWRzYi5tbm1kc2JoYW5kbGVyLmVudGVyZ2FtZXJvb20="
GET_SCENE = "BAAAJAAFIW1ubWRzYi5tbm1kc2JoYW5kbGVyLmdldGdhbWVzY2VuZQ=="
REQ_POKER = "BAAAJAAGIW1ubWRzYi5tbm1kc2JoYW5kbGVyLnJlcXBva2VyaW5mbw=="
HEARTBEAT = "AwAAAA=="

# ======================
def b64send(ws, data):
    ws.send(base64.b64decode(data))

def heartbeat(ws):
    while True:
        time.sleep(10)
        try:
            b64send(ws, HEARTBEAT)
            ws.send(b'', opcode=websocket.ABNF.OPCODE_PING)
        except:
            break

# ======================
# WS EVENTS
# ======================
def on_open(ws):
    b64send(ws, HANDSHAKE)
    time.sleep(2)
    b64send(ws, LOGIN1)
    b64send(ws, LOGIN2)
    time.sleep(2)
    b64send(ws, ENTER_ROOM)
    time.sleep(2)
    b64send(ws, GET_SCENE)
    b64send(ws, REQ_POKER)
    threading.Thread(target=heartbeat, args=(ws,), daemon=True).start()
    print("✅ WS READY")

def on_message(ws, message):
    try:
        text = message.decode(errors="ignore")

        # ===== GAME END (LẤY PHIÊN + XÚC XẮC) =====
        if "mnmdsbgameend" in text:
            m = re.search(r"#(\d+).*?\{(\d+)-(\d+)-(\d+)\}", text)
            if m:
                phien = int(m.group(1)) + 1
                d1, d2, d3 = map(int, m.groups()[1:])
                tong = d1 + d2 + d3
                kq = "TAI" if tong >= 11 else "XIU"

                DATA.update({
                    "phien": phien,
                    "dice": [d1, d2, d3],
                    "tong": tong,
                    "ketqua": kq
                })

                print(f"🎲 {d1}-{d2}-{d3} | Tổng {tong} | {kq}")
                print(f"➡ Phiên kế: {phien}")

        # ===== GAME START (LẤY MD5) =====
        if "mnmdsbgamestart" in text:
            md5 = text[-32:]
            DATA["md5"] = md5
            print(f"🔥 MD5: {md5}")

    except:
        pass

def start_ws():
    ws = websocket.WebSocketApp(
        WS_URL,
        on_open=on_open,
        on_message=on_message
    )
    ws.run_forever(ping_interval=5, ping_timeout=3)

# ======================
# START ALL
# ======================
threading.Thread(target=start_ws, daemon=True).start()

app.run("0.0.0.0", 3000)
