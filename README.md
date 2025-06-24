# タイムカードOCRアプリケーション

タイムカード画像をAI OCRで読み取り、Excel/CSVに転記するWebアプリケーションです。

## 🚀 特徴

- **画像アップロード**: ドラッグ&ドロップまたはファイル選択
- **AI OCR**: Google Vision APIによる高精度文字認識
- **データ編集**: 認識結果の確認・修正機能
- **エクスポート**: CSV/Excel形式での出力
- **レスポンシブ**: PC・タブレット・スマートフォン対応

## 📋 システム要件

- Node.js 16.0.0 以上
- Google Cloud Platform アカウント（Vision API有効化）
- 対応ブラウザ：Chrome, Firefox, Safari, Edge

## 🛠️ セットアップ

### 1. リポジトリクローン
```bash
git clone https://github.com/MasakiOgata3/timecardocr.git
cd timecardocr
```

### 2. バックエンドセットアップ
```bash
cd backend
npm install
```

### 3. 環境変数設定
```bash
cp .env.example .env
```

`.env` ファイルを編集して以下を設定：
```env
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
PORT=3000
NODE_ENV=development
```

### 4. Google Vision API設定

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. Vision API を有効化
3. サービスアカウントキーをダウンロード
4. キーファイルパスを環境変数に設定

### 5. サーバー起動
```bash
# 開発モード
npm run dev

# 本番モード
npm start
```

### 6. フロントエンド起動
```bash
# Live Server（VS Code拡張機能）を使用
# または任意のWebサーバーでfrontend/index.htmlを開く
```

## 📁 プロジェクト構成

```
timecard-ocr/
├── frontend/                 # フロントエンド
│   ├── index.html           # メインページ
│   ├── style.css            # スタイルシート
│   └── script.js            # JavaScript
├── backend/                 # バックエンドAPI
│   ├── server.js            # メインサーバー
│   ├── controllers/         # コントローラー
│   ├── services/           # サービス層
│   ├── utils/              # ユーティリティ
│   └── package.json        # 依存関係
├── uploads/                # アップロードファイル
├── docs/                   # ドキュメント
├── 要件定義書.md           # 要件定義
└── アプリ構成図.md         # システム構成図
```

## 🔧 API エンドポイント

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/health` | ヘルスチェック |
| POST | `/api/ocr` | OCR処理 |
| POST | `/api/export/csv` | CSV出力 |
| POST | `/api/export/excel` | Excel出力 |

## 📱 使用方法

1. **ファイルアップロード**
   - タイムカード画像をドラッグ&ドロップ
   - または「ファイルを選択」ボタンをクリック

2. **OCR処理**
   - 自動的にOCR処理が開始
   - 進捗バーで処理状況を確認

3. **結果確認・編集**
   - 認識されたテキストを確認
   - 必要に応じてデータを手動修正

4. **ダウンロード**
   - CSV または Excel 形式を選択
   - ファイルをダウンロード

## 🧪 開発モード

Google Vision API未設定でも開発可能なモックモードを搭載：

```bash
# 環境変数未設定時は自動的にモックモードで動作
npm run dev
```

## 🔒 セキュリティ

- ファイルサイズ制限（5MB）
- 対応ファイル形式制限（JPG, PNG）
- レート制限（15分間で100リクエスト）
- セキュリティヘッダー（Helmet）
- アップロードファイルの自動削除

## 📊 対応データ項目

- 社員番号
- 氏名
- 部署
- 勤務日
- 出勤時刻
- 退勤時刻
- 休憩時間
- 実働時間（自動計算）

## 🐛 トラブルシューティング

### OCR処理が失敗する場合
1. Google Vision API の設定確認
2. サービスアカウントキーの権限確認
3. 画像品質の確認（解像度、明るさ、傾き）

### ファイルアップロードエラー
1. ファイルサイズ確認（5MB以下）
2. ファイル形式確認（JPG, PNG）
3. ネットワーク接続確認

### サーバー起動エラー
1. Node.js バージョン確認（16.0.0以上）
2. ポート番号の競合確認
3. 依存関係のインストール確認

## 🚀 デプロイ

### Heroku
```bash
# Heroku CLI インストール後
heroku create your-app-name
git push heroku main
heroku config:set GOOGLE_APPLICATION_CREDENTIALS=...
```

### Vercel（フロントエンドのみ）
```bash
# Vercel CLI インストール後
cd frontend
vercel
```

## 📈 今後の拡張予定

- [ ] 複数ファイル一括処理
- [ ] ユーザー認証機能
- [ ] データベース連携
- [ ] 月次集計機能
- [ ] テンプレート設定
- [ ] 画像前処理オプション

## 🤝 コントリビューション

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で配布されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 📞 サポート

質問やバグレポートは [Issues](https://github.com/MasakiOgata3/timecardocr/issues) までお願いします。

---

🤖 Generated with [Claude Code](https://claude.ai/code)