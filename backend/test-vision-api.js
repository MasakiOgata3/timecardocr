// Google Vision API 接続テスト

require('dotenv').config();
const vision = require('@google-cloud/vision');

async function testVisionAPI() {
  console.log('🔍 Google Vision API 接続テスト開始...\n');

  // 環境変数確認
  console.log('📋 環境変数確認:');
  console.log(`   GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || '未設定'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);

  try {
    // クライアント初期化
    console.log('🔧 Vision API クライアント初期化中...');
    
    const client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });

    console.log('✅ クライアント初期化完了\n');

    // ダミー画像でテスト（1x1白ピクセル）
    console.log('🧪 ダミー画像でテスト実行中...');
    const dummyImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 
      'base64'
    );

    const [result] = await client.textDetection(dummyImage);
    console.log('📝 テスト結果:', result.textAnnotations ? '成功' : '空の結果（正常）');
    
    console.log('\n✅ Google Vision API 接続テスト完了！');
    console.log('🎉 実際のOCR機能を使用する準備ができました。\n');

    // 使用量情報
    console.log('💰 料金情報:');
    console.log('   • 月間1,000回まで無料');
    console.log('   • 1,000回以降は$1.50/1,000回');
    console.log('   • 詳細: https://cloud.google.com/vision/pricing\n');

  } catch (error) {
    console.error('❌ テスト失敗:', error.message);
    
    if (error.code === 'ENOENT') {
      console.log('\n🔧 解決方法:');
      console.log('1. Google Cloud Console でサービスアカウントキーをダウンロード');
      console.log('2. キーファイルを backend/credentials/ フォルダに配置');
      console.log('3. .env ファイルの GOOGLE_APPLICATION_CREDENTIALS を設定');
    } else if (error.code === 'PERMISSION_DENIED') {
      console.log('\n🔧 解決方法:');
      console.log('1. Vision API が有効化されているか確認');
      console.log('2. サービスアカウントに適切な権限があるか確認');
    } else if (error.code === 'QUOTA_EXCEEDED') {
      console.log('\n🔧 解決方法:');
      console.log('1. Google Cloud Console で請求先アカウントを設定');
      console.log('2. 使用量制限を確認');
    }
    
    console.log('\n📚 詳細な設定手順は docs/google-vision-setup.md を参照してください。');
  }
}

// テスト実行
if (require.main === module) {
  testVisionAPI();
}

module.exports = testVisionAPI;