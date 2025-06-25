// タイムカードOCRアプリ - フロントエンド JavaScript

class TimecardOCR {
    constructor() {
        this.apiBaseUrl = 'https://your-backend-url.vercel.app/api';
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
        const downloadSection = document.getElementById('downloadSection');
        const progressSection = document.getElementById('progressSection');
        
        if (resultSection) {
            resultSection.style.display = 'none';
            resultSection.classList.remove('fade-in');
        }
        if (downloadSection) {
            downloadSection.style.display = 'none';
            downloadSection.classList.remove('fade-in');
        }
        if (progressSection) {
            progressSection.style.display = 'none';
        }
    }

    // イベントリスナーの初期化
    initializeEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const downloadExcel = document.getElementById('downloadExcel');
        const editForm = document.getElementById('editForm');

        // ファイル選択
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // ドラッグ&ドロップ
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        uploadArea.addEventListener('click', () => fileInput.click());

        // ダウンロードボタン
        downloadExcel.addEventListener('click', () => this.downloadFile('excel'));

        // フォーム変更時の計算
        const startTime = document.getElementById('startTime');
        const endTime = document.getElementById('endTime');
        
        if (startTime && endTime) {
            [startTime, endTime].forEach(element => {
                element.addEventListener('change', () => this.calculateWorkHours());
            });
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

        this.currentFile = file;
        
        // UI更新
        this.showProgress();
        this.updateProgress(10, 'ファイルをアップロード中...');

        try {
            // ファイルアップロード
            const formData = new FormData();
            formData.append('image', file);

            this.updateProgress(30, 'OCR処理を開始中...');

            // API呼び出し
            const response = await fetch(`${this.apiBaseUrl}/ocr`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();

            this.updateProgress(80, 'OCR結果を処理中...');

            // 結果処理
            if (data && data.success) {
                this.ocrData = data;
                this.displayResults();
                
                this.updateProgress(100, '処理完了！');
                
                setTimeout(() => {
                    this.hideProgress();
                    this.showResults();
                }, 1000);
            } else {
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
                this.showError('サーバーに接続できません。バックエンドサーバー (http://localhost:3000) が起動していることを確認してください。');
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
        document.getElementById('downloadSection').style.display = 'none';
    }

    // プログレス更新
    updateProgress(percentage, text) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        progressBar.style.width = `${percentage}%`;
        progressBar.textContent = `${Math.round(percentage)}%`;
        progressText.textContent = text;
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

        // OCR結果表示
        if (ocrResult) {
            ocrResult.value = this.ocrData.rawText || '';
        }

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
        }
        
        // 従来形式（参考用）
        document.getElementById('employeeName').value = data.employeeName || '';
        document.getElementById('department').value = data.department || '';
        document.getElementById('startTime').value = data.startTime || '';
        document.getElementById('endTime').value = data.endTime || '';

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

    // 結果セクション表示
    showResults() {
        const resultSection = document.getElementById('resultSection');
        const downloadSection = document.getElementById('downloadSection');
        
        if (resultSection) {
            resultSection.style.display = 'block';
            resultSection.classList.add('fade-in');
        }
        
        if (downloadSection) {
            downloadSection.style.display = 'block';
            downloadSection.classList.add('fade-in');
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
            employeeName: document.getElementById('employeeName').value,
            department: document.getElementById('department').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
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