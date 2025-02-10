# AI Agent Project

## 概要
このプロジェクトは、Google Cloud Platform (GCP) のAIおよびコンピュートプロダクトを活用した
インテリジェントなチャットボットアプリケーションです。

### 使用技術
- **AI プロダクト**: Vertex AI (Gemini API)
  - 高度な自然言語処理
  - マルチモーダル対話機能
  
- **コンピュート プロダクト**: Cloud Run
  - サーバーレスデプロイメント
  - 自動スケーリング
  - コンテナ化されたアプリケーション

## セットアップ
1. 必要な依存関係のインストール:
```bash
pip install -r requirements.txt
```

2. 環境変数の設定:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/your/credentials.json"
```

3. ローカルでの実行:
```bash
python src/main.py
```

## デプロイメント
Cloud Runへのデプロイ:
```bash
gcloud run deploy
```

## ライセンス
MIT License

## 貢献
プルリクエストは歓迎します。大きな変更の場合は、まずissueを作成して変更内容を議論してください。 