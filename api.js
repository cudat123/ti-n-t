const express = require('express');
const axios = require('axios');
const path = require('path');

// =========== CẤU HÌNH HỆ THỐNG ===========
const CONFIG = {
  PORT: process.env.PORT || 3000,
  UPDATE_INTERVAL: 5000,
  XENG16_API: 'https://taixiu1.gsum01.com/api/luckydice1/GetSoiCau'
};

// =========== CLASS DỰ ĐOÁN ===========
class TaiXiuPredictor {
  constructor() {
    this.history = [];
    this.lastPrediction = null;
  }

  getCurrentStreak() {
    if (this.history.length === 0) return {outcome: null, length: 0};
    const last = this.history[this.history.length - 1];
    let length = 1;
    for (let i = this.history.length - 2; i >= 0; i--) {
      if (this.history[i] === last) length++;
      else break;
    }
    return {outcome: last, length};
  }

  predictNext() {
    if (this.history.length < 3) {
      return {prediction: Math.random() > 0.5 ? 'Tài' : 'Xỉu', confidence: 65};
    }

    const streak = this.getCurrentStreak();
    const streakLen = streak.length;
    const last = streak.outcome;

    // Phân tích lịch sử
    const recent10 = this.history.slice(-10);
    const taiCount = recent10.filter(x => x === 'Tài').length;
    const xiuCount = recent10.filter(x => x === 'Xỉu').length;

    let prediction;
    let confidence = 70;

    // Logic dự đoán
    if (streakLen >= 3) {
      prediction = last;
      confidence = 75 + (streakLen * 3);
      if (confidence > 95) confidence = 95;
    } else if (Math.abs(taiCount - xiuCount) >= 3) {
      prediction = taiCount > xiuCount ? 'Tài' : 'Xỉu';
      confidence = 80;
    } else {
      prediction = last === 'Tài' ? 'Xỉu' : 'Tài';
      confidence = 68;
    }

    return {prediction, confidence};
  }

  addResult(result) {
    this.history.push(result);
    if (this.history.length > 50) {
      this.history.shift();
    }
  }
}

// =========== BIẾN TOÀN CỤC ===========
const predictor = new TaiXiuPredictor();
let lastSessionId = 0;
let consecutiveLosses = 0;
let totalPredictions = 0;
let correctPredictions = 0;
let lastData = null;

const app = express();

// =========== CẤU HÌNH TEMPLATE ENGINE ===========
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// =========== HÀM LẤY DỮ LIỆU ===========
async function getLatestResult() {
  try {
    const response = await axios.get(CONFIG.XENG16_API, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!Array.isArray(response.data) || response.data.length === 0) {
      return generateTestData();
    }
    
    // Lấy phiên mới nhất
    const latestRecord = response.data.reduce((prev, current) => {
      return (prev.SessionId > current.SessionId) ? prev : current;
    });
    
    const result = {
      SessionId: latestRecord.SessionId,
      FirstDice: latestRecord.FirstDice || 0,
      SecondDice: latestRecord.SecondDice || 0,
      ThirdDice: latestRecord.ThirdDice || 0,
      DiceSum: latestRecord.DiceSum || 0,
      BetSide: latestRecord.BetSide,
      CreatedDate: latestRecord.CreatedDate || new Date().toISOString()
    };
    
    if (result.DiceSum === 0) {
      result.DiceSum = result.FirstDice + result.SecondDice + result.ThirdDice;
    }
    
    result.KetQua = result.BetSide === 0 ? "Tài" : "Xỉu";
    
    return result;
    
  } catch (error) {
    console.log('Lỗi API, dùng dữ liệu test');
    return generateTestData();
  }
}

function generateTestData() {
  const sessionId = lastSessionId + 1;
  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
  const dice3 = Math.floor(Math.random() * 6) + 1;
  const sum = dice1 + dice2 + dice3;
  const betSide = sum >= 11 ? 0 : 1;
  
  return {
    SessionId: sessionId,
    FirstDice: dice1,
    SecondDice: dice2,
    ThirdDice: dice3,
    DiceSum: sum,
    BetSide: betSide,
    KetQua: betSide === 0 ? "Tài" : "Xỉu",
    CreatedDate: new Date().toISOString(),
    isTestData: true
  };
}

