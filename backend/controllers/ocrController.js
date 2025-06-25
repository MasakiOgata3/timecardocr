const ocrService = require('../services/ocrService');
const imageProcessor = require('../utils/imageProcessor');
const textParser = require('../utils/textParser');
const fs = require('fs').promises;

class OCRController {
  async processImage(req, res) {
    console.log('🚀 OCR processImage メソッド開始');
    try {
      // ファイルが存在するかチェック
      if (!req.file) {
        console.error('❌ ファイルがアップロードされていません');
        return res.status(400).json({
          error: 'ファイルがアップロードされていません。'
        });
      }

      const filePath = req.file.path;
      console.log(`📁 ファイル受信: ${req.file.originalname} (${req.file.size} bytes)`);
      console.log(`📁 ファイルパス: ${filePath}`);

      // 画像前処理
      console.log('🖼️ 画像を前処理中...');
      let processedImagePath;
      try {
        processedImagePath = await imageProcessor.preprocessImage(filePath);
        console.log('✅ 画像前処理完了:', processedImagePath);
      } catch (error) {
        console.error('❌ 画像前処理エラー:', error.message);
        // 前処理に失敗した場合は元のファイルを使用
        processedImagePath = filePath;
        console.log('⚠️ 元のファイルを使用:', processedImagePath);
      }

      // OCR処理
      console.log('🔍 OCR処理を開始...');
      console.log('🔍 使用する画像ファイル:', processedImagePath);
      
      console.log('⚡ ocrService.processImage を呼び出し中...');
      let ocrResult;
      
      // OCRサービスが自動的にモックモードかどうか判断するので、そのまま呼び出し
      ocrResult = await ocrService.processImage(processedImagePath);
      
      console.log('✅ OCR処理完了. テキスト長:', ocrResult.text ? ocrResult.text.length : 0);
      console.log('📊 OCR結果プレビュー:', ocrResult.text ? ocrResult.text.substring(0, 100) + '...' : 'テキストなし');

      // テキスト解析・構造化
      console.log('📋 テキストを解析中...');
      const structuredData = textParser.parseTimecardText(ocrResult.text);
      console.log('✅ テキスト解析完了:', structuredData);

      // 一時ファイルクリーンアップ（レスポンス後に実行）
      setTimeout(() => {
        // ファイルクリーンアップは一時的に無効化
        console.log('📁 ファイルクリーンアップスキップ');
      }, 1000);

      // レスポンス
      const response = {
        success: true,
        rawText: ocrResult.text,
        structured: structuredData,
        confidence: ocrResult.confidence,
        processedAt: new Date().toISOString()
      };

      console.log('✅ OCR処理完了、レスポンス送信中...');
      console.log('📤 レスポンスデータ:', JSON.stringify(response, null, 2));
      res.json(response);
      console.log('📤 レスポンス送信完了');

    } catch (error) {
      console.error('❌ OCR処理エラー:', error);
      console.error('❌ エラースタック:', error.stack);

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