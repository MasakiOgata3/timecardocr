class CSVService {
  async generateCSV(data) {
    try {
      console.log('📄 CSV生成処理開始...');

      // CSVヘッダー
      const headers = [
        '社員番号',
        '氏名', 
        '部署',
        '勤務日',
        '出勤時刻',
        '退勤時刻',
        '休憩時間（分）',
        '実働時間',
        '作成日時'
      ];

      // CSVデータ行
      const row = [
        data.employeeId || '',
        data.employeeName || '',
        data.department || '',
        data.workDate || '',
        data.startTime || '',
        data.endTime || '',
        data.breakTime || '',
        data.workHours || '',
        new Date().toLocaleString('ja-JP')
      ];

      // CSV文字列生成
      const csvContent = [
        headers.join(','),
        row.map(field => `"${field}"`).join(',')
      ].join('\n');

      // UTF-8 BOM付きでエンコード
      const csvBuffer = Buffer.from('\uFEFF' + csvContent, 'utf8');

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

      // CSVヘッダー
      const headers = [
        '社員番号',
        '氏名', 
        '部署',
        '勤務日',
        '出勤時刻',
        '退勤時刻',
        '休憩時間（分）',
        '実働時間',
        '作成日時'
      ];

      // CSVデータ行
      const rows = dataArray.map(data => [
        data.employeeId || '',
        data.employeeName || '',
        data.department || '',
        data.workDate || '',
        data.startTime || '',
        data.endTime || '',
        data.breakTime || '',
        data.workHours || '',
        new Date().toLocaleString('ja-JP')
      ]);

      // CSV文字列生成
      const csvLines = [
        headers.join(','),
        ...rows.map(row => row.map(field => `"${field}"`).join(','))
      ];

      const csvContent = csvLines.join('\n');
      const csvBuffer = Buffer.from('\uFEFF' + csvContent, 'utf8');

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