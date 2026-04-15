# TASK QUEUE

優先度自動計算タスク管理アプリ（PWA）

## セットアップ手順

### 1. GitHubにリポジトリを作る

- GitHub で `task-queue` という名前の新しいリポジトリを作成（Public）
- ⚠️ リポジトリ名を変える場合は `vite.config.js` の `base` も合わせて変更

### 2. このフォルダをプッシュする

```bash
cd task-queue
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/task-queue.git
git push -u origin main
```

### 3. GitHub Pages を有効化

1. リポジトリの Settings → Pages
2. Source を **GitHub Actions** に変更
3. プッシュすると自動でデプロイされる

### 4. スマホでPWAとして使う

1. ブラウザで `https://YOUR_USERNAME.github.io/task-queue/` を開く
2. **iPhone**: 共有ボタン → 「ホーム画面に追加」
3. **Android**: メニュー → 「ホーム画面に追加」またはインストールプロンプト

## ローカルで動かす場合

```bash
npm install
npm run dev
```