// =========== ROUTE CHÍNH API ===========
app.get('/api', async (req, res) => {
  try {
    // Lấy dữ liệu
    const currentData = await getLatestResult();
    
    // Kiểm tra phiên mới
    if (currentData.SessionId > lastSessionId) {
      // Đánh giá dự đoán trước
      if (predictor.lastPrediction) {
        const isCorrect = predictor.lastPrediction === currentData.KetQua;
        totalPredictions++;
        
        if (isCorrect) {
          correctPredictions++;
          consecutiveLosses = 0;
        } else {
          consecutiveLosses++;
        }
      }
      
      // Cập nhật predictor
      predictor.addResult(currentData.KetQua);
      lastSessionId = currentData.SessionId;
      lastData = currentData;
    }
    
    // Tạo dự đoán mới
    const nextPrediction = predictor.predictNext();
    predictor.lastPrediction = nextPrediction.prediction;
    
    // Chiến lược
    let strategy = "🎯 Theo cầu";
    let strategyDetail = "Theo pattern hiện tại";
    
    if (consecutiveLosses >= 2) {
      strategy = "🔄 Bẻ cầu";
      strategyDetail = `Thua ${consecutiveLosses} lần liên tiếp`;
      if (consecutiveLosses >= 3) {
        nextPrediction.prediction = nextPrediction.prediction === "Tài" ? "Xỉu" : "Tài";
        strategy = "🔄 Đảo cầu";
        strategyDetail = `Thua ${consecutiveLosses} lần, đảo chiều dự đoán`;
      }
    }
    
    // Response API
    const response = {
      id: "tiendat",
      Phien: currentData.SessionId,
      Xuc_xac_1: currentData.FirstDice,
      Xuc_xac_2: currentData.SecondDice,
      Xuc_xac_3: currentData.ThirdDice,
      Tong: currentData.DiceSum,
      Ket_qua: currentData.KetQua,
      phien_hien_tai: currentData.SessionId + 1,
      du_doan: nextPrediction.prediction,
      li_do: `Độ tin cậy: ${nextPrediction.confidence}%`,
      confidence: nextPrediction.confidence,
      ketqua_ddoan: predictor.lastPrediction ? 
        (predictor.lastPrediction === currentData.KetQua ? "Đúng" : "Thua") : "Chưa có",
      chien_luoc: strategy,
      chien_luoc_chi_tiet: strategyDetail,
      thong_ke: {
        tong: totalPredictions,
        dung: correctPredictions,
        tile: totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) + '%' : '0%',
        thua_lien_tiep: consecutiveLosses,
        lich_su: predictor.history.length
      },
      lich_su_10: predictor.history.slice(-10),
      is_test_data: currentData.isTestData || false
    };
    
    console.log(`Phiên ${currentData.SessionId}: ${currentData.KetQua} | Dự đoán: ${nextPrediction.prediction} (${nextPrediction.confidence}%)`);
    
    res.json(response);
    
  } catch (error) {
    console.error('Lỗi API:', error.message);
    res.json({
      error: "Lỗi tạm thời",
      message: "Hệ thống đang bảo trì"
    });
  }
});

// =========== ROUTE GIAO DIỆN WEB ===========
app.get('/', async (req, res) => {
  try {
    // Lấy dữ liệu từ API
    const apiData = await getApiData();
    
    // Render giao diện
    res.render('index', {
      title: 'Hệ Thống Dự Đoán Tài Xỉu',
      data: apiData,
      lastUpdate: new Date().toLocaleTimeString('vi-VN')
    });
  } catch (error) {
    console.error('Lỗi render:', error);
    res.render('error', { error: error.message });
  }
});

// =========== ROUTE PHỤ ===========
app.get('/stats', (req, res) => {
  res.json({
    total_predictions: totalPredictions,
    correct_predictions: correctPredictions,
    accuracy: totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) + '%' : '0%',
    current_streak: consecutiveLosses,
    history_length: predictor.history.length,
    last_session: lastSessionId,
    predictor_history: predictor.history.slice(-20)
  });
});

app.get('/reset', (req, res) => {
  predictor.history = [];
  predictor.lastPrediction = null;
  consecutiveLosses = 0;
  totalPredictions = 0;
  correctPredictions = 0;
  lastSessionId = 0;
  lastData = null;
  
  res.json({ message: "Đã reset hệ thống" });
});

// =========== HÀM PHỤ TRỢ ===========
async function getApiData() {
  try {
    const response = await axios.get(`http://localhost:${CONFIG.PORT}/api`);
    return response.data;
  } catch (error) {
    console.log('Lỗi lấy dữ liệu API, tạo mock data');
    return createMockData();
  }
}

