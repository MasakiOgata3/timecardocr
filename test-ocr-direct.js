// 直接OCRテスト（ブラウザを使わずに）

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function directOCRTest() {
  try {
    console.log('🧪 直接OCRテスト開始...');

    // 1x1のテストPNG画像を作成
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    const testImagePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(testImagePath, testImageBuffer);
    
    console.log('📁 テスト画像作成:', testImagePath);

    // FormData作成
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));

    console.log('📡 OCR API 呼び出し中...');
    
    const response = await axios.post('http://localhost:3000/api/ocr', formData, {
      headers: formData.getHeaders(),
      timeout: 30000,
    });

    console.log('✅ OCR API 成功!');
    console.log('レスポンス:', JSON.stringify(response.data, null, 2));

    // クリーンアップ
    fs.unlinkSync(testImagePath);
    console.log('🗑️ テスト画像削除');

  } catch (error) {
    console.error('❌ OCRテスト失敗:');
    console.error('エラーメッセージ:', error.message);
    
    if (error.response) {
      console.error('ステータス:', error.response.status);
      console.error('レスポンスデータ:', error.response.data);
    }
    
    if (error.code) {
      console.error('エラーコード:', error.code);
    }
  }
}

if (require.main === module) {
  directOCRTest();
}

module.exports = directOCRTest;