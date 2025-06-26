class TextParser {
  parseTimecardText(rawText) {
    try {
      console.log('📋 テキスト解析開始...');
      console.log('入力テキスト:', rawText);

      const result = {
        employeeId: '',
        employeeName: '',
        department: '',
        workDate: '',
        startTime: '',
        endTime: '',
        breakTime: '',
        remarks: ''
      };

      if (!rawText || typeof rawText !== 'string') {
        console.warn('⚠️ 無効なテキスト入力');
        return result;
      }

      // 正規化：改行と空白の処理
      const normalizedText = rawText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();

      const lines = normalizedText.split('\n').map(line => line.trim()).filter(line => line);

      // パターンマッチング
      this.extractEmployeeId(lines, result);
      this.extractEmployeeName(lines, result);
      this.extractDepartment(lines, result);
      this.extractWorkDate(lines, result);
      this.extractTimes(lines, result);
      this.extractBreakTime(lines, result);
      this.extractRemarks(lines, result);

      // 整理された文字起こし形式を生成
      const formattedText = this.generateFormattedText(rawText, result);
      result.formattedText = formattedText;

      console.log('✅ テキスト解析完了:', result);
      return result;

    } catch (error) {
      console.error('❌ テキスト解析エラー:', error);
      return {
        employeeId: '',
        employeeName: '',
        department: '',
        workDate: '',
        startTime: '',
        endTime: '',
        breakTime: '',
        remarks: ''
      };
    }
  }

  // 社員番号抽出
  extractEmployeeId(lines, result) {
    const patterns = [
      /(?:社員番号|職員番号|社員ID|職員ID|ID|番号)[\s:：]*([0-9A-Za-z]+)/i,
      /([0-9]{4,8})/,  // 4-8桁の数字
      /No[\s.]*([0-9A-Za-z]+)/i
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          result.employeeId = match[1].trim();
          console.log(`📝 社員番号検出: ${result.employeeId}`);
          return;
        }
      }
    }
  }

  // 氏名抽出
  extractEmployeeName(lines, result) {
    // 除外する単語リスト（氏名ではない単語）
    const excludedWords = ['カード', 'タイム', 'TIME', 'CARD', '前半', '後半', '年月', '分'];
    
    const patterns = [
      /(?:氏名|名前|社員名|職員名)[\s:：]*([ぁ-ゟ一-龯ァ-ヾA-Za-z\s]+)/,
      /Name[\s:：]*([A-Za-zぁ-ゟ一-龯ァ-ヾ\s]+)/i
    ];

    // 氏名ラベルの次の行をチェック（優先）
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 氏名ラベルを発見した場合、次の行をチェック
      if (/^(?:氏名|名前|社員名|職員名)$/.test(line.trim()) && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (/^[ぁ-ゟ一-龯ァ-ヾ\s]{2,20}$/.test(nextLine) && !excludedWords.includes(nextLine)) {
          result.employeeName = nextLine;
          console.log(`👤 氏名検出（次行パターン）: ${result.employeeName}`);
          return;
        }
      }
    }
    
    // 通常のパターンマッチング
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          const name = match[1].trim().replace(/様|さん|氏$/g, '');
          if (name.length >= 2 && name.length <= 20 && !excludedWords.some(word => name.includes(word))) {
            result.employeeName = name;
            console.log(`👤 氏名検出（パターンマッチ）: ${result.employeeName}`);
            return;
          }
        }
      }
    }
    
    // より厳格な日本人名パターン（姓+名の組み合わせ）
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // 2-4文字の姓 + 2-4文字の名前のパターン
      if (/^[ぁ-ゟ一-龯ァ-ヾ]{2,4}[ぁ-ゟ一-龯ァ-ヾ]{2,4}$/.test(line) && 
          !excludedWords.includes(line) &&
          line.length >= 4 && line.length <= 8) {
        result.employeeName = line;
        console.log(`👤 氏名検出（日本人名パターン）: ${result.employeeName}`);
        return;
      }
    }
  }

  // 部署抽出
  extractDepartment(lines, result) {
    const patterns = [
      /(?:部署|所属|課|部|室|チーム|グループ)[\s:：]*([ぁ-ゟ一-龯ァ-ヾA-Za-z0-9\s]+)/,
      /([ぁ-ゟ一-龯ァ-ヾ]+(?:部|課|室|チーム|グループ))/,
      /Department[\s:：]*([A-Za-zぁ-ゟ一-龯ァ-ヾ\s]+)/i
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          result.department = match[1].trim();
          console.log(`🏢 部署検出: ${result.department}`);
          return;
        }
      }
    }
  }

  // 勤務日抽出
  extractWorkDate(lines, result) {
    const patterns = [
      /(?:勤務日|出勤日|日付|年月日)[\s:：]*(\d{4}[-\/年]\d{1,2}[-\/月]\d{1,2}日?)/,
      /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/,
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/,
      /(\d{4}年\d{1,2}月\d{1,2}日)/,
      /R(\d+)年(\d+)月分?/, // 令和年月形式
      /令和(\d+)年(\d+)月分?/,
      /Date[\s:：]*(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i
    ];

    for (const line of lines) {
      // 令和年月の特別処理
      const reiwaMatch = line.match(/R(\d+)年(\d+)月分?/);
      if (reiwaMatch) {
        const reiwaYear = parseInt(reiwaMatch[1]);
        const month = reiwaMatch[2].padStart(2, '0');
        const westernYear = 2018 + reiwaYear; // 令和1年 = 2019年
        result.workDate = `${westernYear}-${month}`;
        console.log(`📅 勤務年月検出（令和）: ${result.workDate}`);
        return;
      }
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          result.workDate = this.normalizeDate(match[1]);
          console.log(`📅 勤務日検出: ${result.workDate}`);
          return;
        }
      }
    }
  }

  // 時刻抽出
  extractTimes(lines, result) {
    const timePatterns = [
      /(?:出勤|開始|始業)[\s:：]*(\d{1,2}):?(\d{2})/,
      /(?:退勤|終了|終業)[\s:：]*(\d{1,2}):?(\d{2})/,
      /Start[\s:：]*(\d{1,2}):?(\d{2})/i,
      /End[\s:：]*(\d{1,2}):?(\d{2})/i
    ];

    for (const line of lines) {
      // 出勤時刻
      const startPatterns = [
        /(?:出勤|開始|始業|出社)[\s:：時]*(\d{1,2}):?(\d{2})/,
        /Start[\s:：]*(\d{1,2}):?(\d{2})/i
      ];

      for (const pattern of startPatterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[2] && !result.startTime) {
          result.startTime = this.normalizeTime(match[1], match[2]);
          console.log(`🌅 出勤時刻検出: ${result.startTime}`);
          break;
        }
      }

      // 退勤時刻
      const endPatterns = [
        /(?:退勤|終了|終業|退社)[\s:：時]*(\d{1,2}):?(\d{2})/,
        /End[\s:：]*(\d{1,2}):?(\d{2})/i
      ];

      for (const pattern of endPatterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[2] && !result.endTime) {
          result.endTime = this.normalizeTime(match[1], match[2]);
          console.log(`🌆 退勤時刻検出: ${result.endTime}`);
          break;
        }
      }
    }

    // 汎用時刻パターン（複数の時刻が含まれる場合）
    if (!result.startTime || !result.endTime) {
      this.extractGenericTimes(lines, result);
    }
  }

  // 汎用時刻抽出
  extractGenericTimes(lines, result) {
    const timeRegex = /(\d{1,2}):(\d{2})/g;
    const allTimes = [];

    for (const line of lines) {
      let match;
      while ((match = timeRegex.exec(line)) !== null) {
        const time = this.normalizeTime(match[1], match[2]);
        if (this.isValidTime(time)) {
          allTimes.push(time);
        }
      }
    }

    // 時刻をソートして、最初を出勤、最後を退勤として設定
    if (allTimes.length >= 2) {
      allTimes.sort();
      if (!result.startTime) {
        result.startTime = allTimes[0];
        console.log(`🌅 汎用出勤時刻検出: ${result.startTime}`);
      }
      if (!result.endTime) {
        result.endTime = allTimes[allTimes.length - 1];
        console.log(`🌆 汎用退勤時刻検出: ${result.endTime}`);
      }
    }
  }

  // 休憩時間抽出
  extractBreakTime(lines, result) {
    const patterns = [
      /(?:休憩|昼休み|ブレイク)[\s:：]*(\d{1,3})[\s]*(?:分|min)/i,
      /Break[\s:：]*(\d{1,3})[\s]*(?:分|min|minutes?)/i,
      /(\d{1,3})[\s]*(?:分|min)[\s]*(?:休憩|昼休み|ブレイク)/i
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          const minutes = parseInt(match[1]);
          if (minutes >= 0 && minutes <= 480) { // 0-8時間
            result.breakTime = minutes.toString();
            console.log(`⏸️ 休憩時間検出: ${result.breakTime}分`);
            return;
          }
        }
      }
    }

    // デフォルト値（昼休み1時間）
    if (!result.breakTime && result.startTime && result.endTime) {
      result.breakTime = '60';
      console.log(`⏸️ デフォルト休憩時間設定: ${result.breakTime}分`);
    }
  }

  // 備考抽出
  extractRemarks(lines, result) {
    const patterns = [
      /(?:備考|メモ|注意|特記)[\s:：]*(.*)/,
      /Remarks?[\s:：]*(.*)/i,
      /Notes?[\s:：]*(.*)/i
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].trim()) {
          result.remarks = match[1].trim();
          console.log(`📄 備考検出: ${result.remarks}`);
          return;
        }
      }
    }
  }

  // 日付正規化
  normalizeDate(dateStr) {
    const cleaned = dateStr.replace(/[年月日]/g, '-').replace(/\s+/g, '');
    
    // YYYY-MM-DD 形式に変換
    const patterns = [
      /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,  // YYYY-MM-DD
      /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/   // MM-DD-YYYY
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        let year, month, day;
        if (match[1].length === 4) {
          [, year, month, day] = match;
        } else {
          [, month, day, year] = match;
        }
        
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    return dateStr;
  }

  // 時刻正規化
  normalizeTime(hour, minute) {
    const h = parseInt(hour);
    const m = parseInt(minute);
    
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    
    return '';
  }

  // 時刻検証
  isValidTime(timeStr) {
    const match = timeStr.match(/(\d{2}):(\d{2})/);
    if (!match) return false;
    
    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    
    return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
  }

  // テキスト品質評価
  evaluateTextQuality(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      return { score: 0, issues: ['テキストが空または無効'] };
    }

    let score = 0;
    const issues = [];

    // 文字数チェック
    if (rawText.length > 50) score += 20;
    else if (rawText.length > 20) score += 15;
    else issues.push('テキストが短すぎます');

    // 日本語文字の存在
    if (/[ぁ-ゟ一-龯ァ-ヾ]/.test(rawText)) score += 30;
    else issues.push('日本語文字が検出されません');

    // 数字の存在
    if (/\d/.test(rawText)) score += 20;
    else issues.push('数字が検出されません');

    // 時刻パターンの存在
    if (/\d{1,2}:\d{2}/.test(rawText)) score += 20;
    else issues.push('時刻パターンが検出されません');

    // 日付パターンの存在
    if (/\d{4}[-\/年]\d{1,2}[-\/月]\d{1,2}/.test(rawText)) score += 10;

    return { score, issues };
  }

  // 整理された文字起こし形式を生成（Gemini風）
  generateFormattedText(rawText, parsedData) {
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line);
    
    let formatted = '';
    
    // タイトル
    formatted += 'タイムカード';
    if (parsedData.workDate) {
      formatted += `  ${parsedData.workDate}分\n`;
    } else {
      formatted += '\n';
    }
    
    // 基本情報
    if (parsedData.employeeName) {
      formatted += `氏名: ${parsedData.employeeName}\n`;
    }
    if (parsedData.department) {
      formatted += `部署: ${parsedData.department}\n`;
    }
    
    // 時刻データの前に改行
    formatted += '\n';
    
    // 勤務時間データを抽出してフォーマット
    const timeEntries = this.extractTimeEntriesForTable(lines);
    timeEntries.forEach(entry => {
      formatted += entry + '\n';
    });
    
    return formatted;
  }
  
  // シンプルな時刻エントリを抽出（左右並び用）
  extractSimpleTimeEntries(lines) {
    const timeEntries = [];
    const timePattern = /(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})/;
    
    lines.forEach(line => {
      const match = line.match(timePattern);
      if (match) {
        timeEntries.push(`${match[1]}   ${match[2]}`);
      }
    });
    
    return timeEntries;
  }
  
  // 勤務時間エントリを抽出
  extractTimeEntries(lines) {
    const timeEntries = [];
    const timePattern = /^(\d{1,2}):(\d{2})$/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (timePattern.test(line)) {
        // 時刻を発見した場合、前後の文脈から出勤/退勤を判定
        const prevLine = i > 0 ? lines[i - 1] : '';
        const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
        
        if (prevLine === 'イン' || nextLine === 'アウト') {
          // 出勤時刻
          if (timeEntries.length === 0 || timeEntries[timeEntries.length - 1].out) {
            timeEntries.push({ in: line, out: '' });
          } else {
            timeEntries[timeEntries.length - 1].in = line;
          }
        } else if (prevLine === 'アウト' || this.isLikelyEndTime(line)) {
          // 退勤時刻
          if (timeEntries.length > 0 && !timeEntries[timeEntries.length - 1].out) {
            timeEntries[timeEntries.length - 1].out = line;
          } else {
            timeEntries.push({ in: '', out: line });
          }
        }
      }
    }
    
    return timeEntries;
  }
  
  // 時刻データかどうかを判定
  isTimeData(line) {
    return /^\d{1,2}:\d{2}$/.test(line) || 
           ['イン', 'アウト', '出社', '帰り'].includes(line);
  }
  
  // 基本情報かどうかを判定
  isBasicInfo(line) {
    return ['氏名', '名前', '所属', '社員ID', 'タイムカード', 'TIME CARD'].some(keyword => 
      line.includes(keyword)
    ) || /^[ぁ-ゟ一-龯ァ-ヾ]{2,10}$/.test(line);
  }
  
  // 退勤時刻らしいかどうかを判定
  isLikelyEndTime(time) {
    const [hour] = time.split(':').map(Number);
    return hour >= 17; // 17時以降は退勤時刻の可能性が高い
  }
  
  // 勤務時間表を抽出（空白位置を保持）
  extractTimeTable(lines) {
    const tableRows = [];
    let isInTable = false;
    let tableStartIndex = -1;
    let tableEndIndex = -1;
    
    // 表の開始と終了を検出
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // ヘッダー行を検出（イン、アウトが含まれる行）
      if (this.isTableHeaderRow(line)) {
        tableStartIndex = i;
        isInTable = true;
        continue;
      }
      
      // 表内の数字行を検出
      if (isInTable && this.isTableDataRow(line)) {
        tableEndIndex = i;
        continue;
      }
      
      // 表の終了を検出
      if (isInTable && !this.isTableDataRow(line) && !this.isTableHeaderRow(line) && line.trim()) {
        break;
      }
    }
    
    // 表の範囲が見つかった場合、その範囲を抽出
    if (tableStartIndex >= 0) {
      // ヘッダー行を追加
      tableRows.push(lines[tableStartIndex]);
      
      // データ行を追加
      for (let i = tableStartIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (this.isTableDataRow(line)) {
          tableRows.push(line);
        } else if (line.trim() === '') {
          // 空行は表の終了の可能性が高い
          break;
        } else if (!this.isTimeData(line.trim())) {
          // 時刻データでない行は表の終了
          break;
        }
      }
    }
    
    return tableRows;
  }
  
  // 表のヘッダー行かどうかを判定
  isTableHeaderRow(line) {
    const trimmed = line.trim();
    return (trimmed.includes('イン') && trimmed.includes('アウト')) ||
           (trimmed.includes('出勤') && trimmed.includes('退勤'));
  }
  
  // 表のデータ行かどうかを判定
  isTableDataRow(line) {
    const trimmed = line.trim();
    // 数字で始まり、時刻パターンを含む行
    return /^\d/.test(trimmed) && /\d{1,2}:\d{2}/.test(line);
  }
  
  // 表の行かどうかを判定
  isTableRow(line) {
    return this.isTableHeaderRow(line) || this.isTableDataRow(line);
  }
  
  // Gemini風の表形式で時刻エントリを抽出
  extractTimeEntriesForTable(lines) {
    const timePattern = /(\d{1,2}:\d{2})/g;
    const timeEntries = [];
    const allTimes = [];
    
    // 全ての時刻を抽出
    lines.forEach(line => {
      const matches = line.match(timePattern);
      if (matches) {
        matches.forEach(time => {
          allTimes.push({
            time: time,
            context: line,
            isStart: this.isStartTime(time, line),
            isEnd: this.isEndTime(time, line)
          });
        });
      }
    });
    
    // 時刻をペアにして行を生成
    let currentRow = ['', '', '', '', '', ''];
    let rowIndex = 0;
    
    for (let i = 0; i < allTimes.length; i++) {
      const timeData = allTimes[i];
      const time = timeData.time;
      
      // 出勤時刻の判定
      if (timeData.isStart || this.isLikelyStartTime(time)) {
        // 空いている出勤時刻の列に配置
        if (!currentRow[0]) {
          currentRow[0] = time;
        } else if (!currentRow[2]) {
          currentRow[2] = time;
        } else if (!currentRow[4]) {
          currentRow[4] = time;
        }
      } 
      // 退勤時刻の判定
      else if (timeData.isEnd || this.isLikelyEndTime(time)) {
        // 空いている退勤時刻の列に配置
        if (currentRow[0] && !currentRow[1]) {
          currentRow[1] = time;
        } else if (currentRow[2] && !currentRow[3]) {
          currentRow[3] = time;
        } else if (currentRow[4] && !currentRow[5]) {
          currentRow[5] = time;
        } else if (!currentRow[1]) {
          currentRow[1] = time;
        } else if (!currentRow[3]) {
          currentRow[3] = time;
        } else if (!currentRow[5]) {
          currentRow[5] = time;
        }
      }
      
      // 行が完成したら次の行へ
      if (this.isRowComplete(currentRow) || i === allTimes.length - 1) {
        const formattedRow = this.formatTableRow(currentRow);
        if (formattedRow.trim()) {
          timeEntries.push(formattedRow);
        }
        currentRow = ['', '', '', '', '', ''];
      }
    }
    
    return timeEntries;
  }
  
  // 出勤時刻かどうかを判定
  isStartTime(time, context) {
    return context.includes('イン') || context.includes('出社') || 
           /^0[6-9]:|^1[01]:/.test(time); // 6-11時は出勤時刻の可能性が高い
  }
  
  // 退勤時刻かどうかを判定  
  isEndTime(time, context) {
    return context.includes('アウト') || context.includes('帰り') ||
           /^1[7-9]:|^2[0-3]:/.test(time); // 17-23時は退勤時刻の可能性が高い
  }
  
  // 出勤時刻らしいかどうかを判定
  isLikelyStartTime(time) {
    const [hour] = time.split(':').map(Number);
    return hour >= 6 && hour <= 11;
  }
  
  // 行が完成したかどうかを判定
  isRowComplete(row) {
    return (row[0] && row[1]) || (row[2] && row[3]) || (row[4] && row[5]);
  }
  
  // 表の行をフォーマット
  formatTableRow(row) {
    const formatted = [];
    for (let i = 0; i < 6; i++) {
      if (row[i]) {
        formatted.push(row[i].padEnd(8, ' '));
      } else {
        formatted.push('        ');
      }
    }
    return formatted.join('').trimEnd();
  }
}

module.exports = new TextParser();