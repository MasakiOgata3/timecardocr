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
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'タイムカード';
    titleCell.font = { 
      size: 18, 
      bold: true, 
      color: { argb: 'FF000080' } 
    };
    titleCell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F8FF' }
    };

    // 作成日時
    worksheet.mergeCells('A2:H2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `作成日時: ${new Date().toLocaleString('ja-JP')}`;
    dateCell.font = { size: 10, italic: true };
    dateCell.alignment = { horizontal: 'right' };

    // 空行
    worksheet.getRow(3).height = 10;

    // データヘッダー
    const headers = [
      'イン', 'アウト', '', '', '', '', '', ''
    ];
    
    const headerRow = worksheet.getRow(4);
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
    });
  }

  // データ行設定
  setupDataRows(worksheet, data) {
    // 文字起こし内容をそのままExcelに転記
    if (data.formattedText && data.formattedText.trim()) {
      const lines = data.formattedText.split('\n');
      
      lines.forEach((line, index) => {
        const rowIndex = index + 5; // 5行目から開始
        
        // 時刻パターンを検出（例：08:14   17:34）
        const timePattern = /(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})/;
        const match = line.match(timePattern);
        
        if (match) {
          // イン時刻（A列）
          const inCell = worksheet.getCell(`A${rowIndex}`);
          inCell.value = match[1];
          inCell.font = { name: 'Consolas', size: 11 };
          inCell.alignment = { horizontal: 'center', vertical: 'middle' };
          
          // アウト時刻（B列）
          const outCell = worksheet.getCell(`B${rowIndex}`);
          outCell.value = match[2];
          outCell.font = { name: 'Consolas', size: 11 };
          outCell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          // 単一時刻パターンを検出
          const singleTimePattern = /^(\d{1,2}:\d{2})$/;
          const singleMatch = line.trim().match(singleTimePattern);
          
          if (singleMatch) {
            // 単一時刻はA列に配置
            const cell = worksheet.getCell(`A${rowIndex}`);
            cell.value = singleMatch[1];
            cell.font = { name: 'Consolas', size: 11 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (line.trim() !== '') {
            // その他のテキスト（A列に配置、空行は除く）
            const cell = worksheet.getCell(`A${rowIndex}`);
            cell.value = line;
            cell.font = { name: 'Consolas', size: 11 };
            cell.alignment = { horizontal: 'left', vertical: 'top' };
          }
        }
        
        // 行の高さを調整
        worksheet.getRow(rowIndex).height = 18;
      });
      
    } else {
      // 従来形式
      const dataRows = [
        ['社員番号', data.employeeId || ''],
        ['氏名', data.employeeName || ''],
        ['部署', data.department || ''],
        ['勤務日', data.workDate || ''],
        ['出勤時刻', data.startTime || ''],
        ['退勤時刻', data.endTime || ''],
        ['休憩時間', data.breakTime ? `${data.breakTime}分` : ''],
        ['実働時間', data.workHours || '']
      ];
      
      dataRows.forEach((rowData, index) => {
        this.setupDataRow(worksheet, rowData, index + 5);
      });
    }
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

  // スタイル適用
  applyStyles(worksheet) {
    // 列幅設定
    const columnWidths = [
      { column: 1, width: 15 }, // 項目
      { column: 2, width: 20 }, // 内容
      { column: 3, width: 10 },
      { column: 4, width: 10 },
      { column: 5, width: 10 },
      { column: 6, width: 10 },
      { column: 7, width: 10 },
      { column: 8, width: 10 }
    ];

    columnWidths.forEach(({ column, width }) => {
      worksheet.getColumn(column).width = width;
    });

    // 全体のボーダー設定
    const dataRange = worksheet.getCell('A1').address + ':' + worksheet.getCell('H' + (worksheet.rowCount)).address;
    
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (rowNumber >= 4 && rowNumber <= worksheet.rowCount) {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      });
    });

    // 印刷設定
    worksheet.pageSetup.printArea = 'A1:H' + worksheet.rowCount;
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