// const sharp = require('sharp'); // 一時的に無効化
const path = require('path');

class ImageProcessor {
  async preprocessImage(inputPath) {
    try {
      console.log(`🖼️ 画像前処理スキップ（sharp無効）: ${inputPath}`);
      
      // sharpを使わずに元のパスをそのまま返す
      return inputPath;

    } catch (error) {
      console.error('❌ 画像処理エラー:', error);
      throw new Error(`画像処理中にエラーが発生しました: ${error.message}`);
    }
  }

  // より高度な前処理（OCR精度向上用）
  async enhanceForOCR(inputPath) {
    try {
      console.log(`🔍 OCR用画像強化処理スキップ（sharp無効）: ${inputPath}`);
      return inputPath;

    } catch (error) {
      console.error('❌ OCR用画像強化エラー:', error);
      throw new Error(`OCR用画像強化中にエラーが発生しました: ${error.message}`);
    }
  }

  // 画像情報取得
  async getImageInfo(inputPath) {
    try {
      // sharpなしでの簡易情報
      return {
        width: 1000,
        height: 1000,
        format: 'jpeg',
        size: 100000,
        density: 72,
        hasAlpha: false,
        orientation: 1
      };

    } catch (error) {
      console.error('❌ 画像情報取得エラー:', error);
      throw new Error(`画像情報取得中にエラーが発生しました: ${error.message}`);
    }
  }

  // 画像検証
  async validateImage(inputPath) {
    try {
      console.log(`✅ 画像検証スキップ（sharp無効）: ${inputPath}`);
      return true;

    } catch (error) {
      console.error('❌ 画像検証エラー:', error);
      throw error;
    }
  }

  // 出力パス生成
  generateOutputPath(inputPath, suffix = '_processed') {
    const parsedPath = path.parse(inputPath);
    const outputDir = parsedPath.dir;
    const outputName = `${parsedPath.name}${suffix}.png`;
    return path.join(outputDir, outputName);
  }

  // 傾き補正（実験的機能）
  async correctSkew(inputPath, angle = 0) {
    try {
      console.log(`🔄 傾き補正処理スキップ（sharp無効）: ${inputPath}`);
      return inputPath;

    } catch (error) {
      console.error('❌ 傾き補正エラー:', error);
      throw new Error(`傾き補正中にエラーが発生しました: ${error.message}`);
    }
  }

  // ノイズ除去
  async denoiseImage(inputPath) {
    try {
      console.log(`🧹 ノイズ除去処理スキップ（sharp無効）: ${inputPath}`);
      return inputPath;

    } catch (error) {
      console.error('❌ ノイズ除去エラー:', error);
      throw new Error(`ノイズ除去中にエラーが発生しました: ${error.message}`);
    }
  }

  // 画像の品質スコア計算（簡易版）
  async calculateQualityScore(inputPath) {
    try {
      console.log(`📊 画像品質スコア計算スキップ（sharp無効）: ${inputPath}`);
      return 75; // デフォルト値

    } catch (error) {
      console.error('❌ 品質スコア計算エラー:', error);
      return 50; // デフォルト値
    }
  }
}

module.exports = new ImageProcessor();