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
    const patterns = [
      /(?:氏名|名前|社員名|職員名)[\s:：]*([ぁ-ゟ一-龯ァ-ヾA-Za-z\s]+)/,
      /([ぁ-ゟ一-龯ァ-ヾ]{2,10})\s*(?:様|さん|氏)?$/,
      /Name[\s:：]*([A-Za-zぁ-ゟ一-龯ァ-ヾ\s]+)/i
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          const name = match[1].trim().replace(/様|さん|氏$/g, '');
          if (name.length >= 2 && name.length <= 20) {
            result.employeeName = name;
            console.log(`👤 氏名検出: ${result.employeeName}`);
            return;
          }
        }
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
      /Date[\s:：]*(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i
    ];

    for (const line of lines) {
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
}

module.exports = new TextParser();