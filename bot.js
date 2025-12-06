// ===================== MAX AI XOCDIA - FULL POWER EDITION =====================
// TỰ LẤY API → PHÂN TÍCH CẦU 10 TAY (LÀM DỰ ĐOÁN CHÍNH) → LƯU HIS
// ============================================================================

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// API Lịch sử Tài Xỉu (Lucky Dice) - Dùng làm nguồn dữ liệu chính
const API_URL_LUCKYDICE =
  "https://taixiu.system32-cloudfare-356783752985678522.monster/api/luckydice/GetSoiCau";

const HIS_FILE = path.join(__dirname, "history.json");
const MAX_HIS_LENGTH = 5000; // Giới hạn lưu lịch sử tối đa

// ID của bạn
const MY_ID = "tiendat09868";

// =================================================================================
// DỮ LIỆU CẦU ĐƯỢC LẤY TỪ FILE cau.txt
// =================================================================================
const RAW_CAU_TXT = `TTTTTTTTTTTTT => Dự đoán: T - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTTTTTTTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTTTTTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTTTTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTTTTTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTTTTTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTTTTXXT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTTTTTXXX => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTTTTXTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTTTTXTTX => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTTTTXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTTTXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTTTTXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTTTTXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTTTXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTTTTXXXX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTTTXTTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTTTXTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTTTXTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTTXTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTTTXTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTTTXTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTTXTXXT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTTTXTXXX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTTTXXTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTTTXXTTX => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTTTXXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTTXXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTTTXXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTTTXXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTTXXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTTTXXXXX => Dự đoán: X - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTTTTXTTTTT => Dự đoán: T - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTTTTXTTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTTXTTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTXTTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTTXTTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTTXTTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTXTTXXT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTTXTTXXX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTTXTXTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTTXTXTTX => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTTXTXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTXTXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTTXTXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTTXTXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTXTXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTTXTXXXX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTTXXTTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTTXXTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTTXXTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTXXTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTTXXTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTTXXTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTXXTXXT => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTTXXTXXX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTTXXXTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTTXXXTTX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTTXXXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTXXXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTTXXXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTTXXXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTTXXXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTTXXXXXX => Dự đoán: X - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTTTXTTTTTT => Dự đoán: T - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTTTXTTTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTXTTTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXTTTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTXTTTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTXTTTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXTTTXXT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTXTTTXXX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTXTTXTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTXTTXTTX => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTXTTXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXTTXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTXTTXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTXTTXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXTTXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTXTTXXXX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTXTXTTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTXTXTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTXTXTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXTXTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTXTXTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTXTXTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXTXTXXT => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTXTXTXXX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTXTXXTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTXTXXTTX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTXTXXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXTXXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTXTXXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTXTXXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXTXXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTXTXXXXX => Dự đoán: X - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTTTXXTTTTT => Dự đoán: T - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTTTXXTTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTXXTTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXXTTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTXXTTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTXXTTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXXTTXXT => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTXXTTXXX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTXXTXTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTXXTXTTX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTXXTXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXXTXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTXXTXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTXXTXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXXTXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTXXTXXXX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTXXXTTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTTXXXTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTXXXTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXXXTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTXXXTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTXXXTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXXXTXXT => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTXXXTXXX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTXXXXTTT => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTXXXXTTX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTTXXXXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXXXXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTTXXXXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTTXXXXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTTXXXXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTTXXXXXXX => Dự đoán: X - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTTXTTTTTTT => Dự đoán: T - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTTXTTTTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXTTTTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTTTTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXTTTTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXTTTTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTTTTXXT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTXTTTTXXX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXTTTXTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTXTTTXTTX => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTXTTTXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTTTXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXTTTXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXTTTXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTTTXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXTTTXXXX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXTTXTTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTXTTXTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXTTXTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTTXTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXTTXTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXTTXTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTTXTXXT => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXTTXTXXX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXTTXXTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTXTTXXTTX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXTTXXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTTXXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXTTXXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXTTXXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTTXXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXTTXXXXX => Dự đoán: X - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTTXTXTTTTT => Dự đoán: T - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTTXTXTTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXTXTTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTXTTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXTXTTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXTXTTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTXTTXXT => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXTXTTXXX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXTXTXTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTXTXTXTTX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXTXTXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTXTXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXTXTXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXTXTXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTXTXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXTXTXXXX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXTXXTTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTXTXXTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXTXXTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTXXTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXTXXTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXTXXTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTXXTXXT => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXTXXTXXX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXTXXXTTT => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXTXXXTTX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXTXXXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTXXXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXTXXXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXTXXXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXTXXXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXTXXXXXX => Dự đoán: X - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTTXXTTTTTT => Dự đoán: T - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTTXXTTTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXXTTTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXTTTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXXTTTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXXTTTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXTTTXXT => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXTTTXXX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXTTXTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTXXTTXTTX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXTTXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXTTXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXXTTXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXXTTXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXTTXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXXTTXXXX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXTXTTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTTXXTXTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXXTXTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXTXTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXXTXTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXXTXTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXTXTXXT => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXTXTXXX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXTXXTTT => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXTXXTTX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXTXXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXTXXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXXTXXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXXTXXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXTXXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXXTXXXXX => Dự đoán: X - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTTXXXTTTTT => Dự đoán: T - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTTXXXTTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXXXTTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXXTTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXXXTTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXXXTTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXXTTXXT => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXXTTXXX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXXTXTTT => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXXTXTTX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXXTXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXXTXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXXXTXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXXXTXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXXTXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXXXTXXXX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXXXTTTT => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXXXTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXXXXTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXXXTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXXXXTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXXXXTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXXXTXXT => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXXXTXXX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXXXXTTT => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXXXXTTX => Dự đoán: T - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTTXXXXXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXXXXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTTXXXXXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTTXXXXXXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTTXXXXXXXT => Dự đoán: X - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTTXXXXXXXX => Dự đoán: X - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTXTTTTTTTT => Dự đoán: T - Loại cầu: Cầu bệt (liên tiếp giống nhau)
TTTTXTTTTTTTX => Dự đoán: T - Loại cầu: Cầu 3-1 (3 bên này - 1 bên kia)
TTTTXTTTTTTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTXTTTTTTXX => Dự đoán: X - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)
TTTTXTTTTTXTT => Dự đoán: T - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTXTTTTTXTX => Dự đoán: T - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTXTTTTTXXT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTXTTTTTXXX => Dự đoán: X - Loại cầu: Không rõ (Đoán ngẫu nhiên)
TTTTXTTTTXTTT => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTXTTTTXTTX => Dự đoán: T - Loại cầu: Cầu nghiêng (T chiếm ưu thế rõ)
TTTTXTTTTXTXT => Dự đoán: X - Loại cầu: Cầu kẹp (kẹp giữa T hoặc X)
TTTTXTTTTXTXX => Dự đoán: X - Loại cầu: Cầu 1-2 (1 bên - 2 bên còn lại)
TTTTXTTTTXXTT => Dự đoán: T - Loại cầu: Cầu 2-2 (2 Tài - 2 Xỉu lặp lại)`;
 
