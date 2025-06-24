// 簡単なOCRテスト

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function simpleOCRTest() {
  try {
    console.log('🧪 簡単なOCRテスト開始...');

    // テスト用の画像ファイル
    const imagePath = '../uploads/timecard-1750771092236-215425811.png';
    
    if (!fs.existsSync(imagePath)) {
      console.error('❌ テスト画像ファイルが見つかりません:', imagePath);
      return;
    }

    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));

    console.log('📡 OCR API 呼び出し中...');
    
    const response = await axios.post('http://localhost:3000/api/ocr', formData, {
      headers: formData.getHeaders(),
      timeout: 60000, // 60秒タイムアウト
    });

    console.log('✅ OCR API 成功!');
    console.log('レスポンス:', response.data);

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
  simpleOCRTest();
}

module.exports = simpleOCRTest;