function createMockData() {
  return {
    Phien: 1000,
    Xuc_xac_1: 4,
    Xuc_xac_2: 3,
    Xuc_xac_3: 4,
    Tong: 11,
    Ket_qua: "Tài",
    phien_hien_tai: 1001,
    du_doan: "Xỉu",
    li_do: "Độ tin cậy: 75%",
    confidence: 75,
    ketqua_ddoan: "Đúng",
    chien_luoc: "🎯 Theo cầu",
    chien_luoc_chi_tiet: "Theo pattern hiện tại",
    thong_ke: {
      tong: 50,
      dung: 35,
      tile: "70%",
      thua_lien_tiep: 0,
      lich_su: 25
    },
    lich_su_10: ["Tài", "Xỉu", "Tài", "Tài", "Xỉu", "Tài", "Xỉu", "Xỉu", "Tài", "Tài"],
    is_test_data: true
  };
}

// =========== TẠO THƯ MỤC VÀ FILE VIEW ===========
const fs = require('fs');
const viewsDir = path.join(__dirname, 'views');
const publicDir = path.join(__dirname, 'public');

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(viewsDir)) {
  fs.mkdirSync(viewsDir, { recursive: true });
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Tạo file index.ejs
const indexTemplate = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %></title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        h1 {
            color: #00d4ff;
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }
        
        .subtitle {
            color: #aaa;
            font-size: 1.2rem;
        }
        
        .main-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .card-title {
            color: #00d4ff;
            font-size: 1.5rem;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid rgba(0, 212, 255, 0.3);
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .info-label {
            color: #aaa;
            font-weight: 500;
        }
        
        .info-value {
            color: #fff;
            font-weight: bold;
            font-size: 1.1rem;
        }
        
        .dice-container {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 20px 0;
        }
        
        .dice {
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: bold;
            color: #00d4ff;
            border: 2px solid rgba(0, 212, 255, 0.3);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .result-box {
            text-align: center;
            padding: 20px;
            margin: 20px 0;
            border-radius: 10px;
            background: rgba(0, 212, 255, 0.1);
            border: 2px solid rgba(0, 212, 255, 0.3);
        }
        
        .result-title {
            color: #aaa;
            font-size: 1.2rem;
            margin-bottom: 10px;
        }
        
        .result-value {
            font-size: 2.5rem;
            font-weight: bold;
            color: #00d4ff;
            text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }
        
        .tai {
            color: #00ff88 !important;
            text-shadow: 0 0 10px rgba(0, 255, 136, 0.5) !important;
        }
        
        .xiu {
            color: #ff416c !important;
            text-shadow: 0 0 10px rgba(255, 65, 108, 0.5) !important;
        }
        
        .confidence-bar {
            height: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            margin: 20px 0;
            overflow: hidden;
        }
        
        .confidence-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff416c, #ff4b2b);
            border-radius: 10px;
            transition: width 1s ease-in-out;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.9rem;
        }
        
        .history-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
        }
        
        .history-item {
            padding: 8px 15px;
            border-radius: 20px;
            font-weight: bold;
            min-width: 60px;
            text-align: center;
        }
        
        .history-tai {
            background: rgba(0, 255, 136, 0.2);
            color: #00ff88;
            border: 1px solid rgba(0, 255, 136, 0.3);
        }
        
        .history-xiu {
            background: rgba(255, 65, 108, 0.2);
            color: #ff416c;
            border: 1px solid rgba(255, 65, 108, 0.3);
        }
        
        .strategy-box {
            padding: 15px;
            background: rgba(255, 193, 7, 0.1);
            border-radius: 10px;
            border: 1px solid rgba(255, 193, 7, 0.3);
            margin-top: 15px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .stat-box {
            background: rgba(255, 255, 255, 0.05);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #00d4ff;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #aaa;
            font-size: 0.9rem;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #aaa;
            font-size: 0.9rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .controls {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 20px;
        }
        
        .btn {
            padding: 12px 25px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 1rem;
        }
        
        .btn-refresh {
            background: linear-gradient(45deg, #00d4ff, #0088ff);
            color: white;
        }
        
        .btn-reset {
            background: linear-gradient(45deg, #ff416c, #ff4b2b);
            color: white;
        }
        
        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            font-size: 1.2rem;
            color: #00d4ff;
        }
        
        @media (max-width: 768px) {
            .main-content {
                grid-template-columns: 1fr;
            }
            
            h1 {
                font-size: 2rem;
            }
            
            .dice {
                width: 50px;
                height: 50px;
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎲 HỆ THỐNG DỰ ĐOÁN TÀI XỈU</h1>
            <div class="subtitle">AI Prediction System - Cập nhật tự động mỗi 5 giây</div>
            <div class="controls">
                <button class="btn btn-refresh" onclick="refreshData()">🔄 Làm mới</button>
                <button class="btn btn-reset" onclick="resetSystem()">🔄 Reset hệ thống</button>
            </div>
        </header>
        
        <div class="main-content">
            <!-- Thông tin phiên hiện tại -->
            <div class="card">
                <h2 class="card-title">📊 PHIÊN HIỆN TẠI</h2>
                <div class="info-row">
                    <span class="info-label">Số phiên:</span>
                    <span class="info-value">#<%= data.Phien %></span>
                </div>
                
                <div class="dice-container">
                    <div class="dice"><%= data.Xuc_xac_1 %></div>
                    <div class="dice"><%= data.Xuc_xac_2 %></div>
                    <div class="dice"><%= data.Xuc_xac_3 %></div>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Tổng điểm:</span>
                    <span class="info-value"><%= data.Tong %></span>
                </div>
                
                <div class="result-box">
                    <div class="result-title">KẾT QUẢ</div>
                    <div class="result-value <%= data.Ket_qua === 'Tài' ? 'tai' : 'xiu' %>">
                        <%= data.Ket_qua %>
                    </div>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Loại dữ liệu:</span>
                    <span class="info-value"><%= data.is_test_data ? 'Dữ liệu test' : 'Dữ liệu thực' %></span>
                </div>
            </div>
            
            <!-- Dự đoán phiên tiếp theo -->
            <div class="card">
                <h2 class="card-title">🔮 DỰ ĐOÁN PHIÊN #<%= data.phien_hien_tai %></h2>
                
                <div class="result-box">
                    <div class="result-title">DỰ ĐOÁN TIẾP THEO</div>
                    <div class="result-value <%= data.du_doan === 'Tài' ? 'tai' : 'xiu' %>">
                        <%= data.du_doan %>
                    </div>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Độ tin cậy:</span>
                    <span class="info-value"><%= data.confidence %>%</span>
                </div>
                
                <div class="confidence-bar">
                    <div class="confidence-fill" id="confidenceFill" style="width: <%= data.confidence %>%">
                        <%= data.confidence %>%
                    </div>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Kết quả dự đoán trước:</span>
                    <span class="info-value" style="color: <%= data.ketqua_ddoan === 'Đúng' ? '#00ff88' : '#ff416c' %>">
                        <%= data.ketqua_ddoan %>
                    </span>
                </div>
                
                <div class="strategy-box">
                    <div style="color: #ffc107; font-weight: bold; margin-bottom: 5px;">
                        <%= data.chien_luoc %>
                    </div>
                    <div style="color: #aaa; font-size: 0.9rem;">
                        <%= data.chien_luoc_chi_tiet %>
                    </div>
                </div>
            </div>
            
            <!-- Thống kê & Lịch sử -->
            <div class="card">
                <h2 class="card-title">📈 THỐNG KÊ HỆ THỐNG</h2>
                
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-value"><%= data.thong_ke.tong %></div>
                        <div class="stat-label">Tổng dự đoán</div>
                    </div>
                    
                    <div class="stat-box">
                        <div class="stat-value"><%= data.thong_ke.dung %></div>
                        <div class="stat-label">Dự đoán đúng</div>
                    </div>
                    
                    <div class="stat-box">
                        <div class="stat-value"><%= data.thong_ke.tile %></div>
                        <div class="stat-label">Tỷ lệ chính xác</div>
                    </div>
                    
                    <div class="stat-box">
                        <div class="stat-value"><%= data.thong_ke.thua_lien_tiep %></div>
                        <div class="stat-label">Thua liên tiếp</div>
                    </div>
                </div>
                
                <h3 style="margin-top: 25px; color: #00d4ff; font-size: 1.2rem;">📜 LỊCH SỬ 10 PHIÊN GẦN NHẤT</h3>
                <div class="history-container">
                    <% data.lich_su_10.forEach(function(item, index) { %>
                        <div class="history-item <%= item === 'Tài' ? 'history-tai' : 'history-xiu' %>">
                            <%= item === 'Tài' ? 'T' : 'X' %>
                        </div>
                    <% }); %>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>🕐 Cập nhật lần cuối: <%= lastUpdate %></p>
            <p>🔗 API Endpoint: <a href="/api" style="color: #00d4ff;">/api</a> | <a href="/stats" style="color: #00d4ff;">/stats</a></p>
            <p style="margin-top: 10px; font-size: 0.8rem; color: #666;">
                Hệ thống tự động cập nhật mỗi 5 giây | ID: <%= data.id %>
            </p>
        </div>
    </div>
    
    <script>
        // Tự động làm mới trang mỗi 5 giây
        setTimeout(() => {
            window.location.reload();
        }, 5000);
        
        // Hàm làm mới dữ liệu
        function refreshData() {
            window.location.reload();
        }
        
        // Hàm reset hệ thống
        function resetSystem() {
            if (confirm('Bạn có chắc muốn reset toàn bộ hệ thống? Dữ liệu sẽ bị xóa hết.')) {
                fetch('/reset')
                    .then(response => response.json())
                    .then(data => {
                        alert('Đã reset hệ thống thành công!');
                        window.location.reload();
                    })
                    .catch(error => {
                        alert('Lỗi khi reset hệ thống!');
                    });
            }
        }
        
        // Hiệu ứng cho thanh độ tin cậy
        document.addEventListener('DOMContentLoaded', function() {
            const confidenceFill = document.getElementById('confidenceFill');
            const confidence = <%= data.confidence %>;
            
            // Đổi màu thanh độ tin cậy dựa trên giá trị
            if (confidence >= 80) {
                confidenceFill.style.background = 'linear-gradient(90deg, #00ff88, #00d4ff)';
            } else if (confidence >= 70) {
                confidenceFill.style.background = 'linear-gradient(90deg, #ffc107, #ff9800)';
            } else {
                confidenceFill.style.background = 'linear-gradient(90deg, #ff416c, #ff4b2b)';
            }
        });
    </script>
</body>
</html>
`;

// Tạo file error.ejs
const errorTemplate = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lỗi hệ thống</title>
    <style>
        body {
            background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
            color: #fff;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center;
            padding: 20px;
        }
        .error-container {
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 600px;
        }
        h1 {
            color: #ff416c;
            font-size: 3rem;
            margin-bottom: 20px;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 30px;
            color: #aaa;
        }
        .btn {
            padding: 12px 30px;
            background: linear-gradient(45deg, #00d4ff, #0088ff);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            font-size: 1rem;
            text-decoration: none;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>⚠️ LỖI HỆ THỐNG</h1>
        <p><%= error %></p>
        <p>Vui lòng thử lại sau hoặc liên hệ quản trị viên.</p>
        <a href="/" class="btn">Quay lại trang chủ</a>
    </div>
</body>
</html>
`;

// Ghi file template
fs.writeFileSync(path.join(viewsDir, 'index.ejs'), indexTemplate);
fs.writeFileSync(path.join(viewsDir, 'error.ejs'), errorTemplate);

// =========== KHỞI ĐỘNG SERVER ===========
app.listen(CONFIG.PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║               HỆ THỐNG DỰ ĐOÁN TÀI XỈU                     ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  🌐 Web Interface: http://localhost:${CONFIG.PORT}              ║`);
  console.log(`║  📊 API Endpoint:  http://localhost:${CONFIG.PORT}/api          ║`);
  console.log(`║  📈 Stats:         http://localhost:${CONFIG.PORT}/stats        ║`);
  console.log(`║  ⏱️  Tự động cập nhật: ${CONFIG.UPDATE_INTERVAL/1000} giây/lần   ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n📌 Đang chạy hệ thống...');
  
  // Tự động cập nhật định kỳ
  setInterval(async () => {
    try {
      await axios.get(`http://localhost:${CONFIG.PORT}/api`);
      console.log(`🔄 [${new Date().toLocaleTimeString('vi-VN')}] Tự động cập nhật thành công`);
    } catch (error) {
      console.log(`⚠️  [${new Date().toLocaleTimeString('vi-VN')}] Lỗi cập nhật: ${error.message}`);
    }
  }, CONFIG.UPDATE_INTERVAL);
});

// Xử lý khi tắt server
process.on('SIGINT', () => {
  console.log('\n\n📊 Thống kê cuối cùng:');
  console.log(`   Tổng dự đoán: ${totalPredictions}`);
  console.log(`   Dự đoán đúng: ${correctPredictions}`);
  console.log(`   Tỷ lệ đúng: ${totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0}%`);
  console.log(`   Lịch sử lưu: ${predictor.history.length} kết quả`);
  console.log('\n👋 Tắt server...');
  process.exit(0);
});
