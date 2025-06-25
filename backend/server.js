const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const ocrController = require('./controllers/ocrController');
const exportController = require('./controllers/exportController');

const app = express();
const PORT = process.env.PORT || 3000;

// セキュリティミドルウェア
app.use(helmet());

// レート制限
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
  message: 'リクエストが多すぎます。しばらく待ってから再試行してください。'
});
app.use('/api/', limiter);

// CORS設定（すべてのオリジンを許可）
app.use(cors({
  origin: true,
  credentials: true
}));

// ボディパーサー
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// アップロードディレクトリの作成
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer設定（ファイルアップロード）
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `timecard-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('JPEGまたはPNG形式のファイルのみ対応しています。'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB制限
    files: 1 // 1ファイルのみ
  },
  fileFilter: fileFilter
});

// 静的ファイル配信（フロントエンド）
app.use(express.static(path.join(__dirname, '../frontend')));

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// OCR API エンドポイント
app.post('/api/ocr', upload.single('image'), ocrController.processImage);

// エクスポート API エンドポイント
app.post('/api/export/csv', exportController.exportCSV);
app.post('/api/export/excel', exportController.exportExcel);

// エラーハンドリング
app.use((error, req, res, next) => {
  console.error('エラー:', error);

  // Multerエラー
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'ファイルサイズが大きすぎます。5MB以下のファイルを選択してください。'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'ファイルは1つまでしか選択できません。'
      });
    }
  }

  // カスタムエラー
  if (error.message.includes('形式')) {
    return res.status(400).json({
      error: error.message
    });
  }

  // その他のエラー
  res.status(500).json({
    error: '内部サーバーエラーが発生しました。'
  });
});

// 404ハンドラー
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      error: 'APIエンドポイントが見つかりません。'
    });
  } else {
    // フロントエンドのindex.htmlを返す
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// サーバー起動（明示的に0.0.0.0でバインド）
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`📁 アップロードディレクトリ: ${uploadDir}`);
  console.log(`🌐 API エンドポイント: http://localhost:${PORT}/api`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('📋 利用可能なエンドポイント:');
    console.log('  GET  /api/health         - ヘルスチェック');
    console.log('  POST /api/ocr            - OCR処理');
    console.log('  POST /api/export/csv     - CSV出力');
    console.log('  POST /api/export/excel   - Excel出力');
  }
});

// プロセス終了時のクリーンアップ
process.on('SIGTERM', () => {
  console.log('🛑 サーバーを終了しています...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 サーバーを終了しています...');
  process.exit(0);
});

module.exports = app;