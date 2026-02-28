const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");

// ======================
// EXPRESS SERVER
// ======================
const app = express();
app.use(cors());

const DATA = {
    phien: null,
    md5: null,
    dice: [],
    tong: null,
    ketqua: null
};

app.get("/68gb", (req, res) => {
    res.json(DATA);
});

// ======================
// WS CONFIG
// ======================
const WS_URL = "wss://ugaq8hxbh0nmjhi.cq.qnwxdhwica.com/";

const HANDSHAKE = "AQAAcnsic3lzIjp7InBsYXRmb3JtIjoianMtd2Vic29ja2V0IiwiY2xpZW50QnVpbGROdW1iZXIiOiIwLjAuMSIsImNsaWVudFZlcnNpb24iOiIwYTIxNDgxZDc0NmY5MmY4NDI4ZTFiNmRlZWI3NmZlYSJ9fQ==";
const LOGIN1 = "AgAAAA==";
const LOGIN2 = "BAAATQEBAAEIAhDIARpAMzg4N2YzMzJmNGZjNDQ1OGI0NTA3MGI0MjJkYTE1OTFkYjRhNWMzZGYzYjg0YTFkYjc4NzJhMzBkMWI0OTRlZkIA";
const ENTER_ROOM = "BAAAJQAEIm1ubWRzYi5tbm1kc2JoYW5kbGVyLmVudGVyZ2FtZXJvb20=";
const GET_SCENE = "BAAAJAAFIW1ubWRzYi5tbm1kc2JoYW5kbGVyLmdldGdhbWVzY2VuZQ==";
const REQ_POKER = "BAAAJAAGIW1ubWRzYi5tbm1kc2JoYW5kbGVyLnJlcXBva2VyaW5mbw==";
const HEARTBEAT = "AwAAAA==";

// ======================
function b64send(ws, data) {
    ws.send(Buffer.from(data, "base64"));
}

// ======================
function startWS() {
    const ws = new WebSocket(WS_URL);

    ws.on("open", () => {
        console.log("🔌 Connected");

        b64send(ws, HANDSHAKE);

        setTimeout(() => {
            b64send(ws, LOGIN1);
            b64send(ws, LOGIN2);
        }, 2000);

        setTimeout(() => {
            b64send(ws, ENTER_ROOM);
        }, 4000);

        setTimeout(() => {
            b64send(ws, GET_SCENE);
            b64send(ws, REQ_POKER);
        }, 6000);

        // Heartbeat
        setInterval(() => {
            try {
                b64send(ws, HEARTBEAT);
                ws.ping();
            } catch (e) {}
        }, 10000);

        console.log("✅ WS READY");
    });

    ws.on("message", (message) => {
        try {
            const text = message.toString("utf8");

            // ===== GAME END =====
            if (text.includes("mnmdsbgameend")) {
                const match = text.match(/#(\d+).*?\{(\d+)-(\d+)-(\d+)\}/);
                if (match) {
                    const phien = parseInt(match[1]) + 1;
                    const d1 = parseInt(match[2]);
                    const d2 = parseInt(match[3]);
                    const d3 = parseInt(match[4]);
                    const tong = d1 + d2 + d3;
                    const kq = tong >= 11 ? "TAI" : "XIU";

                    DATA.phien = phien;
                    DATA.dice = [d1, d2, d3];
                    DATA.tong = tong;
                    DATA.ketqua = kq;

                    console.log(`🎲 ${d1}-${d2}-${d3} | Tổng ${tong} | ${kq}`);
                    console.log(`➡ Phiên kế: ${phien}`);
                }
            }

            // ===== GAME START =====
            if (text.includes("mnmdsbgamestart")) {
                const md5 = text.slice(-32);
                DATA.md5 = md5;
                console.log(`🔥 MD5: ${md5}`);
            }

        } catch (err) {}
    });

    ws.on("close", () => {
        console.log("❌ WS Closed - Reconnecting...");
        setTimeout(startWS, 3000);
    });

    ws.on("error", (err) => {
        console.log("⚠ WS Error:", err.message);
    });
}

// ======================
// START
// ======================
startWS();

app.listen(14445, "0.0.0.0", () => {
    console.log("🚀 API running at http://localhost:14445/68gb");
});
