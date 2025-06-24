# Google Vision API セットアップガイド

## 手順1: Google Cloud Platform プロジェクト作成

### 1.1 Google Cloud Console にアクセス
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. Googleアカウントでログイン

### 1.2 新しいプロジェクトを作成
1. ヘッダーの「プロジェクトを選択」をクリック
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を入力（例：`timecard-ocr-app`）
4. 「作成」をクリック

### 1.3 プロジェクトを選択
- 作成したプロジェクトが選択されていることを確認

## 手順2: Vision API の有効化

### 2.1 APIライブラリにアクセス
1. 左側メニューから「APIとサービス」→「ライブラリ」をクリック
2. 検索ボックスに「Vision API」と入力
3. 「Cloud Vision API」をクリック

### 2.2 APIを有効化
1. 「有効にする」ボタンをクリック
2. 有効化完了まで数分待機

## 手順3: サービスアカウントの作成

### 3.1 サービスアカウント作成
1. 左側メニューから「IAM と管理」→「サービス アカウント」をクリック
2. 「サービス アカウントを作成」をクリック
3. 以下の情報を入力：
   - **サービスアカウント名**: `timecard-ocr-service`
   - **サービスアカウントID**: 自動生成される
   - **説明**: `タイムカードOCRアプリ用のサービスアカウント`
4. 「作成して続行」をクリック

### 3.2 権限の設定
1. 「ロールを選択」で以下を選択：
   - `Cloud Vision API サービス エージェント`
   - または `Project Editor`（開発用）
2. 「続行」をクリック
3. 「完了」をクリック

### 3.3 認証キーの生成
1. 作成されたサービスアカウントをクリック
2. 「キー」タブをクリック
3. 「鍵を追加」→「新しい鍵を作成」をクリック
4. 「JSON」を選択して「作成」をクリック
5. JSONファイルが自動ダウンロードされる

## 手順4: 環境設定

### 4.1 認証キーファイルの配置
1. ダウンロードしたJSONファイルをプロジェクトに配置
   ```
   timecard-ocr/
   ├── backend/
   │   └── credentials/
   │       └── google-vision-key.json  ← ここに配置
   ```

### 4.2 環境変数の設定
`.env` ファイルを更新：
```env
# Google Vision API 設定
GOOGLE_APPLICATION_CREDENTIALS=./credentials/google-vision-key.json

# または絶対パス
# GOOGLE_APPLICATION_CREDENTIALS=/full/path/to/google-vision-key.json

# サーバー設定
PORT=3000
NODE_ENV=development
```

### 4.3 セキュリティ設定
`.gitignore` にキーファイルを追加：
```gitignore
# Google Vision API キー
backend/credentials/
*.json
!package*.json
```

## 手順5: 動作確認

### 5.1 サーバー再起動
```bash
cd backend
npm start
```

### 5.2 OCRテスト
1. ブラウザで `http://localhost:3000` にアクセス
2. タイムカード画像をアップロード
3. OCR処理が実行されることを確認

## 料金について

### 無料枠
- 月間1,000回まで無料
- それ以降は1,000回あたり$1.50

### 料金確認方法
1. Google Cloud Console の「お支払い」で使用量確認
2. 予算アラートの設定を推奨

## トラブルシューティング

### よくあるエラー

#### 1. `PERMISSION_DENIED`
- サービスアカウントの権限を確認
- Vision APIが有効化されているか確認

#### 2. `QUOTA_EXCEEDED`
- 無料枠を超過した場合
- 請求先アカウントの設定が必要

#### 3. `FILE_NOT_FOUND`
- 認証キーファイルのパスを確認
- 環境変数 `GOOGLE_APPLICATION_CREDENTIALS` を確認

#### 4. `INVALID_ARGUMENT`
- 画像ファイルの形式を確認（JPG, PNG対応）
- ファイルサイズを確認（20MB以下）

### ログ確認
```bash
# サーバーログでエラー詳細を確認
cd backend
npm start
```

## セキュリティベストプラクティス

1. **キーファイルの管理**
   - Git にコミットしない
   - 適切なファイル権限を設定

2. **アクセス制御**
   - 最小権限の原則に従う
   - 定期的なキーローテーション

3. **監視**
   - 使用量の監視
   - 異常なアクセスの検知

---

設定完了後、モックモードから実際のGoogle Vision APIに切り替わり、
本格的なOCR機能をご利用いただけます。