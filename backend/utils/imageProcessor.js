const sharp = require('sharp');
const path = require('path');

class ImageProcessor {
  async preprocessImage(inputPath) {
    try {
      console.log(`🖼️ 画像前処理開始: ${inputPath}`);

      // 出力パス生成
      const outputPath = this.generateOutputPath(inputPath);

      // Sharp で画像処理
      await sharp(inputPath)
        .rotate() // EXIF 情報に基づく自動回転
        .resize(2000, 2000, { 
          fit: 'inside',
          withoutEnlargement: true 
        }) // 最大2000x2000にリサイズ（比率維持）
        .sharpen() // シャープネス向上
        .normalize() // コントラスト正規化
        .png({ quality: 95 }) // PNG形式で高品質保存
        .toFile(outputPath);

      console.log(`✅ 画像前処理完了: ${outputPath}`);
      return outputPath;

    } catch (error) {
      console.error('❌ 画像処理エラー:', error);
      throw new Error(`画像処理中にエラーが発生しました: ${error.message}`);
    }
  }

  // より高度な前処理（OCR精度向上用）
  async enhanceForOCR(inputPath) {
    try {
      console.log(`🔍 OCR用画像強化処理開始: ${inputPath}`);

      const outputPath = this.generateOutputPath(inputPath, '_enhanced');

      // OCR に最適化された処理
      await sharp(inputPath)
        .rotate() // 自動回転
        .resize(3000, 3000, { 
          fit: 'inside',
          withoutEnlargement: true 
        }) // より高解像度
        .greyscale() // グレースケール変換
        .normalize() // コントラスト正規化
        .sharpen(2) // 強いシャープネス
        .threshold(128) // 二値化（必要に応じて）
        .png({ quality: 100 })
        .toFile(outputPath);

      console.log(`✅ OCR用画像強化完了: ${outputPath}`);
      return outputPath;

    } catch (error) {
      console.error('❌ OCR用画像強化エラー:', error);
      throw new Error(`OCR用画像強化中にエラーが発生しました: ${error.message}`);
    }
  }

  // 画像情報取得
  async getImageInfo(inputPath) {
    try {
      const metadata = await sharp(inputPath).metadata();
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        orientation: metadata.orientation
      };

    } catch (error) {
      console.error('❌ 画像情報取得エラー:', error);
      throw new Error(`画像情報取得中にエラーが発生しました: ${error.message}`);
    }
  }

  // 画像検証
  async validateImage(inputPath) {
    try {
      const info = await this.getImageInfo(inputPath);
      
      // サイズチェック
      if (info.width < 100 || info.height < 100) {
        throw new Error('画像サイズが小さすぎます（最小100x100ピクセル）');
      }

      if (info.width > 10000 || info.height > 10000) {
        throw new Error('画像サイズが大きすぎます（最大10000x10000ピクセル）');
      }

      // フォーマットチェック
      const allowedFormats = ['jpeg', 'png', 'webp', 'tiff'];
      if (!allowedFormats.includes(info.format)) {
        throw new Error(`対応していない画像形式です: ${info.format}`);
      }

      console.log(`✅ 画像検証完了: ${info.width}x${info.height} ${info.format}`);
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
      if (angle === 0) {
        return inputPath; // 補正不要
      }

      console.log(`🔄 傾き補正処理: ${angle}度`);
      const outputPath = this.generateOutputPath(inputPath, '_corrected');

      await sharp(inputPath)
        .rotate(angle, { background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png({ quality: 95 })
        .toFile(outputPath);

      console.log(`✅ 傾き補正完了: ${outputPath}`);
      return outputPath;

    } catch (error) {
      console.error('❌ 傾き補正エラー:', error);
      throw new Error(`傾き補正中にエラーが発生しました: ${error.message}`);
    }
  }

  // ノイズ除去
  async denoiseImage(inputPath) {
    try {
      console.log(`🧹 ノイズ除去処理開始: ${inputPath}`);
      const outputPath = this.generateOutputPath(inputPath, '_denoised');

      await sharp(inputPath)
        .median(3) // メディアンフィルタでノイズ除去
        .png({ quality: 95 })
        .toFile(outputPath);

      console.log(`✅ ノイズ除去完了: ${outputPath}`);
      return outputPath;

    } catch (error) {
      console.error('❌ ノイズ除去エラー:', error);
      throw new Error(`ノイズ除去中にエラーが発生しました: ${error.message}`);
    }
  }

  // 画像の品質スコア計算（簡易版）
  async calculateQualityScore(inputPath) {
    try {
      const info = await this.getImageInfo(inputPath);
      const stats = await sharp(inputPath).stats();

      let score = 0;

      // 解像度スコア（0-30点）
      const pixelCount = info.width * info.height;
      if (pixelCount > 2000000) score += 30;
      else if (pixelCount > 1000000) score += 25;
      else if (pixelCount > 500000) score += 20;
      else if (pixelCount > 100000) score += 15;
      else score += 10;

      // コントラストスコア（0-30点）
      if (stats.channels && stats.channels.length > 0) {
        const contrast = stats.channels[0].max - stats.channels[0].min;
        if (contrast > 200) score += 30;
        else if (contrast > 150) score += 25;
        else if (contrast > 100) score += 20;
        else if (contrast > 50) score += 15;
        else score += 10;
      }

      // シャープネススコア（0-40点）
      // 簡易的な実装（実際はより複雑な計算が必要）
      score += 25; // デフォルト値

      console.log(`📊 画像品質スコア: ${score}/100`);
      return score;

    } catch (error) {
      console.error('❌ 品質スコア計算エラー:', error);
      return 50; // デフォルト値
    }
  }
}

module.exports = new ImageProcessor();