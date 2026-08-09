#!/bin/zsh
set -e

PROJECT_DIR="/Users/liuyinuo/Documents/Codex/2026-07-27/new-chat-2"
cd "$PROJECT_DIR"

echo "正在检查游戏项目……"
npm run build

echo "正在提交当前游戏版本……"
git add app public package.json package-lock.json next.config.ts next-env.d.ts tsconfig.json postcss.config.mjs eslint.config.mjs README.md .gitignore "双击预览游戏.command" "上传当前游戏到公网.command"

if git diff --cached --quiet; then
  echo "没有新的修改需要提交。"
else
  git commit -m "Update game cover, rubbing, and audio experiences"
fi

git branch -M main
git push origin main

echo ""
echo "上传成功。Vercel 正在自动更新原来的公网链接。"
echo "通常等待 1–3 分钟即可刷新查看。"
echo ""
read "REPLY?按回车键关闭窗口……"
