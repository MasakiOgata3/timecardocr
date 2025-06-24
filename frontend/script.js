// タイムカードOCRアプリ - フロントエンド JavaScript

class TimecardOCR {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api';
        this.currentFile = null;
        this.ocrData = null;
        
        this.initializeEventListeners();
    }

    // イベントリスナーの初期化
    initializeEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const downloadCsv = document.getElementById('downloadCsv');
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
        downloadCsv.addEventListener('click', () => this.downloadFile('csv'));
        downloadExcel.addEventListener('click', () => this.downloadFile('excel'));

        // フォーム変更時の計算
        const startTime = document.getElementById('startTime');
        const endTime = document.getElementById('endTime');
        const breakTime = document.getElementById('breakTime');
        
        [startTime, endTime, breakTime].forEach(element => {
            element.addEventListener('change', () => this.calculateWorkHours());
        });
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
            const response = await axios.post(`${this.apiBaseUrl}/ocr`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    this.updateProgress(30 + (progress * 0.3), 'ファイルをアップロード中...');
                }
            });

            this.updateProgress(80, 'OCR結果を処理中...');

            // 結果処理
            this.ocrData = response.data;
            this.displayResults();
            
            this.updateProgress(100, '処理完了！');
            
            setTimeout(() => {
                this.hideProgress();
                this.showResults();
            }, 1000);

        } catch (error) {
            console.error('OCR処理エラー:', error);
            this.hideProgress();
            this.showError('OCR処理中にエラーが発生しました。もう一度お試しください。');
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
        ocrResult.value = this.ocrData.rawText || '';

        // フォームにデータ設定
        this.populateForm();
    }

    // フォームデータ設定
    populateForm() {
        if (!this.ocrData.structured) return;

        const data = this.ocrData.structured;
        
        document.getElementById('employeeId').value = data.employeeId || '';
        document.getElementById('employeeName').value = data.employeeName || '';
        document.getElementById('workDate').value = data.workDate || '';
        document.getElementById('department').value = data.department || '';
        document.getElementById('startTime').value = data.startTime || '';
        document.getElementById('endTime').value = data.endTime || '';
        document.getElementById('breakTime').value = data.breakTime || '60';

        this.calculateWorkHours();
    }

    // 実働時間計算
    calculateWorkHours() {
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const breakTime = parseInt(document.getElementById('breakTime').value) || 0;

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
                    document.getElementById('workHours').value = `${hours}時間${minutes}分`;
                } else {
                    document.getElementById('workHours').value = '0時間0分';
                }
            }
        }
    }

    // 結果セクション表示
    showResults() {
        document.getElementById('resultSection').style.display = 'block';
        document.getElementById('downloadSection').style.display = 'block';
        document.getElementById('resultSection').classList.add('fade-in');
        document.getElementById('downloadSection').classList.add('fade-in');
    }

    // ファイルダウンロード
    async downloadFile(format) {
        try {
            const formData = this.getFormData();
            
            const response = await axios.post(`${this.apiBaseUrl}/export/${format}`, formData, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
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
            employeeId: document.getElementById('employeeId').value,
            employeeName: document.getElementById('employeeName').value,
            workDate: document.getElementById('workDate').value,
            department: document.getElementById('department').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            breakTime: document.getElementById('breakTime').value,
            workHours: document.getElementById('workHours').value
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