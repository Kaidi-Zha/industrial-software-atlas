import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'industrial-software-atlas.html'),'utf8');
const data=JSON.parse(html.match(/<script id="atlas-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const code=fs.readFileSync(path.join(root,'atlas.js'),'utf8');
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
const nodes=new Map();
class Node {
  innerHTML='';textContent='';value='';hidden=false;disabled=false;scrollTop=0;
  constructor(id){this.id=id;}
  insertAdjacentHTML(_position,text){this.innerHTML+=text;}
  addEventListener(){} setAttribute(){} click(){} remove(){} appendChild(){}
  scrollIntoView(){} closest(){return this;} showModal(){} close(){}
}
const document={
  getElementById(id){assert(ids.has(id),`Missing static element ${id}`);if(!nodes.has(id))nodes.set(id,new Node(id));return nodes.get(id);},
  querySelectorAll(){return [];},querySelector(){return new Node('tabs');},addEventListener(){},
  createElement(){return new Node('anchor');},body:new Node('body')
};
document.getElementById('atlas-data').textContent=JSON.stringify(data);
let exported;
const context=vm.createContext({document,Blob,URL:{createObjectURL(blob){exported=blob;return 'blob:test';},revokeObjectURL(){}},setTimeout(){return 1;},clearTimeout(){}});
vm.runInContext(code,context);
const run=expression=>vm.runInContext(expression,context);
assert.equal(data.software.length,144);assert.equal(data.protocols.length,50);
assert.equal(data.sectors.length,10);assert.equal(data.categories.length,6);
assert.equal(new Set(data.sources.map(s=>s.url)).size,data.sources.length);
assert(data.sources.length>=400);
assert(!data.revision);assert(data.software.every(x=>!x.addedBatch));
assert.equal(new Set(data.software.map(x=>x.id)).size,data.software.length);
assert.equal(new Set(data.software.map(x=>x.name.toLocaleLowerCase())).size,data.software.length);
for(const s of data.sectors){assert(data.software.filter(x=>x.sector===s.id).length>=14);}
for(const file of ['materials-biopharma-food.json','electronics-equipment-aero.json','power-civil.json','mining-environment.json'])for(const x of JSON.parse(fs.readFileSync(path.join(root,'research',file),'utf8')))assert(data.software.some(y=>y.name===x.name),`Baseline missing: ${x.name}`);
let routeCount=0,relationCount=0;
for(const x of data.software){
  assert(x.profile.humanEntry&&x.profile.coverage&&x.profile.versionBoundary&&x.profile.unknowns.length);
  assert.deepEqual(new Set(x.interfaces.map(i=>i.name)),new Set(x.interactions.map(i=>i.name)));
  for(const i of x.interactions){
    routeCount++;relationCount+=i.standardIds.length;
    assert(data.categories.some(c=>c.id===i.category));
    for(const key of ['entry','role','direction','dataContract','execution','failure','prerequisites','version','implementation'])assert(i[key]?.trim(),`${x.name}: ${key}`);
    assert(i.operations.length&&i.workflow.length&&i.evidence.sourceUrls.length&&i.evidence.locator);
    for(const url of [...i.evidence.sourceUrls,i.example.sourceUrl])assert(x.sources.some(s=>s.url===url),`${x.name}: unindexed source ${url}`);
    for(const pid of i.standardIds)assert(data.protocols.some(p=>p.id===pid));
    const detail=run(`interactionDetail(software.find(x=>x.id===${JSON.stringify(x.id)}),software.find(x=>x.id===${JSON.stringify(x.id)}).interactions.find(i=>i.id===${JSON.stringify(i.id)}))`);
    assert(detail.includes('连接与能力')&&detail.includes('错误、恢复与待核查')&&detail.includes('未实际执行'));
    assert(!detail.includes('undefined'));
  }
}
assert.equal(routeCount,224);assert(relationCount>=18);
for(const p of data.protocols){
  const s=p.specification;
  for(const key of ['formalName','status','scope','transport','objects','roles','version','compatibility','validation','access','sourceLocator'])assert(s[key]?.trim(),`${p.id}: ${key}`);
  assert(s.defines.length&&s.checklist.length&&p.sources.length);
  const detail=run(`protocolDetail(protocols.find(p=>p.id===${JSON.stringify(p.id)}))`);
  assert(detail.includes('有文档支持关系的软件')&&!detail.includes('undefined'));
}
assert.equal((nodes.get('content').innerHTML.match(/class="software-card"/g)||[]).length,12);
run('state.page=2;render()');assert(nodes.get('content').innerHTML.includes(data.software[12].name));
run(`state.page=${Math.ceil(data.software.length/12)};render()`);assert.equal((nodes.get('content').innerHTML.match(/class="software-card"/g)||[]).length,(data.software.length-1)%12+1);
run("reset();state.query='AutoCAD';render()");assert(run("filteredSoftware().some(x=>x.name==='AutoCAD')"));
const autocad=data.software.find(x=>x.name==='AutoCAD');assert.equal(autocad.interactions.length,5);assert(autocad.interactions.some(i=>i.name.includes('ObjectARX')));assert(autocad.interactions.some(i=>i.name.includes('DXF')));

run('reset()');
run("state.sector='biopharma';state.kind='通信协议';state.page=1;render()");assert(run('filteredSoftware().length')>=4);
run("reset();state.category='model';render()");assert(run('filteredSoftware().length')>=4);
run("reset();state.category='semantic';render()");assert(run('filteredSoftware().length')>=1);
assert(nodes.get('content').innerHTML.includes('PowerFactory'));
run("reset();state.category='field';render()");assert(run('filteredSoftware().length')>=1);
run("reset();state.view='protocols';state.category='field';render()");assert(run('filteredProtocols().length')>=7);
run("reset();state.view='software';state.standard='p13';render()");assert(run('filteredSoftware().length')>=3);
assert(!run("relatedSoftware('p19').some(x=>x.name.startsWith('LabWare'))"),'HL7 must not be inferred as FHIR');
assert(!run("relatedSoftware('p20').some(x=>x.name==='UNICORN / UNICORN OPC Server')"),'OPC UA must not be inferred as PackML');
run("reset();state.query='unfindable-query-73921';render()");assert(nodes.get('content').innerHTML.includes('没有匹配的条目'));
run("reset();state.view='protocols';state.query='HJ 212';render()");assert.equal(run('filteredProtocols().length'),1);
run("openProtocol('p50')");assert(nodes.get('reference-body').innerHTML.includes('2026-01-01'));
run('state.query="";exportCSV()');let csv=await exported.text();assert(csv.includes('HJ 212—2025')&&csv.includes('正式名称')&&csv.includes('2025-06-06'));
run("reset();state.view='software';state.page=1;exportCSV()");csv=await exported.text();assert(csv.includes('Aspen Plus')&&csv.includes('AERMOD'));
assert(csv.includes('数据契约')&&csv.includes('交互路径')&&csv.includes('官方示例'));
assert.equal(run(`csvCell('a,"b"')`),'"a,""b"""');
run("state.selected.add('sw001');state.selected.add('sw002');showCompare()");
assert(nodes.get('compare-body').innerHTML.includes('Aspen Plus')&&nodes.get('compare-body').innerHTML.includes('DWSIM'));
run("state.view='matrix';render()");assert(nodes.get('content').innerHTML.includes('模型互操作'));
run("state.view='method';render()");assert(nodes.get('content').innerHTML.includes(`全部官方来源（${data.sources.length} 项`));
run("openProtocol('p01')");assert(nodes.get('reference-body').innerHTML.includes('UNICORN'));
assert(!/<script[^>]+src=|<link[^>]+(?:stylesheet|href="http)/.test(html),'External runtime dependency');
assert(!html.includes('__ATLAS_'),'Unresolved template marker');
assert(!/本轮|上轮|首轮|目录扩充|仅看本轮新增|addedBatch|addedOnly|expansion-note|added-filter|data-new-software/.test(html),'Editorial update history leaked into deliverable');
const result={checkedDate:'2026-10-19',software:data.software.length,protocols:50,detailedInteractions:routeCount,documentedStandardRelations:relationCount,uniqueSources:data.sources.length,
  checks:['十个领域与六类分类','224 条交互字段与来源完整性','无更新批次、条目标记或新增筛选','AutoCAD 五类交互','原 63 款保留与名称/ID 去重','全部交互详情渲染','50 项标准详情与双向支持关系','首/中/末页分页','行业与技术形式交集筛选','分类与标准关系筛选','不从 HL7 或 UA 推断标准实现','无结果状态','协议关键词查询','完整字段 CSV 导出','CSV 引号转义','软件对比内容','矩阵与来源说明渲染','DOM 静态节点引用','单文件离线依赖'],
  scope:'Node 中验证页面逻辑与生成数据；不替代浏览器排版检查或工业软件接口测试'};
fs.writeFileSync(path.join(root,'research/validation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
