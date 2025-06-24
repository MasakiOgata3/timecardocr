const csvService = require('../services/csvService');
const excelService = require('../services/excelService');

class ExportController {
  async exportCSV(req, res) {
    try {
      const data = req.body;

      // データ検証
      if (!this.validateTimecardData(data)) {
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
      const data = req.body;

      // データ検証
      if (!this.validateTimecardData(data)) {
        return res.status(400).json({
          error: '必須項目が入力されていません。'
        });
      }

      console.log('📊 Excel出力処理を開始...');

      // Excel生成
      const excelBuffer = await excelService.generateExcel(data);

      // レスポンスヘッダー設定
      const filename = `timecard_${data.workDate || new Date().toISOString().split('T')[0]}.xlsx`;
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length
      });

      console.log(`✅ Excel出力完了: ${filename}`);
      res.send(excelBuffer);

    } catch (error) {
      console.error('❌ Excel出力エラー:', error);
      res.status(500).json({
        error: 'Excel出力中にエラーが発生しました。'
      });
    }
  }

  // タイムカードデータ検証
  validateTimecardData(data) {
    const requiredFields = ['employeeId', 'employeeName', 'workDate'];
    
    for (const field of requiredFields) {
      if (!data[field] || data[field].trim() === '') {
        console.warn(`⚠️ 必須項目が不足: ${field}`);
        return false;
      }
    }

    // 日付形式チェック
    if (data.workDate && !this.isValidDate(data.workDate)) {
      console.warn('⚠️ 無効な日付形式:', data.workDate);
      return false;
    }

    // 時刻形式チェック
    if (data.startTime && !this.isValidTime(data.startTime)) {
      console.warn('⚠️ 無効な開始時刻:', data.startTime);
      return false;
    }

    if (data.endTime && !this.isValidTime(data.endTime)) {
      console.warn('⚠️ 無効な終了時刻:', data.endTime);
      return false;
    }

    return true;
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