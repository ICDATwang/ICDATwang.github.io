# 王伟 — 学术主页

[王伟学术主页](https://icdatwang.github.io/)的源代码。

王伟是西北工业大学机械工程专业博士研究生，主要研究故障预测与健康管理、剩余使用寿命预测和不确定性量化。

## 内容维护

- 英文内容：`content/`
- 中文内容：`content_zh/`
- 论文数据：`content/publications.bib`
- 个人照片及静态文件：`public/`

## 本地运行

建议使用 Node.js 22 或更高版本。

```bash
npm ci
npm run dev
```

生成正式静态网站：

```bash
npm run build
```

构建结果位于 `out/`。推送到 `main` 分支后，GitHub Actions 会自动部署到 GitHub Pages。

## 致谢

本网站基于开源学术主页模板 [PRISM](https://github.com/xyjoey/PRISM) 构建，并保留其 MIT 许可证。
