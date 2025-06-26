const ExcelJS = require('exceljs');

class ExcelService {
  async generateExcel(data) {
    try {
      console.log('📊 Excel生成処理開始...');

      // ワークブック作成
      const workbook = new ExcelJS.Workbook();
      
      // メタデータ設定
      workbook.creator = 'タイムカードOCRアプリ';
      workbook.lastModifiedBy = 'System';
      workbook.created = new Date();
      workbook.modified = new Date();

      // ワークシート作成
      const worksheet = workbook.addWorksheet('タイムカード', {
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'portrait',
          margins: {
            left: 0.7, right: 0.7,
            top: 0.75, bottom: 0.75,
            header: 0.3, footer: 0.3
          }
        }
      });

      // ヘッダー設定
      this.setupHeader(worksheet, data);

      // データ行設定
      this.setupDataRows(worksheet, data);

      // スタイル適用
      this.applyStyles(worksheet);

      // バッファ生成
      const buffer = await workbook.xlsx.writeBuffer();

      console.log('✅ Excel生成完了');
      return buffer;

    } catch (error) {
      console.error('❌ Excel生成エラー:', error);
      throw new Error(`Excel生成中にエラーが発生しました: ${error.message}`);
    }
  }

  // ヘッダー設定
  setupHeader(worksheet, data) {
    // タイトル
    worksheet.mergeCells('A1:D1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'タイムカード';
    titleCell.font = { 
      size: 16, 
      bold: true, 
      color: { argb: 'FF0000FF' } 
    };
    titleCell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };

    // 作成日時
    worksheet.mergeCells('A2:D2');
    const dateCell = worksheet.getCell('A2');
    const currentDate = new Date();
    dateCell.value = `作成日時: ${currentDate.getFullYear()}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getDate().toString().padStart(2, '0')} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`;
    dateCell.font = { size: 10, italic: true };
    dateCell.alignment = { horizontal: 'right' };

    // 会社名
    const companyCell = worksheet.getCell('A3');
    companyCell.value = '会社名';
    companyCell.font = { bold: true };
    companyCell.alignment = { horizontal: 'left', vertical: 'middle' };
    
    const companyValueCell = worksheet.getCell('B3');
    companyValueCell.value = data.department || '';
    companyValueCell.alignment = { horizontal: 'left', vertical: 'middle' };

    // 氏名
    const nameCell = worksheet.getCell('A4');
    nameCell.value = '氏名';
    nameCell.font = { bold: true };
    nameCell.alignment = { horizontal: 'left', vertical: 'middle' };
    
    const nameValueCell = worksheet.getCell('B4');
    nameValueCell.value = data.employeeName || '';
    nameValueCell.alignment = { horizontal: 'left', vertical: 'middle' };

    // データヘッダー
    const headers = [
      'イン', 'アウト', '休憩', '1日の労働時間'
    ];
    
    const headerRow = worksheet.getRow(6);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  }

  // データ行設定
  setupDataRows(worksheet, data) {
    const timeData = [];
    
    // 文字起こし内容から時刻データを抽出
    if (data.formattedText && data.formattedText.trim()) {
      const lines = data.formattedText.split('\n');
      
      lines.forEach((line) => {
        // 時刻パターンを検出（例：08:14   17:34）
        const timePattern = /(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})/;
        const match = line.match(timePattern);
        
        if (match) {
          timeData.push({
            inTime: match[1],
            outTime: match[2]
          });
        }
      });
    }
    
    // データ行を作成
    let rowIndex = 7;
    let totalMinutes = 0;
    
    timeData.forEach((data) => {
      const row = worksheet.getRow(rowIndex);
      
      // イン時刻（A列）
      const inCell = row.getCell(1);
      inCell.value = data.inTime;
      inCell.alignment = { horizontal: 'center', vertical: 'middle' };
      inCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // アウト時刻（B列）
      const outCell = row.getCell(2);
      outCell.value = data.outTime;
      outCell.alignment = { horizontal: 'center', vertical: 'middle' };
      outCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // 休憩時間（C列）- 固定1時間
      const breakCell = row.getCell(3);
      breakCell.value = '1:00';
      breakCell.alignment = { horizontal: 'center', vertical: 'middle' };
      breakCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // 1日の労働時間を計算（D列）
      const workMinutes = this.calculateWorkingHours(data.inTime, data.outTime, 60);
      totalMinutes += workMinutes;
      
      const workCell = row.getCell(4);
      workCell.value = this.formatMinutesToTime(workMinutes);
      workCell.alignment = { horizontal: 'center', vertical: 'middle' };
      workCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      rowIndex++;
    });
    
    // 空白行
    rowIndex++;
    
    // 労働時間合計行
    const totalRow = worksheet.getRow(rowIndex);
    
    // 「労働時間合計」ラベル（B,C列を結合）
    worksheet.mergeCells(`B${rowIndex}:C${rowIndex}`);
    const labelCell = totalRow.getCell(2);
    labelCell.value = '労働時間合計';
    labelCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    labelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
    labelCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    // 合計時間（D列）
    const totalCell = totalRow.getCell(4);
    totalCell.value = this.formatMinutesToTime(totalMinutes);
    totalCell.font = { bold: true };
    totalCell.alignment = { horizontal: 'center', vertical: 'middle' };
    totalCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  }
  
  // 個別データ行設定のヘルパーメソッド
  setupDataRow(worksheet, rowData, rowIndex) {
    const row = worksheet.getRow(rowIndex);
      
    // 項目名（A列）
    const labelCell = row.getCell(1);
    labelCell.value = rowData[0];
    labelCell.font = { bold: true };
    labelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2F2F2' }
    };
    labelCell.alignment = { horizontal: 'left', vertical: 'middle' };

    // 値（B列のみ、結合なし）
    const valueCell = row.getCell(2);
    valueCell.value = rowData[1];
    valueCell.alignment = { horizontal: 'left', vertical: 'middle' };
    
    // 特定の行のスタイル調整
    if (rowData[0] === '勤務日' && rowData[1]) {
      valueCell.numFmt = 'yyyy/mm/dd';
    }
    
    if (rowData[0].includes('時刻') && rowData[1]) {
      valueCell.numFmt = 'hh:mm';
    }

    row.height = 25;
  }

  // 労働時間計算（分単位）
  calculateWorkingHours(inTime, outTime, breakMinutes = 60) {
    try {
      console.log(`⏰ 労働時間計算: ${inTime} - ${outTime} (休憩: ${breakMinutes}分)`);
      
      const [inHour, inMin] = inTime.split(':').map(Number);
      const [outHour, outMin] = outTime.split(':').map(Number);
      
      const inMinutes = inHour * 60 + inMin;
      const outMinutes = outHour * 60 + outMin;
      
      console.log(`📊 分換算: イン=${inMinutes}分, アウト=${outMinutes}分`);
      
      let workMinutes = outMinutes - inMinutes;
      if (workMinutes < 0) {
        // 日跨ぎの場合
        workMinutes += 24 * 60;
        console.log(`🌙 日跨ぎ処理: ${workMinutes}分`);
      }
      
      // 休憩時間を引く
      workMinutes -= breakMinutes;
      console.log(`⏱️ 休憩時間差引後: ${workMinutes}分`);
      
      const result = Math.max(0, workMinutes);
      console.log(`✅ 最終労働時間: ${result}分 (${this.formatMinutesToTime(result)})`);
      
      return result;
    } catch (error) {
      console.error('時間計算エラー:', error);
      return 0;
    }
  }
  
  // 分を時:分形式に変換
  formatMinutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  }

  // スタイル適用
  applyStyles(worksheet) {
    // 列幅設定
    const columnWidths = [
      { column: 1, width: 12 }, // イン
      { column: 2, width: 12 }, // アウト
      { column: 3, width: 12 }, // 休憩
      { column: 4, width: 18 }  // 1日の労働時間
    ];

    columnWidths.forEach(({ column, width }) => {
      worksheet.getColumn(column).width = width;
    });

    // 印刷設定
    worksheet.pageSetup.printArea = 'A1:D' + worksheet.rowCount;
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.fitToHeight = 1;
    worksheet.pageSetup.fitToWidth = 1;
  }

  // 複数データのExcel生成（将来的な拡張用）
  async generateMultipleExcel(dataArray) {
    try {
      console.log(`📊 複数データExcel生成処理開始 (${dataArray.length}件)...`);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'タイムカードOCRアプリ';
      workbook.created = new Date();

      // サマリーシート
      const summarySheet = workbook.addWorksheet('サマリー');
      this.setupSummarySheet(summarySheet, dataArray);

      // 個別データシート
      dataArray.forEach((data, index) => {
        const worksheet = workbook.addWorksheet(`${data.employeeName || 'データ' + (index + 1)}`);
        this.setupHeader(worksheet, data);
        this.setupDataRows(worksheet, data);
        this.applyStyles(worksheet);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      console.log('✅ 複数データExcel生成完了');
      return buffer;

    } catch (error) {
      console.error('❌ 複数データExcel生成エラー:', error);
      throw new Error(`複数データExcel生成中にエラーが発生しました: ${error.message}`);
    }
  }

  // サマリーシート設定
  setupSummarySheet(worksheet, dataArray) {
    // ヘッダー
    worksheet.getCell('A1').value = 'タイムカード一覧';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    
    // テーブルヘッダー
    const headers = ['社員番号', '氏名', '部署', '勤務日', '出勤時刻', '退勤時刻', '実働時間'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(3, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
    });

    // データ行
    dataArray.forEach((data, index) => {
      const rowIndex = index + 4;
      const values = [
        data.employeeId,
        data.employeeName,
        data.department,
        data.workDate,
        data.startTime,
        data.endTime,
        data.workHours
      ];
      
      values.forEach((value, colIndex) => {
        worksheet.getCell(rowIndex, colIndex + 1).value = value;
      });
    });

    // 列幅自動調整
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
  }
}

module.exports = new ExcelService();