// =================================================================================
// LOGIC PHÂN TÍCH CẦU 10 TAY
// =================================================================================
function loadCauList(rawText) {
    const CAU_LIST = new Map();
    const lines = rawText.split('\n');
    for (const line of lines) {
        const match = line.match(/^([TX]+) => Dự đoán: ([TX]) - Loại cầu: (.+)$/);
        if (match) {
            let pattern = match[1];
            const prediction = match[2];
            const type = match[3];

            const analysisLength = 10;
            if (pattern.length >= analysisLength) {
                pattern = pattern.slice(-analysisLength);
                CAU_LIST.set(pattern, { prediction, type });
            }
        }
    }
    return CAU_LIST;
}

const CAU_LIST = loadCauList(RAW_CAU_TXT);
console.log(`Đã tải thành công ${CAU_LIST.size} mẫu cầu 10 tay.`);


function analyzeCau(history) {
    const analysisLength = 10;
    const recentHistory = history.slice(0, analysisLength);

    if (recentHistory.length < analysisLength) {
        return { Du_doan: "N/A", Loai_cau: "Không đủ dữ liệu (dưới 10 phiên)" };
    }
    
    const patternSegment = [...recentHistory].reverse();
    
    const currentPattern = patternSegment.map(item => {
        const kq = item.ket_qua || item.kq; 
        return kq === "TÀI" ? "T" : "X";
    }).join('');

    const foundCau = CAU_LIST.get(currentPattern);

    if (foundCau) {
        return {
            Du_doan: foundCau.prediction,
            Loai_cau: foundCau.type
        };
    } else {
        return {
            Du_doan: "N/A",
            Loai_cau: "Không tìm thấy mẫu cầu 10 tay"
        };
    }
}


