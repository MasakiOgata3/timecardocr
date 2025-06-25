const csvService = require('../services/csvService');
const excelService = require('../services/excelService');

class ExportController {
  async exportCSV(req, res) {
    try {
      const data = req.body;

      // データ検証（直接実装）
      const isValid = (data.formattedText && data.formattedText.trim() !== '') || 
                     (data.employeeName && data.employeeName.trim() !== '');
      
      if (!isValid) {
        return res.status(400).json({
          error: '必須項目が入力されていません。'
        });
      }

      console.log('📄 CSV出力処理を開始...');

      // CSV生成
      const csvBuffer = await csvService.generateCSV(data);

      // レスポンスヘッダー設定
      const filename = `timecard_${data.workDate || new Date().toISOString().split('T')[0]}.csv`;
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': csvBuffer.length
      });

      console.log(`✅ CSV出力完了: ${filename}`);
      res.send(csvBuffer);

    } catch (error) {
      console.error('❌ CSV出力エラー:', error);
      res.status(500).json({
        error: 'CSV出力中にエラーが発生しました。'
      });
    }
  }

  async exportExcel(req, res) {
    try {
      console.log('📊 Excel出力処理を開始...');
      
      const data = req.body;

      // データ検証（直接実装）
      const isValid = (data.formattedText && data.formattedText.trim() !== '') || 
                     (data.employeeName && data.employeeName.trim() !== '');
      
      if (!isValid) {
        console.error('❌ データ検証失敗');
        return res.status(400).json({
          error: '必須項目が入力されていません。'
        });
      }

      console.log('✅ データ検証通過');

      // Excel生成
      console.log('📊 Excel生成開始...');
      const excelBuffer = await excelService.generateExcel(data);
      console.log('✅ Excel生成完了、バッファサイズ:', excelBuffer.length);

      // レスポンスヘッダー設定
      const filename = `timecard_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length
      });

      console.log(`✅ Excel出力完了: ${filename}, サイズ: ${excelBuffer.length}バイト`);
      res.send(excelBuffer);

    } catch (error) {
      console.error('❌ Excel出力エラー:', error);
      console.error('❌ エラースタック:', error.stack);
      res.status(500).json({
        error: `Excel出力中にエラーが発生しました: ${error.message}`
      });
    }
  }

  // タイムカードデータ検証
  validateTimecardData(data) {
    console.log('📋 検証するデータ:', data);
    
    // 新しい形式：formattedTextがあればOK
    if (data.formattedText && data.formattedText.trim() !== '') {
      console.log('✅ 整理されたテキスト形式のデータを確認');
      return true;
    }
    
    // 従来形式：employeeNameがあればOK（必須項目を緩和）
    if (data.employeeName && data.employeeName.trim() !== '') {
      console.log('✅ 従来形式のデータを確認');
      return true;
    }
    
    console.warn('⚠️ 有効なデータが見つかりません');
    return false;
  }

  // 日付検証
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  // 時刻検証
  isValidTime(timeString) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }
}

module.exports = new ExportController();