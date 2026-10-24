# 工业软件与接口目录

[浏览网页](https://kaidi-zha.github.io/industrial-software-atlas/)

37 个工业及相关工程领域的 361 个软件条目、362 条交互路径、50 项协议与标准，以及 1129 个去重官方来源。支持按行业、交互目的、生产环节和技术形式筛选，以及搜索、软件对比、标准关联、机理与模型、覆盖矩阵和 CSV 导出。

用途资料核查日期：2026-10-24；接口详录日期：2026-10-19；机理详录日期：2026-10-21（Asia/Shanghai）。211 款有接口详录，150 款核实用途和功能，后者不推定接口或算法。已检查 211 款软件的模型资料，按证据深度标记状态并提供分类检索。所有接口均为文档核查，未安装软件或进行互操作测试；具体未知项、版本与许可条件见各条目。条目数量不代表市场份额或行业使用率，也不表示已经穷尽行业软件。

## 维护与构建

网页按独立、完整的成品编排，读者界面不展示更新批次或修订过程。编辑 `layout.html`、`atlas.css`、`atlas.js` 及 `research/` 内的原始记录。`base` 与 `details` 文件按软件名、接口名对齐；`enriched-protocols.json` 保存标准详情。用途与功能来源为 `industry-catalog.tsv`，领域与跨行业导航分别由 `industry-sectors.json`、`industry-links.json` 维护。没有接口详录的软件仍在 CSV 保留一行。目录文件分组仅用于维护，不构成读者界面分类。

无需安装第三方构建依赖，使用 Python 3 和支持 Blob 的 Node.js（18 或以上）：

```sh
python3 scripts/build-atlas.py
node --check atlas.js
node scripts/check-atlas.mjs
python3 scripts/package-pages.py
```

输出为 `_site/index.html`，正文、数据和交互均嵌入单文件，下载后可以离线浏览；官方来源链接需要网络。`research/atlas-data.json`、构建统计和验证记录也是生成产物，不直接编辑。

提交至 `main` 后，GitHub Actions 执行构建与检查，仅将 `_site/` 发布到 GitHub Pages。也可以在 Actions 页面手动运行部署流程。研究笔记、工作区其他材料和本机配置不在网页发布目录中。
