// タイムカードOCRアプリ - フロントエンド JavaScript

class TimecardOCR {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8080/api';
        this.currentFile = null;
        this.ocrData = null;
        
        // 初期状態を強制設定
        this.resetUI();
        this.initializeEventListeners();
    }

    // UI初期状態リセット
    resetUI() {
        // 結果セクションを強制的に非表示
        const resultSection = document.getElementById('resultSection');
        const progressSection = document.getElementById('progressSection');
        
        if (resultSection) {
            resultSection.style.display = 'none';
            resultSection.classList.remove('fade-in');
        }
        if (progressSection) {
            progressSection.style.display = 'none';
        }
    }

    // イベントリスナーの初期化
    initializeEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const editForm = document.getElementById('editForm');

        // ファイル選択
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // ドラッグ&ドロップ
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        uploadArea.addEventListener('click', () => fileInput.click());

        // ダウンロードボタン（結果画面のアイコン）
        const downloadExcelResults = document.getElementById('downloadExcelResults');
        if (downloadExcelResults) {
            downloadExcelResults.addEventListener('click', () => this.downloadFile('excel'));
        }
    }

    // ファイル選択処理
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    // ドラッグオーバー処理
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        document.getElementById('uploadArea').classList.add('drag-over');
    }

    // ドラッグリーブ処理
    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        document.getElementById('uploadArea').classList.remove('drag-over');
    }

    // ファイルドロップ処理
    handleFileDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        document.getElementById('uploadArea').classList.remove('drag-over');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    // ファイル処理
    async processFile(file) {
        // ファイル検証
        if (!this.validateFile(file)) {
            return;
        }

        console.log('ファイル処理開始:', file.name);
        this.currentFile = file;
        
        // UI更新
        this.showProgress();
        this.updateProgress(10, 'ファイルをアップロード中...');

        try {
            // ファイルアップロード
            const formData = new FormData();
            formData.append('image', file);

            this.updateProgress(30, 'OCR処理を開始中...');

            console.log('API呼び出し開始:', `${this.apiBaseUrl}/ocr`);
            // API呼び出し
            const response = await fetch(`${this.apiBaseUrl}/ocr`, {
                method: 'POST',
                body: formData
            });
            
            console.log('API レスポンス:', response.status, response.ok);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API データ:', data);

            this.updateProgress(80, 'OCR結果を処理中...');

            // 結果処理
            if (data && data.success) {
                console.log('OCR成功、結果表示準備中');
                this.ocrData = data;
                this.displayResults();
                
                this.updateProgress(100, '処理完了！');
                
                setTimeout(() => {
                    console.log('結果表示実行');
                    this.hideProgress();
                    this.showResults();
                }, 1000);
            } else {
                console.error('OCR処理失敗:', data);
                throw new Error('OCR処理に失敗しました。');
            }

        } catch (error) {
            console.error('OCR処理エラー:', error);
            this.hideProgress();
            
            // エラーの詳細を確認して適切なメッセージを表示
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;
                
                if (status === 400) {
                    this.showError(`入力エラー: ${errorData.error || 'ファイル形式を確認してください。'}`);
                } else if (status === 413) {
                    this.showError('ファイルサイズが大きすぎます。5MB以下のファイルを選択してください。');
                } else if (status === 500) {
                    this.showError(`サーバーエラー: ${errorData.error || 'しばらく待ってから再試行してください。'}`);
                } else {
                    this.showError(`エラー (${status}): ${errorData.error || 'もう一度お試しください。'}`);
                }
            } else if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
                this.showError('ネットワークエラーが発生しました。サーバーが起動していることを確認してください。');
            } else if (error.message.includes('Network Error') || error.message.includes('fetch')) {
                this.showError('サーバーに接続できません。バックエンドサーバー (http://localhost:8080) が起動していることを確認してください。');
            } else {
                this.showError(`OCR処理中にエラーが発生しました: ${error.message || 'もう一度お試しください。'}`);
            }
        }
    }

    // ファイル検証
    validateFile(file) {
        const allowedTypes = ['image/jpeg', 'image/png'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.type)) {
            this.showError('JPEGまたはPNG形式のファイルを選択してください。');
            return false;
        }

        if (file.size > maxSize) {
            this.showError('ファイルサイズは5MB以下にしてください。');
            return false;
        }

        return true;
    }

    // プログレス表示
    showProgress() {
        document.getElementById('progressSection').style.display = 'block';
        document.getElementById('resultSection').style.display = 'none';
    }

    // プログレス更新
    updateProgress(percentage, text) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const progressPercentage = document.querySelector('.progress-percentage');
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        if (progressPercentage) {
            progressPercentage.textContent = `${Math.round(percentage)}%`;
        }
        if (progressText) {
            progressText.textContent = text;
        }
    }

    // プログレス非表示
    hideProgress() {
        document.getElementById('progressSection').style.display = 'none';
    }

    // 結果表示
    displayResults() {
        const uploadedImage = document.getElementById('uploadedImage');
        const ocrResult = document.getElementById('ocrResult');

        // 画像表示
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImage.src = e.target.result;
        };
        reader.readAsDataURL(this.currentFile);

        // OCR結果表示は不要なので削除

        // フォームにデータ設定
        this.populateForm();
    }

    // フォームデータ設定
    populateForm() {
        if (!this.ocrData.structured) return;

        const data = this.ocrData.structured;
        
        // 整理された文字起こし形式を表示
        if (data.formattedText) {
            document.getElementById('formattedText').value = data.formattedText;
            // 表形式表示は不要なので削除
        }
        
        // 従来形式は削除済みなのでスキップ

        this.calculateWorkHours();
    }

    // 実働時間計算
    calculateWorkHours() {
        const startTimeEl = document.getElementById('startTime');
        const endTimeEl = document.getElementById('endTime');
        
        if (!startTimeEl || !endTimeEl) return; // 要素が存在しない場合は処理をスキップ
        
        const startTime = startTimeEl.value;
        const endTime = endTimeEl.value;
        const breakTime = 60; // デフォルト60分

        if (startTime && endTime) {
            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);
            
            if (end > start) {
                const diffMs = end - start;
                const diffMinutes = Math.floor(diffMs / (1000 * 60));
                const workMinutes = diffMinutes - breakTime;
                
                if (workMinutes > 0) {
                    const hours = Math.floor(workMinutes / 60);
                    const minutes = workMinutes % 60;
                    console.log(`実働時間: ${hours}時間${minutes}分`);
                }
            }
        }
    }

    // 表示切替
    toggleView() {
        const tableContainer = document.getElementById('timecardTableContainer');
        const textArea = document.getElementById('formattedText');
        const toggleBtn = document.getElementById('toggleViewBtn');
        
        if (tableContainer.style.display === 'none') {
            // テキストから表形式へ
            tableContainer.style.display = 'block';
            textArea.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-file-alt"></i> テキスト形式に切替';
            
            // 現在のテキストを解析して表に反映
            if (textArea.value) {
                this.parseAndDisplayTimecard(textArea.value);
            }
        } else {
            // 表形式からテキストへ
            tableContainer.style.display = 'none';
            textArea.style.display = 'block';
            toggleBtn.innerHTML = '<i class="fas fa-table"></i> 表形式に切替';
            
            // 表のデータをテキストに反映
            this.updateTextFromTable();
        }
    }
    
    // 表のデータをテキストエリアに反映
    updateTextFromTable() {
        const tbody = document.getElementById('timecardTableBody');
        const rows = tbody.querySelectorAll('tr');
        let text = 'タイムカード\n\n';
        let hasData = false;
        
        rows.forEach((row, index) => {
            const inputs = row.querySelectorAll('input');
            let dayData = '';
            
            // 3セットの出勤・退勤時刻をチェック
            for (let i = 0; i < inputs.length; i += 2) {
                const checkIn = inputs[i].value;
                const checkOut = inputs[i + 1] ? inputs[i + 1].value : '';
                if (checkIn || checkOut) {
                    if (dayData) dayData += '  ';
                    dayData += `${checkIn || ''}  ${checkOut || ''}`;
                    hasData = true;
                }
            }
            
            if (dayData) {
                text += `${index + 1}日  ${dayData}\n`;
            }
        });
        
        if (!hasData) {
            text = 'タイムカード\n\n（データなし）';
        }
        
        document.getElementById('formattedText').value = text;
    }

    // タイムカードデータを解析して表形式で表示
    parseAndDisplayTimecard(formattedText) {
        const lines = formattedText.split('\n');
        const tbody = document.getElementById('timecardTableBody');
        const tableContainer = document.getElementById('timecardTableContainer');
        const textArea = document.getElementById('formattedText');
        
        tbody.innerHTML = ''; // 既存の行をクリア
        
        // 15日分のデータを初期化
        const monthData = {};
        for (let i = 1; i <= 15; i++) {
            monthData[i] = { checkIn: '', checkOut: '' };
        }
        
        // 時刻パターンを検索（例: 08:14   17:34）
        const timePattern = /\b(\d{1,2}:\d{2})\s+(?:(\d{1,2}:\d{2}))?/g;
        let currentDay = 1;
        
        lines.forEach(line => {
            const matches = [...line.matchAll(timePattern)];
            if (matches.length > 0) {
                matches.forEach(match => {
                    if (match[1] && currentDay <= 15) {
                        monthData[currentDay] = {
                            checkIn: match[1],
                            checkOut: match[2] || ''
                        };
                        currentDay++;
                    }
                });
            }
        });
        
        // 15日分の行を作成
        for (let day = 1; day <= 15; day++) {
            const data = monthData[day];
            const row = this.createTableRow(day, data.checkIn, data.checkOut);
            tbody.appendChild(row);
        }
        
        // 行追加ボタンを非表示にする（15日固定なので不要）
        const addRowBtn = document.getElementById('addRowBtn');
        if (addRowBtn) {
            addRowBtn.style.display = 'none';
        }
    }
    
    // テーブル行を作成
    createTableRow(day, checkIn, checkOut) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="time" class="form-control form-control-sm text-center" value="${checkIn}" /></td>
            <td><input type="time" class="form-control form-control-sm text-center" value="${checkOut}" /></td>
            <td><input type="time" class="form-control form-control-sm text-center" value="" /></td>
            <td><input type="time" class="form-control form-control-sm text-center" value="" /></td>
            <td><input type="time" class="form-control form-control-sm text-center" value="" /></td>
            <td><input type="time" class="form-control form-control-sm text-center" value="" /></td>
        `;
        return row;
    }

    // 結果セクション表示
    showResults() {
        const resultSection = document.getElementById('resultSection');
        
        if (resultSection) {
            resultSection.style.display = 'block';
            resultSection.classList.add('fade-in');
        }
    }

    // ファイルダウンロード
    async downloadFile(format) {
        try {
            const formData = this.getFormData();
            
            const response = await fetch(`${this.apiBaseUrl}/export/${format}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const filename = `timecard_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
            link.setAttribute('download', filename);
            
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            window.URL.revokeObjectURL(url);
            
            this.showSuccess(`${format.toUpperCase()}ファイルをダウンロードしました。`);
            
        } catch (error) {
            console.error('ダウンロードエラー:', error);
            this.showError('ファイルのダウンロードに失敗しました。');
        }
    }

    // フォームデータ取得
    getFormData() {
        return {
            formattedText: document.getElementById('formattedText').value,
            // 従来フォームは削除したので、OCRデータから取得
            employeeName: this.ocrData?.structured?.employeeName || '',
            department: this.ocrData?.structured?.department || '',
            startTime: this.ocrData?.structured?.startTime || '',
            endTime: this.ocrData?.structured?.endTime || '',
            // レガシーフィールド（互換性のため）
            employeeId: '',
            workDate: '',
            breakTime: '60',
            workHours: ''
        };
    }

    // エラーメッセージ表示
    showError(message) {
        this.showAlert(message, 'danger');
    }

    // 成功メッセージ表示
    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    // アラート表示
    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);

        // 5秒後に自動削除
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    new TimecardOCR();
});