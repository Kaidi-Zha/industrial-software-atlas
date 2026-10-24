'use strict';
const DATA=JSON.parse(document.getElementById('atlas-data').textContent);
const sectors=DATA.sectors, software=DATA.software, protocols=DATA.protocols;
const categories=DATA.categories;
const kinds=['API/SDK','脚本/CLI','文件格式','通信协议','信息模型'];
const stages=['研发设计','仿真分析','生产执行','设备控制','质量检测','运行运维'];
const theoryStatuses=DATA.theoryStatuses, theoryKinds=DATA.theoryKinds;
const state={view:'software',sector:'all',category:'',kind:'',stage:'',coverage:'',query:'',standard:'',electronicsArea:'',electronicsAccess:'',theoryStatus:'',theoryKind:'',page:1,selected:new Set()};
const PAGE_SIZE=12;
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sectorName=id=>sectors.find(s=>s.id===id)?.name||id;
const inSector=(x,id)=>x.sector===id||(x.additionalSectors||[]).includes(id);
const softwareSectorNames=x=>[x.sector,...(x.additionalSectors||[])].map(sectorName);
const sourceLink=s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`;
const sourceList=sources=>`<ul class="sources">${sources.map(s=>`<li>${sourceLink(s)}</li>`).join('')}</ul>`;
const tag=(label,kind)=>`<span class="tag" data-kind="${esc(kind)}">${esc(label)}</span>`;
const categoryName=id=>categories.find(c=>c.id===id)?.name||id;
const distinct=values=>[...new Set(values)];
const linkedStandards=x=>distinct(x.interactions.flatMap(i=>i.standardIds));
const relatedSoftware=id=>software.filter(x=>linkedStandards(x).includes(id));
const textList=items=>`<ul class="text-list">${items.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`;
const field=(title,value)=>`<div class="fact"><dt>${esc(title)}</dt><dd>${esc(value)}</dd></div>`;
const standardButtons=ids=>ids.length?`<div class="standard-buttons">${ids.map(id=>{const p=protocols.find(p=>p.id===id);return `<button data-protocol="${id}">${esc(p.name)} <span aria-hidden="true">↗</span></button>`;}).join('')}</div>`:'<p class="small">此接口未与标准索引建立支持关系；厂商 API、文件格式及尚未确认的标准不据此判为不支持。</p>';
function categoryNav(){
  const isProtocol=state.view==='protocols';
  const pool=isProtocol?protocols:software;
  const scoped=pool.filter(x=>(state.sector==='all'||(isProtocol?x.sectors.includes(state.sector):inSector(x,state.sector)))&&(isProtocol||matchesElectronics(x)));
  $('category-nav').innerHTML=[{id:'',short:'全部交互'},...categories].map(c=>{
    const n=c.id?scoped.filter(x=>isProtocol?x.categories.includes(c.id):x.interactions.some(i=>i.category===c.id)).length:scoped.length;
    return `<button data-category="${c.id}" aria-pressed="${state.category===c.id}" title="${esc(c.name||'查看全部交互方式')}">${esc(c.short)}<span>${n}</span></button>`;
  }).join('');
  $('category-description').textContent=state.category?categories.find(c=>c.id===state.category).description:'按交互目的分为六类，可与行业、生产环节和技术形式组合筛选。一个条目可以涉及多类。';
}
function buildNav(){
  const isProtocol=state.view==='protocols';
  const icons=[
    '<path d="M8 2v7l-5 9c-1 2 0 3 2 3h14c2 0 3-1 2-3l-5-9V2M7 2h10M7 14h10"/>',
    '<path d="M6 2c0 8 12 12 12 20M18 2C18 10 6 14 6 22M7 5h10M8 10h8M8 14h8M7 19h10"/>',
    '<path d="M4 3v7c0 3 6 3 6 0V3M7 3v19M17 3c-4 5-4 9 0 10v9M17 3v10h3V3"/>',
    '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 1v4m6-4v4m-6 14v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4M9 9h6v6H9Z"/>',
    '<path d="m9 3-1 3-3 1-2 4 2 2-1 3 3 3 3-1 2 3 4-2v-3l3-2-1-4-3-1-1-3Z"/><circle cx="11" cy="12" r="3"/>',
    '<path d="m3 12 7-3 3-7h3l-1 7 6 4v2l-7-2-2 7-2 1v-8l-7 1Z"/>',
    '<path d="m14 2-8 12h6l-2 8 9-13h-7Z"/>',
    '<path d="M4 22V5l8-3v20M12 9h8v13M1 22h22M7 7h2m-2 4h2m-2 4h2m6-3h2m-2 4h2"/>',
    '<path d="m2 21 7-14 5 9 3-5 6 10ZM7 21l7-14M4 4l4 2M17 3l4 4M16 8l7-7"/>',
    '<path d="M12 2c0 0-7 8-7 13a7 7 0 0 0 14 0c0-5-7-13-7-13ZM8 16c2-2 5 2 8 0"/>'
  ];
  $('industry-grid').innerHTML=sectors.map((s,i)=>`<button class="industry-tile" data-sector="${s.id}" aria-pressed="${state.sector===s.id}"><span class="industry-top"><span class="industry-index">${String(i+1).padStart(2,'0')}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[i]||'<circle cx="12" cy="12" r="7"/>'}</svg></span><strong>${esc(s.short)}</strong><small>${software.filter(x=>inSector(x,s.id)).length} 款软件 · ${protocols.filter(p=>p.sectors.includes(s.id)).length?protocols.filter(p=>p.sectors.includes(s.id)).length+' 项标准':'专业软件索引'}</small></button>`).join('');
  $('sector').innerHTML=[{id:'all',name:'全部行业'},...sectors].map(s=>{const n=isProtocol?(s.id==='all'?protocols.length:protocols.filter(p=>p.sectors.includes(s.id)).length):(s.id==='all'?software.length:software.filter(x=>inSector(x,s.id)).length);return `<option value="${s.id}">${esc(s.name)}（${n}）</option>`;}).join('');
  $('sector').value=state.sector;
}
function init(){
  $('stats').innerHTML=[[sectors.length,'工业领域'],[software.length,'软件条目'],[protocols.length,'协议与标准'],[DATA.sources.length,'官方来源']].map(([n,t])=>`<div class="stat"><strong>${n}</strong><span>${t}</span></div>`).join('');
  $('stage').insertAdjacentHTML('beforeend',stages.map(v=>`<option>${v}</option>`).join(''));
  $('kind').insertAdjacentHTML('beforeend',kinds.map(v=>`<option>${v}</option>`).join(''));
  $('theory-status').insertAdjacentHTML('beforeend',Object.entries(theoryStatuses).map(([id,title])=>`<option value="${id}">${esc(title)}</option>`).join(''));
  $('theory-kind').insertAdjacentHTML('beforeend',theoryKinds.map(v=>`<option>${esc(v)}</option>`).join(''));
  $('sector-total').textContent=sectors.length;
  buildNav();render();
}
function matchText(item){
  const terms=state.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const text=JSON.stringify(item).toLocaleLowerCase();
  return terms.every(t=>text.includes(t));
}
function filteredSoftware(){return software.filter(x=>(state.sector==='all'||inSector(x,state.sector))&&(!state.category||x.interactions.some(i=>i.category===state.category))&&(!state.standard||linkedStandards(x).includes(state.standard))&&(!state.kind||x.interfaces.some(i=>i.type===state.kind))&&(!state.stage||x.stage===state.stage)&&(!state.coverage||x.coverageDepth===state.coverage)&&matchesElectronics(x)&&matchText(x));}
function filteredProtocols(){return protocols.filter(x=>(state.sector==='all'||x.sectors.includes(state.sector))&&(!state.category||x.categories.includes(state.category))&&(!state.kind||x.type===state.kind)&&matchText(x));}
function filteredTheory(){return software.filter(x=>(state.sector==='all'||inSector(x,state.sector))&&(!state.theoryStatus||x.theory.status===state.theoryStatus)&&(!state.theoryKind||x.theory.topics.some(t=>t.kind===state.theoryKind))&&matchText({name:x.name,vendor:x.vendor,sector:x.sector,additionalSectors:x.additionalSectors,theory:x.theory}));}
function functionDocumentationDetail(t){
  const f=t.functionDocumentation;if(!f)return '';
  return `<section class="function-documentation"><h4>功能与操作文档 · ${f.status==='confirmed'?'已读正文':'尚待确认'}</h4><p>${esc(f.summary)}</p><div class="function-document-list">${f.documents.map(d=>`<article>${sourceLink(d)}<p class="theory-doc-meta">${esc(d.version)} · ${esc(d.access)}</p><p>${esc(d.evidence)}</p></article>`).join('')}</div><details class="retrieval-details"><summary>文档获取方式与访问条件</summary><ul>${f.retrieval.map(a=>`<li><strong>${esc(a.method)}</strong><p>${esc(a.result)} · ${sourceLink({title:'对应入口',url:a.url})}</p></li>`).join('')}</ul></details></section>`;
}
function theoryDetail(x){
  const t=x.theory;
  if(t.status==='not-reviewed')return `<div class="theory-body"><p>${esc(t.summary)}</p><p>${esc(t.searchNote)}</p>${sourceList(x.sources)}<p class="verified">用途资料核查：${esc(x.sourceDate)} · 不作为机理手册核查记录</p></div>`;
  return `<div class="theory-body">${functionDocumentationDetail(t)}<p class="theory-summary">${esc(t.summary)}</p>${t.topics.length?`<div class="theory-topics">${t.topics.map(topic=>`<section class="theory-topic"><span class="eyebrow">${esc(topic.kind)}</span><h4>${esc(topic.title)}</h4><p>${esc(topic.explanation)}</p><dl>${field('适用假设与边界',topic.assumptions)}${field('文档章节',topic.locator)}</dl><div class="theory-citations">${topic.sourceUrls.map(url=>{const d=t.documents.find(d=>d.url===url);return sourceLink(d);}).join(' · ')}</div></section>`).join('')}</div>`:'<p class="theory-unavailable">尚未取得足以解释具体机理或模型的正文；这不表示缺少功能说明或操作文档。功能资料与机理证据分别记录，具体缺口见文档清单。</p>'}<details class="theory-documents"><summary>文档清单、版本与核查范围（${t.documents.length}）</summary><div>${t.documents.map(d=>`<article>${sourceLink(d)}<p class="theory-doc-meta">${esc(d.version)} · ${esc(d.access)}</p><p>${esc(d.evidence)}</p></article>`).join('')}<p class="theory-search-note">${esc(t.searchNote)}</p><p class="verified">机理与模型文档核查：${esc(t.checkedDate)} · 未运行或复现模型</p></div></details></div>`;
}
function theoryCard(x){
  const t=x.theory;
  return `<article class="theory-card" data-theory-software="${x.id}"><div class="theory-card-head"><div><h3>${esc(x.name)}</h3><p class="vendor">${esc(softwareSectorNames(x).join('、'))} · ${esc(x.vendor)}</p></div><span class="theory-status" data-status="${t.status}">${esc(theoryStatuses[t.status])}</span></div><p class="theory-card-summary">${esc(t.summary)}</p><div class="theory-card-foot"><div class="tags">${distinct(t.topics.map(v=>v.kind)).map(v=>tag(v,'')).join('')}</div><button class="detail-toggle" data-related-software="${x.id}">软件与接口详情 ↗</button></div><details class="theory-expand"><summary>${t.topics.length?`阅读 ${t.topics.length} 项模型说明与文档`:'阅读功能文档与机理资料范围'}</summary>${theoryDetail(x)}</details></article>`;
}
function theoryOverview(){
  const scoped=software.filter(x=>state.sector==='all'||inSector(x,state.sector));
  return `<section class="theory-overview"><h3>从功能名称，查到模型的适用条件</h3><p>${DATA.theorySummary.reviewed} 款软件的代表性模型与算法按证据深度列示。状态专指机理与模型证据深度，不表示有无软件功能文档；物理方程、数值方法、几何模型与业务规则分别归类，不能互相替代。</p><div class="theory-status-grid">${Object.entries(theoryStatuses).map(([id,title])=>`<button data-theory-status="${id}" aria-pressed="${state.theoryStatus===id}"><strong>${scoped.filter(x=>x.theory.status===id).length}</strong><span>${esc(title)}</span></button>`).join('')}</div><details class="theory-reading"><summary>资料状态与阅读方法</summary><p>“有理论或模型正文”：取得至少一项模型、算法或规则的实质解释，仍不代表产品全部功能已核查。“局部机理或模型说明”：读到部分机制解释，但未覆盖完整算法或理论。“机理正文访问受限”：已定位相关手册，但正文需要登录、许可或安装环境。“机理正文待核实”：功能文档可以已确认，具体模型证据仍未取得。“机理尚未专项核查”：目前仅整理用途资料，没有开展该项审读。仅看到功能名称或目录，不展开其内部算法。</p><p>公开局部说明与需登录的完整手册可以同时存在；条目状态按已取得的模型证据归类，具体手册的访问限制在文档清单保留。功能与操作文档单独列示，提供已读内容、版本和获取方式。先读功能与模型的关系，再检查假设、版本及文档章节。物理模型关注守恒、本构和过程简化；数学模型关注变量、目标与约束；数值算法关注离散、迭代与稳定性；几何与数据模型关注对象和关系；业务与控制模型关注状态、执行及反馈。文档核查未验证软件的计算正确性或工程适用性。</p><button class="btn" data-theory-status="">显示全部资料状态</button></details></section>`;
}
function matchesElectronics(x){
  if(state.sector!=='electronics')return true;
  return [['areas',state.electronicsArea],['access',state.electronicsAccess]].every(([key,id])=>!id||DATA.electronicsContext[key].find(g=>g.id===id)?.softwareNames.includes(x.name));
}
function electronicsGuide(){
  const context=DATA.electronicsContext;
  const choices=(key,title,selected)=>`<div class="electronics-choices"><span>${title}</span>${[{id:'',name:'全部'},...context[key]].map(g=>`<button data-electronics-${key}="${g.id}" aria-pressed="${selected===g.id}">${esc(g.name)}</button>`).join('')}</div>`;
  return `<section class="electronics-guide" aria-label="电子设计工作对象与产品关系"><h3>电子设计与仿真导航</h3><p>${esc(context.description)}</p>${choices('areas','工作对象',state.electronicsArea)}${choices('access','查阅入口',state.electronicsAccess)}<details class="electronics-relations"><summary>平台、套件与工具的关系</summary><div class="electronics-family-grid">${context.relationships.map(g=>`<article><span class="eyebrow">${esc(g.level)}</span><h4>${esc(g.name)}</h4><p>${esc(g.description)}</p><div class="electronics-family-links">${g.softwareNames.map(name=>{const x=software.find(x=>x.name===name);return `<button data-related-software="${x.id}">${esc(name)} <span aria-hidden="true">↗</span></button>`;}).join('')}</div>${sourceList(g.sources)}</article>`).join('')}</div></details><p class="electronics-scope">${esc(context.comparisonBoundary)}</p></section>`;
}
function structuralGuide(){
  const context=DATA.structuralContext;
  return `<section class="electronics-guide structural-guide" aria-label="结构与抗震分析工具"><h3>${esc(context.title)}</h3><p>${esc(context.description)}</p><div class="structural-tool-grid">${context.softwareNames.map(name=>{const x=software.find(x=>x.name===name),c=x.productContext;return `<div><button data-related-software="${x.id}">${esc(name)} <span aria-hidden="true">↗</span></button><p>${esc(c.level)} · ${esc(c.ecosystem)}</p></div>`;}).join('')}</div><p class="electronics-scope">${esc(context.boundary)}</p></section>`;
}
function productContextDetail(x){
  const c=x.productContext;
  return c?`<section class="product-context"><h4>产品层级与使用条件</h4><dl>${field('条目类型',c.level)}${field('平台或产品关系',c.ecosystem)}${field('提供与许可说明',c.availability)}${field('范围与边界',c.note)}</dl>${sourceList(c.sources)}</section>`:'';
}
function workflowGuide(s){
  if(!s.workflows.length)return '';
  return `<details class="workflow-guide"><summary>按工作任务查阅</summary><p>以下按工作对象组织部分工具入口；同组工具的用途和范围仍有差异，不能据此判断可以互换或直接连接。</p><div class="workflow-groups">${s.workflows.map(g=>`<section><h3>${esc(g.name)}</h3><div>${g.softwareNames.map(name=>{const x=software.find(x=>x.name===name);return `<button data-related-software="${x.id}">${esc(name)} <span aria-hidden="true">↗</span></button>`;}).join('')}</div></section>`).join('')}</div></details>`;
}
function sectorIntro(){
  if(state.sector==='all')return '';
  const s=sectors.find(x=>x.id===state.sector);
  const links=protocols.filter(p=>s.featured.includes(p.id));
  return `<div class="sector-intro"><h2>${esc(s.name)}</h2><p>${esc(s.scope)}</p><div class="flow" aria-label="本领域所涉工作环节">${s.flow.map((v,i)=>`${i?'<b aria-hidden="true">→</b>':''}<span>${esc(v)}</span>`).join('')}</div><div class="protocol-links">${links.map(p=>`<button data-protocol="${p.id}">${esc(p.name)}</button>`).join('')}</div><p class="small">以上环节为阅读导航；各软件的适用范围见条目。标准标签可打开对应资料。</p>${workflowGuide(s)}</div>${state.sector==='electronics'?electronicsGuide():state.sector==='civil'?structuralGuide():''}`;
}
function softwareDetail(x){
  if(!x.interactions.length)return `<div class="detail-body"><section class="catalog-functions"><h4>主要功能</h4>${textList(x.capabilities)}<p class="constraint">${esc(x.constraints)}</p></section><section><h4>官方依据</h4>${sourceList(x.sources)}<p class="small">已核实用途与功能范围；接口契约及机理手册尚未专项核查。产品页中的接口线索不计入已核查交互路径。</p><p class="verified">用途资料核查：${esc(x.sourceDate)} · 未安装运行</p></section></div>`;
  const selected=x.interactions.find(i=>i.category===state.category)||x.interactions[0];
  return `<div class="detail-body">${productContextDetail(x)}<details class="software-theory"><summary>机理与模型 · ${esc(theoryStatuses[x.theory.status])}</summary>${theoryDetail(x)}</details><div class="profile-grid"><div><span class="eyebrow">人员入口</span><p>${esc(x.profile.humanEntry)}</p></div><div><span class="eyebrow">覆盖范围</span><p>${esc(x.profile.coverage)}</p></div><div><span class="eyebrow">版本边界</span><p>${esc(x.profile.versionBoundary)}</p></div></div><div class="route-nav" aria-label="${esc(x.name)}的交互路径">${x.interactions.map(i=>`<button data-route-software="${x.id}" data-route="${i.id}" aria-pressed="${i.id===selected.id}">${esc(i.name)}</button>`).join('')}</div><div id="route-panel-${x.id}" class="route-panel">${interactionDetail(x,selected)}</div><details class="knowledge-gaps"><summary>待核实事项（${x.profile.unknowns.length}）与全部软件来源</summary><div class="gap-content">${textList(x.profile.unknowns)}<p class="small">补充边界：${esc(x.constraints)}</p>${sourceList(x.sources)}</div></details><p class="verified">文档核查：${esc(x.sourceDate)} · 所有接口均未运行测试</p></div>`;
}
function softwareCard(x){
  const detailed=x.interactions.length>0;
  const labels=detailed?x.interfaces.slice(0,3).map(i=>tag(i.name,i.type)).join('')+(x.interfaces.length>3?tag('另 '+(x.interfaces.length-3)+' 项接口',''):''):x.capabilities.slice(0,3).map(t=>tag(t,'')).join('');
  return `<article class="software-card" data-software-id="${x.id}"><div class="software-row"><div class="identity"><div class="card-title"><h3>${esc(x.name)}</h3></div><p class="vendor">${esc(x.vendor)}</p>${x.productContext?`<p class="entry-context">${esc(x.productContext.level)} · ${esc(x.productContext.availability)}</p>`:''}<div class="row-meta">${state.sector==='all'?`<span>${esc(softwareSectorNames(x).join('、'))}</span>`:''}<span class="stage">${esc(x.stage)}</span></div></div><p class="purpose">${esc(x.purpose)}</p><div class="tags">${labels}<span class="route-count">${detailed?x.interactions.length+' 种交互路径':'用途与功能资料'}</span></div><div class="row-actions"><button class="detail-toggle" data-detail="${x.id}" aria-expanded="false" aria-controls="detail-${x.id}">详情 ＋</button><label class="compare-check"><input type="checkbox" data-compare="${x.id}" ${state.selected.has(x.id)?'checked':''} aria-label="对比 ${esc(x.name)}">对比</label></div></div><details class="card-details" id="detail-${x.id}"><summary>功能、交互与来源</summary>${softwareDetail(x)}</details></article>`;
}
function interactionDetail(x,i){
  const routeSources=i.evidence.sourceUrls.map(url=>x.sources.find(s=>s.url===url)||{title:url,url});
  return `<div class="route-heading"><div><span class="eyebrow">${esc(categoryName(i.category))}</span><h4>${esc(i.name)}</h4></div><div class="route-badges">${tag(i.implementation,'')}${tag(i.evidence.level,'')}</div></div><div class="interaction-grid"><section class="interaction-section"><h5><span>01</span>连接与能力</h5><dl>${field('调用入口',i.entry)}${field('角色与用途',i.role)}${field('数据方向',i.direction)}</dl><div class="fact"><span class="fact-label">已确认操作</span>${textList(i.operations)}</div></section><section class="interaction-section"><h5><span>02</span>数据与接入条件</h5><dl>${field('数据契约',i.dataContract)}${i.protocolNotes?field('协议与格式边界',i.protocolNotes):''}${field('版本与子集',i.version)}${field('环境、许可与权限',i.prerequisites)}</dl></section><section class="interaction-section"><h5><span>03</span>流程与运行反馈</h5><p class="suggestion-label">以下为依据文档整理的建议验证流程，未实际执行。</p><ol class="workflow-list">${i.workflow.map(t=>`<li>${esc(t.replace(/^建议[：:]\s*/,''))}</li>`).join('')}</ol><dl>${field('执行与完成判断',i.execution)}${field('错误、恢复与待核查',i.failure)}</dl></section><section class="interaction-section evidence-section"><h5><span>04</span>规范与依据</h5>${standardButtons(i.standardIds)}<div class="example-block"><span class="fact-label">${i.example.kind==='官方示例'?'官方示例片段（非完整程序，未运行）':'建议操作路径'}</span>${i.example.kind==='官方示例'?`<pre><code>${esc(i.example.text)}</code></pre>`:`<p>${esc(i.example.text)}</p>`}<a href="${esc(i.example.sourceUrl)}" target="_blank" rel="noopener noreferrer">${i.example.kind==='官方示例'?'查看原始示例':'查阅相关文档'} ↗</a></div><p class="evidence-locator">文档位置：${esc(i.evidence.locator)}</p>${sourceList(routeSources)}</section></div>`;
}
function protocolCard(p){const n=relatedSoftware(p.id).length;return `<article class="protocol-card" id="protocol-${p.id}"><div class="card-body"><div class="card-meta">${p.categories.map(c=>tag(categories.find(x=>x.id===c).short,'')).join('')}</div><h3>${esc(p.name)}</h3><p class="protocol-owner">${esc(p.owner)}</p><p class="purpose">${esc(p.purpose)}</p><p class="standard-status">${esc(p.specification.status)}</p><div class="standard-card-footer"><button data-protocol="${p.id}">规范与实施要求 <span aria-hidden="true">↗</span></button><span>${n?n+' 款软件有支持依据':'暂无软件支持关联'}</span></div></div></article>`;}
function protocolDetail(p){const s=p.specification,linked=relatedSoftware(p.id);return `<div class="reference-intro"><span class="eyebrow">${esc(s.status)}</span><h2 id="reference-title">${esc(p.name)}</h2><p>${esc(s.formalName)}</p><p class="protocol-owner">维护方：${esc(p.owner)} · 核查：${esc(p.sourceDate)}</p></div><div class="standard-facts"><div class="interaction-section"><h3>定义与适用范围</h3><div class="tags">${s.defines.map(t=>tag(t,'')).join('')}</div><dl>${field('系统边界',s.scope)}${field('传输与表达',s.transport)}${field('交换对象',s.objects)}${field('交互角色',s.roles)}</dl></div><div class="interaction-section"><h3>版本与实施要求</h3><dl>${field('版本及状态',s.version)}${field('兼容边界',s.compatibility)}</dl><span class="fact-label">实施时逐项确认</span>${textList(s.checklist)}<dl>${field('建议验证与工具',s.validation)}</dl></div></div><div class="linked-software"><h3>有文档支持关系的软件（${linked.length}）</h3><p class="small">仅显示本目录有软件官方依据的关系。关联不表示已通过互操作测试，也不代表实现了标准的全部能力。</p>${linked.length?`<div class="linked-rows">${linked.map(x=>`<div><button data-related-software="${x.id}">${esc(x.name)} <span aria-hidden="true">→</span></button><span>${x.interactions.filter(i=>i.standardIds.includes(p.id)).map(i=>esc(i.name)+' · '+esc(i.implementation)).join('；')}</span></div>`).join('')}</div>`:'<p class="no-relation">目前没有建立明确的软件支持关系；本标准在行业中的适用场景不作为支持证据。</p>'}</div><div class="reference-sources"><h3>官方来源与访问条件</h3><p>${esc(s.access)}</p><p class="small">资料位置：${esc(s.sourceLocator)}</p>${sourceList(p.sources)}</div>`;}
function openProtocol(id){const p=protocols.find(p=>p.id===id);$('reference-body').innerHTML=protocolDetail(p);$('reference-dialog').showModal();$('reference-body').scrollTop=0;}
function empty(){return '<div class="empty"><h3>没有匹配的条目</h3><p>可减少关键词或取消部分筛选条件。</p><button class="btn" data-reset>重置筛选</button></div>';}
function render(){
  const filterable=['software','protocols','theory'].includes(state.view);
  $('filters').hidden=!filterable;$('coverage').hidden=state.view!=='software'||!DATA.catalogSummary.functionOnly;$('coverage').value=state.coverage;$('stage').hidden=state.view!=='software';
  $('classification').hidden=!filterable||state.view==='theory';
  $('kind').hidden=state.view==='theory';
  $('theory-status').hidden=state.view!=='theory';$('theory-kind').hidden=state.view!=='theory';
  $('theory-status').value=state.theoryStatus;$('theory-kind').value=state.theoryKind;
  $('reading-note').textContent=filterable?(state.view==='software'?'展开功能或接口详情；最多对比 4 款':state.view==='theory'?'展开模型说明；文档清单保留版本与访问条件':'点击条目查看规范、版本和软件关联'):'';
  const headings={theory:['机理与模型','功能如何工作','官方理论、模型说明与算法章节，保留适用假设和资料缺口。'],software:['软件目录','专业软件','按行业与任务查找；用途资料和接口详录分别标明。'],protocols:['协议与标准','数据如何交换','按交换对象和应用场景查阅接口规范。'],matrix:['覆盖矩阵','收录范围','按行业与接口类型查看文档证据覆盖。'],method:['核查说明','如何使用这份目录','术语、证据范围与尚未验证的部分。']};
  const heading=headings[state.view];$('catalog-label').textContent=heading[0];$('catalog-heading').textContent=heading[1];$('catalog-description').textContent=heading[2];
  $('search').placeholder=state.view==='theory'?'搜索软件、模型、算法或假设…':state.view==='protocols'?'搜索协议、标准组织或交换对象…':'搜索软件、厂商、接口或用途…';
  $('stage').value=state.stage;$('kind').value=state.kind;$('search').value=state.query;
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.view===state.view)));
  buildNav();categoryNav();
  let html='';
  if(state.view==='software'){
    const found=filteredSoftware();
    const pages=Math.max(1,Math.ceil(found.length/PAGE_SIZE));state.page=Math.min(state.page,pages);
    const shown=found.slice((state.page-1)*PAGE_SIZE,state.page*PAGE_SIZE);
    $('result-count').textContent=`显示 ${found.length} / ${software.length} 个软件条目${state.sector==='all'?'':' · '+sectorName(state.sector)}`;
    const selectedStandard=protocols.find(p=>p.id===state.standard);
    html=(selectedStandard?`<div class="relation-filter">支持关系筛选：${esc(selectedStandard.name)}<button data-clear-standard>取消关联筛选 ×</button></div>`:'')+sectorIntro()+(found.length?`<div class="directory-columns" aria-hidden="true"><span>软件 / 厂商</span><span>主要用途</span><span>功能与接口</span><span>操作</span></div><div class="directory-list">${shown.map(softwareCard).join('')}</div>${pagination(found.length)}`:empty());
  }else if(state.view==='theory'){
    const found=filteredTheory(),pages=Math.max(1,Math.ceil(found.length/PAGE_SIZE));state.page=Math.min(state.page,pages);
    const shown=found.slice((state.page-1)*PAGE_SIZE,state.page*PAGE_SIZE);
    $('result-count').textContent=`显示 ${found.length} / ${software.length} 个软件条目${state.sector==='all'?'':' · '+sectorName(state.sector)}`;
    html=theoryOverview()+(found.length?`<div class="theory-grid">${shown.map(theoryCard).join('')}</div>${pagination(found.length)}`:empty());
  }else if(state.view==='protocols'){
    const found=filteredProtocols();
    const pages=Math.max(1,Math.ceil(found.length/PAGE_SIZE));state.page=Math.min(state.page,pages);
    const shown=found.slice((state.page-1)*PAGE_SIZE,state.page*PAGE_SIZE);
    $('result-count').textContent=`显示 ${found.length} / ${protocols.length} 项协议与标准${state.sector==='all'?'':' · '+sectorName(state.sector)}`;
    html=`<p class="scope-note">按交互目的分类，同一标准可涉及多类。行业标签表示应用场景；只有软件官方资料明确支持时，才建立软件关联。</p><div class="protocol-grid">${found.length?shown.map(protocolCard).join(''):empty()}</div>${pagination(found.length)}`;
  }else if(state.view==='matrix'){
    $('result-count').textContent='矩阵显示本次收录范围；可点击数字查看对应软件。';
    html=renderMatrix();
  }else{
    $('result-count').textContent=`官方来源去重后 ${DATA.sources.length} 个页面或文档`;
    html=renderMethod();
  }
  $('content').innerHTML=html;updateTray();
}
function pagination(total){const pages=Math.ceil(total/PAGE_SIZE);if(pages<2)return '';return `<div class="pagination"><button data-page="${state.page-1}" ${state.page<=1?'disabled':''}>← 上一页</button><span>第 ${state.page} / ${pages} 页 · 每页 ${PAGE_SIZE} 条</span><button data-page="${state.page+1}" ${state.page>=pages?'disabled':''}>下一页 →</button></div>`;}
function renderMatrix(){
  const counts=sectors.map(s=>({s,counts:categories.map(c=>software.filter(x=>inSector(x,s.id)&&x.interactions.some(i=>i.category===c.id)).length)}));
  const max=Math.max(...counts.flatMap(r=>r.counts),1);
  return `<div class="view-heading"><h2>各行业的交互方式覆盖</h2></div><div class="table-wrap"><table class="matrix"><caption class="hidden">按行业与交互目的统计有文档依据的软件条目数</caption><thead><tr><th scope="col">工业领域</th>${categories.map(c=>`<th scope="col" title="${esc(c.name)}">${esc(c.short)}</th>`).join('')}<th scope="col">软件数</th></tr></thead><tbody>${counts.map(({s,counts})=>`<tr><th class="rowname" scope="row"><button data-sector="${s.id}">${esc(s.name)}</button></th>${counts.map((n,i)=>`<td><button class="cell ${n?'':'zero'}" style="--strength:${n?(.05+n/max*.2).toFixed(3):0}" data-cell-sector="${s.id}" data-cell-category="${categories[i].id}" aria-label="${esc(s.name)}，${esc(categories[i].name)}，${n} 款软件">${n}</button></td>`).join('')}<td>${software.filter(x=>inSector(x,s.id)).length}</td></tr>`).join('')}</tbody></table></div><p class="matrix-note">每个单元格按“至少有一项该类交互路径的软件条目”计数，同一软件可计入多列；跨领域条目也可计入多行，总计按软件去重。零表示本目录未收录相应证据，不表示行业或产品不支持。现场通信标准另有收录；不将总线能力自动归给上层设计或分析软件。</p><div class="explainer"><h2>标准与软件的关联范围</h2><p>50 项标准覆盖行业背景；${protocols.filter(p=>relatedSoftware(p.id).length).length} 项已与收录软件建立明确的支持关系。未建立关系的标准仍保留，便于了解系统边界及后续核查。</p><div class="linked-standard-grid">${protocols.filter(p=>relatedSoftware(p.id).length).map(p=>`<button data-protocol="${p.id}"><span>${esc(p.name)}</span><b>${relatedSoftware(p.id).length} 款</b></button>`).join('')}</div></div>`;
}
function renderMethod(){
  return `<div class="explainer"><h2>机理与模型文档的核查范围</h2><p>已对 ${DATA.theorySummary.reviewed} 个软件条目开展机理文档专项检查，收集 ${DATA.theorySummary.topics} 项代表性模型主题及 ${DATA.theorySummary.documents} 个去重文档入口。机理核查日期为 ${esc(DATA.theorySummary.checkedDate)}；接口与标准沿用各条目的独立核查日期。</p><p>模型说明按物理与机理、数学模型、数值算法、几何与数据模型、业务与控制模型归类。资料状态只说明已取得的证据：读到局部理论不代表覆盖全部模块；未取得正文不代表软件不存在理论文档。功能与操作文档、局部模型解释、完整理论章节分别记录，不能以缺少理论正文推断缺少软件文档。功能资料保留具体内容、版本和获取路径；跟随官方文档页的嵌入PDF、迁移地址和官方源文档取得正文，登录或抓取错误只描述实际观察，不以接口 API 文档自动推断算法。</p><p>各项中文说明是对所引官方章节的归纳，模型分类与选题属于目录的整理判断。未复制整本手册，也未运行、校准或验证模型。完整方程、默认参数和最新实现须回到指定版本原文。</p></div><div class="explainer"><h2>用途资料与接口详录</h2><p>${DATA.catalogSummary.interfaceAudited} 个条目有交互资料，记录接口入口、对象与操作、数据约定、协议或格式、版本许可及未知事项。证据包括具体开发契约、官方示例和产品级说明，深度逐项标注；确认存在接口不代表已取得完整调用契约。对于未公开 API 的产品，保留实际可确认的文件、宏、模型或业务数据交互，并明确缺口。</p><p>软件 CSV 按已核查交互路径一行；没有接口详录的条目保留一行功能资料，接口字段留空。按交互分类或技术形式筛选时，仅返回有对应接口证据的条目。跨行业标签是查找导航，不声明软件已在所有所列行业部署或通过验证。</p></div><div class="explainer"><h2>收录范围与计数方式</h2><p>目录按 ${sectors.length} 个工业及相关工程领域组织 ${software.length} 个软件条目，覆盖通用设计工具与各领域的专业工作环节。套件按条目所列范围合并计数，同一软件的版本和多项 API 不拆成多款；跨领域标签不增加软件总数。平台关系导览不另计软件；例如 AEDT 作为平台说明，HFSS、Circuit、Icepak 和 siwave 按各自条目范围计数。</p><p>收录依据为公开官方资料，尚未穷尽各领域、地区、历史版本和企业自研软件。收录范围限于工业生产、工程设计与相关运营，也包括研究求解器和开发库。用途、机理、接口和实际部署适用性分别核查，条目数量不表示市场份额或使用率。</p></div><div class="explainer"><h2>六类交互方式</h2><p>分类以工作者要完成的交互任务为依据。程序 API、文件格式和标准体系并非同一层级，因此另保留“技术形式”筛选；同一标准可横跨多类。</p><div class="definitions">${categories.map(c=>`<div class="definition"><h3>${esc(c.name)}</h3><p>${esc(c.description)}</p></div>`).join('')}</div></div><div class="explainer"><h2>软件详情的阅读顺序</h2><ol class="method-steps"><li><strong>明确对象与操作。</strong> 先读覆盖范围和人员入口，确定要处理工程模型、生产对象、设备信号还是计算结果。</li><li><strong>选择交互路径。</strong> 每条路径独立记录入口、角色、方向、操作、数据契约、环境与许可，避免将一项能力推广为全部 API 能力。</li><li><strong>核对版本与执行过程。</strong> 检查宿主、模块、SDK 和标准版本，以及初始化、执行、完成、错误和资源释放。</li><li><strong>回到官方依据。</strong> 详情标明开发文档、官方示例或产品说明，以及文档位置。建议操作路径与官方代码片段分别展示。</li></ol></div><div class="explainer"><h2>两份目录如何关联</h2><p>软件目录记录具体产品的实现；标准索引解释正式名称、维护组织、状态、定义范围、系统边界、数据对象、角色、版本、兼容条件与验证资源。</p><p>仅将软件官方资料明确支持的标准建立关联，并保留实现方式和版本限制。标准在某个行业适用，不作为该行业每款软件的支持证据。关联可从软件详情进入标准，也可从标准返回相应软件。</p><p>实现方式分别标记内置接口、官方附加组件、官方客户端/库、文件交换或未核实。目录未系统收录第三方适配器或转换器；使用这类工具时，应核对提供方及转换边界。</p></div><div class="explainer"><h2>证据强度与尚未验证的部分</h2><p>开发文档可支持具体对象、方法及运行约定；官方示例只支持示例所覆盖的路径；产品说明通常仅确认接口存在和用途。不同字段的未知范围保留在正文及“待核实事项”中，不以空白或“不支持”替代。</p><p>全部 ${software.length} 个软件条目为资料整理，其中 ${DATA.catalogSummary.interfaceAudited} 个条目有 ${software.reduce((n,x)=>n+x.interactions.length,0)} 条接口详录，未安装软件、运行工程或进行互操作测试。建议流程依据文档整理；官方示例均为短片段，未承诺可直接执行。价格、套餐、现售许可及未明确列出的版本范围不作推断。</p><p>六类交互分类、推荐验证顺序及风险检查属于目录的整理判断。技术能力以所列官方来源及版本边界为依据。资料受账号、付费或动态页面限制时，保留可确认的层级及缺口。</p></div><div class="explainer"><h2>容易混淆的名称</h2><p>Eclipse SUMO 是交通模拟软件，环保水务中的 SUMO 是污水处理模拟软件。两者分别计数与检索。</p><p>SEMI EDA 指设备数据采集，电子设计 EDA 指电子设计自动化。KiCad IPC API 的 IPC 指进程间通信；IPC-CFX 的 IPC 是标准组织名称。测井 LAS 指 Log ASCII Standard；这里的 CIM 指电力公共信息模型。HL7 v2 支持不能推定为 FHIR，普通 OPC UA 支持不能推定为 PA-DIM、PackML 或 LADS。</p><p>HJ 212—2025 自 2026-01-01 起实施，替代 HJ 212—2017。页面对滚动文档、历史示例和版本缺口逐项说明，未将所有链接视为“最新版”。</p></div><details class="source-index"><summary>全部官方来源（${DATA.sources.length} 项，按链接去重）</summary><ul>${DATA.sources.map(s=>`<li>${sourceLink(s)}<small>支持条目：${s.items.map(esc).join('；')}</small></li>`).join('')}</ul></details>`;
}
function reset(){state.coverage='';state.theoryStatus='';state.theoryKind='';state.electronicsArea='';state.electronicsAccess='';state.sector='all';state.category='';state.standard='';state.kind='';state.stage='';state.query='';state.page=1;render();}
function scrollToCatalog(){$('catalog-heading').closest('.catalog-head').scrollIntoView({behavior:'auto',block:'start'});}
function setSector(id){$('industry-browser').open=false;state.electronicsArea='';state.electronicsAccess='';state.sector=id;state.page=1;if(!['software','protocols','theory'].includes(state.view))state.view='software';render();scrollToCatalog();}
function updateTray(){const n=state.selected.size;$('compare-tray').hidden=n===0;$('compare-count').textContent=`已选 ${n} / 4 款软件`;$('compare-open').disabled=n<2;}
function notify(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('toast').hidden=true,3000);}
function toggleCompare(id,input){if(input.checked){if(state.selected.size===4){input.checked=false;notify('最多对比 4 款软件，请先取消一项。');return;}state.selected.add(id);}else state.selected.delete(id);updateTray();}
function showCompare(){
  const list=software.filter(x=>state.selected.has(x.id));
  if(list.length<2)return;
  const rows=[['产品层级',x=>esc(x.productContext?.level||'按条目范围')],['平台与产品关系',x=>esc(x.productContext?.ecosystem||'未单列')],['提供与许可说明',x=>esc(x.productContext?.availability||'见接入条件')],['厂商',x=>esc(x.vendor)],['行业 / 环节',x=>`${esc(softwareSectorNames(x).join('、'))}<br>${esc(x.stage)}`],['核查深度',x=>x.coverageDepth==='function'?'用途与功能资料；接口未专项核查':'有接口详录'],['用途',x=>esc(x.purpose)],['人员入口',x=>esc(x.profile.humanEntry)],['覆盖范围',x=>esc(x.profile.coverage)],['交互路径',x=>!x.interactions.length?'尚未专项核查':`<ul>${x.interactions.map(i=>`<li><strong>${esc(i.name)}</strong><br>${esc(categoryName(i.category))} · ${esc(i.implementation)}<br>${esc(i.entry)}<br>${esc(i.direction)}</li>`).join('')}</ul>`],['版本边界',x=>esc(x.profile.versionBoundary)],['接入条件',x=>esc(x.constraints)],['机理与模型',x=>`<p>${esc(theoryStatuses[x.theory.status])}</p><p>${esc(x.theory.summary)}</p>${sourceList(x.theory.documents)}`],['待核实',x=>textList(x.profile.unknowns)],['标准支持依据',x=>standardButtons(linkedStandards(x))],['官方来源',x=>sourceList(x.sources)]];
  $('compare-body').innerHTML=`<p class="matrix-note">所列为各条目已核查接口与条件，不能据此推定这些软件可以直接互连。</p><div class="table-wrap"><table class="compare-table"><thead><tr><th scope="col">项目</th>${list.map(x=>`<th scope="col">${esc(x.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,fn])=>`<tr><th scope="row">${label}</th>${list.map(x=>`<td>${fn(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  $('compare-dialog').showModal();
}
function csvCell(value){let text=String(value??'');if(/^[=+@\-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';}
function exportCSV(){
  let rows,name;
  if(state.view==='theory'){
    rows=[['软件','厂商','行业','资料状态','核查概述','模型类别','主题','机理与模型说明','适用假设与边界','文档章节','主题依据','全部文档与版本/访问条件','核查范围与缺口','机理核查日期','实测状态','功能文档状态','功能文档概述','功能文档来源','文档获取方式'],...filteredTheory().flatMap(x=>(x.theory.topics.length?x.theory.topics:[null]).filter(t=>!t||!state.theoryKind||t.kind===state.theoryKind).map(t=>[x.name,x.vendor,softwareSectorNames(x).join('；'),theoryStatuses[x.theory.status],x.theory.summary,t?.kind||'',t?.title||'',t?.explanation||'',t?.assumptions||'',t?.locator||'',t?.sourceUrls.join('\n')||'',x.theory.documents.map(d=>`${d.title} | ${d.version} | ${d.access} | ${d.evidence} | ${d.url}`).join('\n'),x.theory.searchNote,x.theory.checkedDate,'未运行或复现模型',x.theory.functionDocumentation?.status==='confirmed'?'已读功能正文':x.theory.functionDocumentation?'尚待确认':'未单列核查',x.theory.functionDocumentation?.summary||'',x.theory.functionDocumentation?.documents.map(d=>`${d.title} | ${d.version} | ${d.access} | ${d.evidence} | ${d.url}`).join('\n')||'',x.theory.functionDocumentation?.retrieval.map(a=>`${a.method} | ${a.result} | ${a.url}`).join('\n')||'']))];name='industrial-software-models';
  }else if(state.view==='software'){
    rows=[['软件','厂商','行业','环节','用途','人员入口','覆盖范围','软件版本边界','交互路径','交互分类','实现方式','入口','角色与用途','数据方向','操作','数据契约','接口版本','环境许可权限','建议流程（未运行）','执行与完成判断','错误及待核查','证据类型','文档位置','接口来源','示例性质','示例内容（未运行）','示例依据','关联标准（仅文档确认）','待核实事项','核查日期','实测状态','条目类型','平台或产品关系','提供与许可说明','机理资料状态','机理与模型概述','模型主题','模型文档','机理核查日期','核查深度','主要功能','检索关键词','软件官方来源','协议与格式边界'],...filteredSoftware().flatMap(x=>(x.interactions.length?x.interactions:[null]).map(i=>[x.name,x.vendor,softwareSectorNames(x).join('；'),x.stage,x.purpose,x.profile.humanEntry,x.profile.coverage,x.profile.versionBoundary,i?.name||'',i?categoryName(i.category):'',i?.implementation||'',i?.entry||'',i?.role||'',i?.direction||'',i?.operations.join('\n')||'',i?.dataContract||'',i?.version||'',i?.prerequisites||'',i?.workflow.join('\n')||'',i?.execution||'',i?.failure||'',i?.evidence.level||'',i?.evidence.locator||'',i?.evidence.sourceUrls.join('\n')||'',i?.example.kind||'',i?.example.text||'',i?.example.sourceUrl||'',i?.standardIds.map(id=>protocols.find(p=>p.id===id).name).join('\n')||'',x.profile.unknowns.join('\n'),x.sourceDate,'未运行',x.productContext?.level||'',x.productContext?.ecosystem||'',x.productContext?.availability||'',theoryStatuses[x.theory.status],x.theory.summary,x.theory.topics.map(t=>t.title).join('；'),x.theory.documents.map(d=>d.title+' '+d.url).join('\n'),x.theory.checkedDate,x.coverageDepth==='function'?'用途与功能资料':'有接口详录',(x.capabilities||[]).join('；'),(x.keywords||[]).join(' '),x.sources.map(s=>s.title+' '+s.url).join('\n'),i?.protocolNotes||'']))];name='industrial-software-interactions';
  }else{
    rows=[['协议或标准','正式名称','组织','标准性质','交互分类','定义内容','系统边界','传输与表达','对象','角色','版本与状态','兼容条件','实施核查项','建议验证','资料访问条件','有支持依据的软件','官方来源','文档位置','核查日期'],...filteredProtocols().map(p=>{const s=p.specification;return [p.name,s.formalName,p.owner,s.status,p.categories.map(categoryName).join('；'),s.defines.join('；'),s.scope,s.transport,s.objects,s.roles,s.version,s.compatibility,s.checklist.join('\n'),s.validation,s.access,relatedSoftware(p.id).map(x=>x.name).join('；'),p.sources.map(s=>s.title+' '+s.url).join('\n'),s.sourceLocator,p.sourceDate];})];name='industrial-protocols';
  }
  const blob=new Blob(['\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name+'-'+(state.view==='theory'?DATA.theorySummary.checkedDate:state.view==='software'?DATA.checkedDate:DATA.interfaceCheckedDate)+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify(`已导出 ${rows.length-1} 条记录。`);
}
document.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target)return;
  if(target.hasAttribute('data-electronics-areas')){state.electronicsArea=target.dataset.electronicsAreas;state.page=1;render();return;}
  if(target.hasAttribute('data-electronics-access')){state.electronicsAccess=target.dataset.electronicsAccess;state.page=1;render();return;}
  if(target.dataset.route){const x=software.find(x=>x.id===target.dataset.routeSoftware),i=x.interactions.find(i=>i.id===target.dataset.route);$('route-panel-'+x.id).innerHTML=interactionDetail(x,i);target.parentElement.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===target)));return;}
  if(target.hasAttribute('data-category')){state.category=target.dataset.category;state.page=1;render();return;}
  if(target.hasAttribute('data-clear-standard')){state.standard='';state.page=1;render();return;}
  if(target.dataset.relatedSoftware){state.electronicsArea='';state.electronicsAccess='';const x=software.find(x=>x.id===target.dataset.relatedSoftware);$('reference-dialog').close();$('compare-dialog').close();state.view='software';state.sector='all';state.category='';state.kind='';state.stage='';state.standard='';state.query=x.name;state.page=1;render();const d=$('detail-'+x.id);d.open=true;const b=document.querySelector(`[data-detail="${x.id}"]`);if(b){b.setAttribute('aria-expanded','true');b.textContent='收起 −';b.focus();}scrollToCatalog();return;}
  if(target.dataset.detail){const d=$('detail-'+target.dataset.detail);d.open=!d.open;target.setAttribute('aria-expanded',String(d.open));target.textContent=d.open?'收起 −':'详情 ＋';return;}
  if(target.dataset.page){state.page=Number(target.dataset.page);render();scrollToCatalog();return;}
  if(target.dataset.openView){state.view=target.dataset.openView;state.page=1;state.kind='';state.stage='';state.query='';state.standard='';render();scrollToCatalog();return;}
  if(target.dataset.sector){setSector(target.dataset.sector);return;}
  if(target.dataset.view){state.view=target.dataset.view;state.kind='';state.stage='';state.query='';state.standard='';state.page=1;render();scrollToCatalog();return;}
  if(target.hasAttribute('data-theory-status')){state.theoryStatus=target.dataset.theoryStatus;state.page=1;render();return;}
  if(target.hasAttribute('data-reset')){reset();return;}
  if(target.dataset.cellSector){state.electronicsArea='';state.electronicsAccess='';state.sector=target.dataset.cellSector;state.category=target.dataset.cellCategory;state.kind='';state.standard='';state.stage='';state.query='';state.page=1;state.view='software';render();scrollToCatalog();return;}
  if(target.dataset.protocol){openProtocol(target.dataset.protocol);return;}
});
document.addEventListener('change',event=>{if(event.target.dataset.compare)toggleCompare(event.target.dataset.compare,event.target);});
$('search').addEventListener('input',event=>{state.query=event.target.value;state.page=1;render();});
$('stage').addEventListener('change',event=>{state.stage=event.target.value;state.page=1;render();});
$('theory-status').addEventListener('change',event=>{state.theoryStatus=event.target.value;state.page=1;render();});
$('theory-kind').addEventListener('change',event=>{state.theoryKind=event.target.value;state.page=1;render();});
$('kind').addEventListener('change',event=>{state.kind=event.target.value;state.page=1;render();});
$('coverage').addEventListener('change',event=>{state.coverage=event.target.value;state.page=1;render();});
$('sector').addEventListener('change',event=>{state.electronicsArea='';state.electronicsAccess='';state.sector=event.target.value;state.page=1;render();});
$('reset').addEventListener('click',reset);$('export').addEventListener('click',exportCSV);
$('compare-open').addEventListener('click',showCompare);$('compare-clear').addEventListener('click',()=>{state.selected.clear();document.querySelectorAll('[data-compare]').forEach(i=>i.checked=false);updateTray();});
$('compare-close').addEventListener('click',()=>$('compare-dialog').close());
$('reference-close').addEventListener('click',()=>$('reference-dialog').close());
document.querySelector('[role="tablist"]').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const buttons=Array.from(document.querySelectorAll('[role="tab"]'));let i=buttons.indexOf(document.activeElement);if(i<0)return;i=event.key==='Home'?0:event.key==='End'?buttons.length-1:(i+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[i].focus();buttons[i].click();});
init();
