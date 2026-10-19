# 网页维护约定

- 默认使用中文，以官方资料为依据，保留证据、版本和具体未知事项。
- 网站作为独立、完整的成品呈现；不展示修订批次、历史数量对比或“本轮新增”标记与筛选。
- 保留来源核查日期、产品版本及标准状态，不把文档核查描述为软件接口实测。
- 编辑 layout.html、atlas.css、atlas.js 和 research/ 中的数据；生成 HTML 不直接编辑。
- 修改后运行 python3 scripts/build-atlas.py、node --check atlas.js、node scripts/check-atlas.mjs。
- main 分支通过检查后由 GitHub Actions 自动发布 GitHub Pages；仅发布 _site/ 中的网页。
