const vision = require('@google-cloud/vision');

class OCRService {
  constructor() {
    // Google Vision API クライアント初期化
    try {
      // Renderなどのクラウド環境では環境変数からJSON認証情報を読み込み
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        this.client = new vision.ImageAnnotatorClient({
          credentials: credentials,
          projectId: credentials.project_id
        });
        console.log('✅ Google Vision API クライアント初期化完了（環境変数から）');
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // ローカル環境ではファイルパスから読み込み
        this.client = new vision.ImageAnnotatorClient({
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
        console.log('✅ Google Vision API クライアント初期化完了（ファイルから）');
      } else {
        throw new Error('Google Vision API認証情報が設定されていません');
      }
      this.mockMode = false;
    } catch (error) {
      console.error('❌ Google Vision API 初期化エラー:', error.message);
      this.mockMode = true;
      console.warn('⚠️ モックモードで動作します（Google Vision API無効）');
    }
  }

  async processImage(imagePath) {
    try {
      if (this.mockMode) {
        console.log('⚠️ モックモードで動作中');
        return this.mockOCRResponse();
      }

      console.log(`🔍 OCR処理開始: ${imagePath}`);
      
      // ファイル存在確認
      const fs = require('fs');
      if (!fs.existsSync(imagePath)) {
        throw new Error(`画像ファイルが見つかりません: ${imagePath}`);
      }
      
      console.log(`📁 ファイル確認済み: ${imagePath} (${fs.statSync(imagePath).size} bytes)`);

      // Google Vision API でテキスト検出（タイムアウト付き）
      console.log('🔍 Google Vision API 呼び出し中...');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Google Vision API タイムアウト (30秒)')), 30000)
      );
      
      const ocrPromise = this.client.textDetection(imagePath);
      console.log('⏰ タイムアウト付きで API 実行中...');
      const [result] = await Promise.race([ocrPromise, timeoutPromise]);
      console.log('✅ Google Vision API 呼び出し完了');
      
      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        console.warn('⚠️ テキストが検出されませんでした。空の結果を返します。');
        return {
          text: '',
          confidence: 0,
          detections: [],
          timestamp: new Date().toISOString()
        };
      }

      // 全体のテキスト（最初の要素が全文）
      const fullText = detections[0].description;
      
      // 信頼度計算（簡易版）
      const confidence = this.calculateConfidence(detections);

      console.log(`✅ OCR処理完了: ${fullText.length} 文字検出, 信頼度: ${confidence.toFixed(2)}`);

      return {
        text: fullText,
        confidence: confidence,
        detections: detections.slice(1), // 個別のテキスト要素
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ OCR処理エラー:', error);
      
      if (error.code === 'PERMISSION_DENIED') {
        throw new Error('Google Vision API の認証に失敗しました。API キーを確認してください。');
      }
      
      if (error.code === 'QUOTA_EXCEEDED') {
        throw new Error('Google Vision API の利用制限に達しました。しばらく待ってから再試行してください。');
      }

      throw new Error(`Google Vision API エラー: ${error.message}`);
    }
  }

  // 信頼度計算（簡易版）
  calculateConfidence(detections) {
    if (!detections || detections.length <= 1) {
      return 0.5; // デフォルト値
    }

    // 個別のテキスト要素の信頼度を平均化
    let totalConfidence = 0;
    let validDetections = 0;

    for (let i = 1; i < detections.length; i++) {
      const detection = detections[i];
      if (detection.confidence !== undefined) {
        totalConfidence += detection.confidence;
        validDetections++;
      }
    }

    return validDetections > 0 ? totalConfidence / validDetections : 0.7;
  }

  // 開発用モックレスポンス
  mockOCRResponse() {
    console.log('🧪 モックOCRレスポンスを生成中...');
    
    const mockText = `タイムカード
社員番号: 123456
氏名: 山田太郎
部署: 営業部
勤務日: 2024-06-24
出勤時刻: 09:00
退勤時刻: 18:00
休憩時間: 60分
備考: 通常勤務`;

    return {
      text: mockText,
      confidence: 0.85,
      detections: [
        { description: 'タイムカード', confidence: 0.9 },
        { description: '社員番号:', confidence: 0.8 },
        { description: '123456', confidence: 0.9 },
        { description: '氏名:', confidence: 0.8 },
        { description: '山田太郎', confidence: 0.85 },
        { description: '部署:', confidence: 0.8 },
        { description: '営業部', confidence: 0.85 },
        { description: '勤務日:', confidence: 0.8 },
        { description: '2024-06-24', confidence: 0.9 },
        { description: '出勤時刻:', confidence: 0.8 },
        { description: '09:00', confidence: 0.9 },
        { description: '退勤時刻:', confidence: 0.8 },
        { description: '18:00', confidence: 0.9 },
        { description: '休憩時間:', confidence: 0.8 },
        { description: '60分', confidence: 0.85 }
      ],
      timestamp: new Date().toISOString()
    };
  }

  // Google Vision API の状態確認
  async healthCheck() {
    try {
      if (this.mockMode) {
        return { status: 'mock', available: true };
      }

      // 簡単なダミー画像でテスト（1x1の白いピクセル）
      const dummyImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
      
      await this.client.textDetection(dummyImage);
      return { status: 'connected', available: true };
      
    } catch (error) {
      console.warn('⚠️ Google Vision API 接続テスト失敗:', error.message);
      return { status: 'error', available: false, error: error.message };
    }
  }
}

module.exports = new OCRService();