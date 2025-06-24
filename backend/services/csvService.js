const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs').promises;

class CSVService {
  async generateCSV(data) {
    try {
      console.log('📄 CSV生成処理開始...');

      // 一時ファイルパス
      const tempDir = path.join(__dirname, '../../uploads');
      const tempFilePath = path.join(tempDir, `temp_${Date.now()}.csv`);

      // CSV ヘッダー定義
      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'employeeId', title: '社員番号' },
          { id: 'employeeName', title: '氏名' },
          { id: 'department', title: '部署' },
          { id: 'workDate', title: '勤務日' },
          { id: 'startTime', title: '出勤時刻' },
          { id: 'endTime', title: '退勤時刻' },
          { id: 'breakTime', title: '休憩時間（分）' },
          { id: 'workHours', title: '実働時間' },
          { id: 'createdAt', title: '作成日時' }
        ],
        encoding: 'utf8'
      });

      // データ準備
      const csvData = [{
        employeeId: data.employeeId || '',
        employeeName: data.employeeName || '',
        department: data.department || '',
        workDate: data.workDate || '',
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        breakTime: data.breakTime || '',
        workHours: data.workHours || '',
        createdAt: new Date().toLocaleString('ja-JP')
      }];

      // CSV書き込み
      await csvWriter.writeRecords(csvData);

      // ファイル読み込み
      const csvBuffer = await fs.readFile(tempFilePath);

      // 一時ファイル削除
      await fs.unlink(tempFilePath);

      console.log('✅ CSV生成完了');
      return csvBuffer;

    } catch (error) {
      console.error('❌ CSV生成エラー:', error);
      throw new Error(`CSV生成中にエラーが発生しました: ${error.message}`);
    }
  }

  // 複数データのCSV生成（将来的な拡張用）
  async generateMultipleCSV(dataArray) {
    try {
      console.log(`📄 複数データCSV生成処理開始 (${dataArray.length}件)...`);

      const tempDir = path.join(__dirname, '../../uploads');
      const tempFilePath = path.join(tempDir, `temp_multiple_${Date.now()}.csv`);

      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'employeeId', title: '社員番号' },
          { id: 'employeeName', title: '氏名' },
          { id: 'department', title: '部署' },
          { id: 'workDate', title: '勤務日' },
          { id: 'startTime', title: '出勤時刻' },
          { id: 'endTime', title: '退勤時刻' },
          { id: 'breakTime', title: '休憩時間（分）' },
          { id: 'workHours', title: '実働時間' },
          { id: 'createdAt', title: '作成日時' }
        ],
        encoding: 'utf8'
      });

      // データ変換
      const csvData = dataArray.map(data => ({
        employeeId: data.employeeId || '',
        employeeName: data.employeeName || '',
        department: data.department || '',
        workDate: data.workDate || '',
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        breakTime: data.breakTime || '',
        workHours: data.workHours || '',
        createdAt: new Date().toLocaleString('ja-JP')
      }));

      await csvWriter.writeRecords(csvData);
      const csvBuffer = await fs.readFile(tempFilePath);
      await fs.unlink(tempFilePath);

      console.log('✅ 複数データCSV生成完了');
      return csvBuffer;

    } catch (error) {
      console.error('❌ 複数データCSV生成エラー:', error);
      throw new Error(`複数データCSV生成中にエラーが発生しました: ${error.message}`);
    }
  }

  // データ検証
  validateCSVData(data) {
    const requiredFields = ['employeeId', 'employeeName', 'workDate'];
    
    for (const field of requiredFields) {
      if (!data[field] || data[field].toString().trim() === '') {
        throw new Error(`必須項目が不足しています: ${field}`);
      }
    }

    return true;
  }
}

module.exports = new CSVService();