// =================================================================================
// FETCH API LỊCH SỬ
// =================================================================================
async function fetchData(limit = 50) {
  try {
    const res = await axios.get(API_URL_LUCKYDICE);
    const data = Array.isArray(res.data) ? res.data.slice(0, limit) : [];
    return data.map(e => ({
      phien: Number(e.SessionId),
      x1: Number(e.FirstDice),
      x2: Number(e.SecondDice),
      x3: Number(e.ThirdDice),
      tong: Number(e.DiceSum),
      kq: e.BetSide === 0 ? "TÀI" : "XỈU",
    }));
  } catch (err) {
    console.error("Lỗi khi fetch API lịch sử:", err.message);
    return [];
  }
}


// =================================================================================
// LƯU HIS
// =================================================================================
async function saveHistory(arr) {
  await fs.writeJson(HIS_FILE, arr, { spaces: 2 });
}

async function loadHistory() {
  try {
    const his = await fs.readJson(HIS_FILE);
    return Array.isArray(his) ? his : [];
  } catch {
    return [];
  }
}

// =================================================================================
// API CHÍNH /xocdia88
// =================================================================================
// ... (Phần còn lại của code được giữ nguyên)

// =================================================================================
// API CHÍNH /xocdia88
// =================================================================================
app.get("/xocdia88", async (req, res) => {
  const apiData = await fetchData();
  if (!apiData.length) return res.json({ error: "Không lấy được dữ liệu API" });

  let his = await loadHistory();

  // 1. Cập nhật lịch sử và xác định Phiên cuối cùng
  // ... (Logic cập nhật his và currentResult)

  // Giới hạn số lượng lịch sử lưu trữ
  if (his.length > MAX_HIS_LENGTH) his = his.slice(0, MAX_HIS_LENGTH);
  await saveHistory(his);
  
  // 2. Lấy dự đoán từ Phân tích Cầu 10 tay
  const cauAnalysis = analyzeCau(his);
  
  // 3. Tính toán Phiên Hiện Tại (dựa trên phiên cuối cùng đã có kết quả)
  // Lấy ID phiên hiện tại bằng cách tăng ID phiên cuối cùng lên 1
  const nextPhien = currentResult.phien + 1; 

  // 4. Trả về kết quả
  res.json({
    id: MY_ID,
    Phien: currentResult.phien, // Phiên đã kết thúc
    Xuc_xac_1: currentResult.xuc_xac_1,
    Xuc_xac_2: currentResult.xuc_xac_2,
    Xuc_xac_3: currentResult.xuc_xac_3,
    Tong: currentResult.tong,
    Ket_qua: currentResult.ket_qua,
    Phien_Hien_Tai: nextPhien, 
    Du_doan: cauAnalysis.Du_doan, 
  });
});

// ... (Phần còn lại của code được giữ nguyên)