const ocrService = require('../services/ocrService');
const imageProcessor = require('../utils/imageProcessor');
const textParser = require('../utils/textParser');
const fs = require('fs').promises;

class OCRController {
  async processImage(req, res) {
    try {
      // ファイルが存在するかチェック
      if (!req.file) {
        return res.status(400).json({
          error: 'ファイルがアップロードされていません。'
        });
      }

      const filePath = req.file.path;
      console.log(`📁 ファイル受信: ${req.file.originalname} (${req.file.size} bytes)`);

      // 画像前処理
      console.log('🖼️ 画像を前処理中...');
      const processedImagePath = await imageProcessor.preprocessImage(filePath);

      // OCR処理
      console.log('🔍 OCR処理を開始...');
      const ocrResult = await ocrService.processImage(processedImagePath);

      // テキスト解析・構造化
      console.log('📋 テキストを解析中...');
      const structuredData = textParser.parseTimecardText(ocrResult.text);

      // 一時ファイルクリーンアップ
      await this.cleanupFiles([filePath, processedImagePath]);

      // レスポンス
      const response = {
        success: true,
        rawText: ocrResult.text,
        structured: structuredData,
        confidence: ocrResult.confidence,
        processedAt: new Date().toISOString()
      };

      console.log('✅ OCR処理完了');
      res.json(response);

    } catch (error) {
      console.error('❌ OCR処理エラー:', error);

      // ファイルクリーンアップ（エラー時）
      if (req.file) {
        await this.cleanupFiles([req.file.path]).catch(console.error);
      }

      // エラーレスポンス
      if (error.message.includes('Google Vision API')) {
        return res.status(503).json({
          error: 'OCRサービスが一時的に利用できません。しばらく待ってから再試行してください。'
        });
      }

      if (error.message.includes('画像処理')) {
        return res.status(400).json({
          error: '画像ファイルが破損しているか、対応していない形式です。'
        });
      }

      res.status(500).json({
        error: 'OCR処理中にエラーが発生しました。'
      });
    }
  }

  // ファイルクリーンアップ
  async cleanupFiles(filePaths) {
    for (const filePath of filePaths) {
      try {
        if (filePath) {
          await fs.unlink(filePath);
          console.log(`🗑️ ファイル削除: ${filePath}`);
        }
      } catch (error) {
        console.warn(`⚠️ ファイル削除失敗: ${filePath}`, error.message);
      }
    }
  }
}

module.exports = new OCRController();