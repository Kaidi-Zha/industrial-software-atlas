import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
sectors=[
 dict(id='materials',name='新材料与化工',short='新材料与化工',scope='材料结构与性质计算、化工流程设计，以及生产方案的物料、能量与多物理场分析。',flow=['材料建模','物性与相平衡','流程与设备分析','工艺评估'],featured=['p12','p14','p01','p50']),
 dict(id='biopharma',name='生物医药与高端医疗器械',short='生物医药与医疗器械',scope='覆盖生物制药流程开发、制造执行、层析控制、实验室质控，以及医疗器械的上游影像建模。',flow=['流程或器械开发','批记录与配方','生产执行','检验与数据归档'],featured=['p15','p17','p18','p11']),
 dict(id='food',name='现代食品与轻工制造',short='食品与轻工制造',scope='涵盖食品批加工与追溯、包装印刷、服装版型等子领域；各子领域使用的工程对象与数据格式不同。',flow=['配方或版型设计','生产准备','批次与作业执行','质量与追溯'],featured=['p20','p21','p22','p11']),
 dict(id='electronics',name='电子信息与集成电路',short='电子信息与集成电路',scope='涵盖集成电路、半导体工艺与器件、PCB、高频电磁分析和半导体制造执行。',flow=['电路与版图设计','器件及工艺分析','制造资料准备','制造执行'],featured=['p27','p23','p24','p25','p28']),
 dict(id='equipment',name='高端装备与智能制造',short='装备与智能制造',scope='涵盖机械 CAD/CAM、数控加工、机器人工作站、PLC 与工业监控应用。',flow=['零件与装配设计','加工编程','机器人与控制','设备数据采集'],featured=['p30','p09','p07','p01']),
 dict(id='aerospace',name='航空航天与轨道交通装备',short='航空航天与轨道装备',scope='涵盖航空几何设计、结构与多体动力学、航天任务分析，以及轨道车辆系统仿真。',flow=['几何与结构设计','性能及动力学分析','系统联合仿真','设备与测试数据交换'],featured=['p30','p13','p32','p33','p34']),
 dict(id='power',name='新能源与电力系统',short='新能源与电力系统',scope='涵盖电网规划、电磁暂态、配电与新能源接入分析，以及能源项目性能和经济性评估。',flow=['能源与电网建模','潮流及暂态分析','接入与运行研究','项目评估'],featured=['p35','p36','p37','p38']),
 dict(id='civil',name='建筑与土木工程',short='建筑与土木工程',scope='涵盖建筑与结构 BIM、土木线路设计、岩土有限元和建筑能耗分析。',flow=['地形与工程模型','建筑及结构设计','施工阶段与性能分析','模型交付与协同'],featured=['p39','p40','p41','p48']),
 dict(id='mining',name='矿业与油气资源开发',short='矿业与油气开发',scope='涵盖地质与储层建模、测井分析、矿山设计及油气藏数值模拟。',flow=['勘探与测井数据','地质及储层建模','开采设计','生产与模拟分析'],featured=['p42','p43','p44','p45','p46']),
 dict(id='environment',name='生态环保与水务工程',short='环保与水务工程',scope='涵盖供水管网、雨洪排水、污水处理、地下水、海岸水环境及大气污染扩散模型。',flow=['监测与模型输入','水与污染过程分析','设施与方案评估','运行数据交换'],featured=['p48','p49','p50','p01']),
]
names=['materials-biopharma-food.json','electronics-equipment-aero.json','power-civil.json','mining-environment.json']
software=[]
for name in names:
    software.extend(json.loads((ROOT/'research'/name).read_text()))
sector_order={s['id']:i for i,s in enumerate(sectors)}
software.sort(key=lambda item:sector_order[item['sector']])
for i,item in enumerate(software,1):
    item['id']=f'sw{i:03}'
baseline_count=len(software)
expansion_names=['expansion-process','expansion-design','expansion-energy','expansion-civil-water']
expansion=[]
for name in expansion_names:
    expansion.extend(json.loads((ROOT/'research'/f'{name}-base.json').read_text()))
expansion.sort(key=lambda item:sector_order[item['sector']])
for i,item in enumerate(expansion,baseline_count+1):
    item['id']=f'sw{i:03}'
software.extend(expansion)
software.sort(key=lambda item:sector_order[item['sector']])
assert len({x['name'].casefold() for x in software})==len(software),'Duplicate software name'
protocols=json.loads((ROOT/'research/protocols.json').read_text())
categories=[
 dict(id='program',name='程序调用与扩展',short='程序调用',description='SDK、对象 API、脚本与命令行；需要区分宿主插件、应用内脚本和独立调用。'),
 dict(id='file',name='文件与工程数据交换',short='文件交换',description='通过文件交付模型、版图、配方和结果；核对导入/导出方向、版本、单位与保留内容。'),
 dict(id='runtime',name='运行数据与消息交换',short='运行与消息',description='系统间数据、事件与业务消息；核对连接角色、会话、数据质量及业务确认。'),
 dict(id='field',name='现场设备通信与控制',short='现场通信',description='控制器、仪表与现场设备的通信；核对设备角色、点表、周期、同步及允许的控制。'),
 dict(id='model',name='模型与组件互操作',short='模型互操作',description='计算组件集成、模型交换与联合仿真；核对组件角色、求解责任、变量和时间推进。'),
 dict(id='semantic',name='领域语义与业务模型',short='语义与业务',description='统一对象、属性、事件和业务状态；信息模型通常还需要文件、服务或通信映射。'),
]
enriched=[]
for name in ['enriched-materials.json','enriched-electronics.json','enriched-power-resources.json']:
    enriched.extend(json.loads((ROOT/'research'/name).read_text()))
for name in expansion_names:
    enriched.extend(json.loads((ROOT/'research'/f'{name}-details.json').read_text()))
by_name={x['name']:x for x in enriched}
assert len(by_name)==len(software)==len(enriched)
for item in software:
    e=by_name[item['name']]
    item['profile']=e['profile']
    for key in ['coverage','versionBoundary']:
        item['profile'][key]=item['profile'][key].replace('。；','；')
    item['interactions']=e['interactions']
    assert {i['name'] for i in item['interfaces']}=={i['name'] for i in item['interactions']},item['name']
    source_map={s['url']:s for s in [*item['sources'],*e['sources']]}
    item['sources']=list(source_map.values())
    for i,route in enumerate(item['interactions'],1):
        route['id']=f'route-{i}'
        assert route['category'] in {c['id'] for c in categories}
        assert all(pid in {p['id'] for p in protocols} for pid in route['standardIds'])
        assert route['evidence']['sourceUrls']
        for url in route['evidence']['sourceUrls']:
            assert url in source_map,(item['name'],url)
standard_details=json.loads((ROOT/'research/enriched-protocols.json').read_text())
assert len(standard_details)==len(protocols)==50
details_by_id={p['id']:p for p in standard_details}
for p in protocols:
    detail=details_by_id[p['id']]
    p['specification']={k:v for k,v in detail.items() if k not in {'id','sources','sourceDate'}}
    p['categories']=detail['categories']
    p['sources']=list({s['url']:s for s in [*p['sources'],*detail['sources']]}.values())
valid_kinds={'API/SDK','脚本/CLI','文件格式','通信协议','信息模型'}
for i,item in enumerate(software,1):
    assert item['id']
    assert all(s in sector_order and s!=item['sector'] for s in item.get('additionalSectors',[]))
    if item['stage']=='工艺仿真':item['stage']='仿真分析'
    # 全页统一报告未运行，不在每条限制重复相同声明。
    item['constraints']=re.sub(r'[；，]?未(?:安装、未)?(?:实际运行|安装实测|实测)[。；]?$','。',item['constraints'])
    item['constraints']=item['constraints'].replace('。。','。')
    if item['name']=='UNICORN / UNICORN OPC Server':
        item['constraints']='能力依据 UNICORN OPC Server 1.2.1 用户手册；需安装对应服务器组件，实际兼容性按 UNICORN Compatibility Matrix 核对，并配置客户端访问权限。'
    for interface in item['interfaces']:assert interface['type'] in valid_kinds,interface
    assert item['sources'] and item['sector'] in {s['id'] for s in sectors}
    for source in item['sources']:assert urlparse(source['url']).scheme in {'http','https'}
for p in protocols:
    assert p['type'] in valid_kinds
    assert p['sources'] and p['sectors']
    if p['id']=='p36':
        p['sources']=[{'title':'IEC：60870-5-104:2006+AMD1:2016 摘要','url':'https://webstore.iec.ch/en/publication/25035'}]
sources={}
for item in [*software,*protocols]:
    for source in item['sources']:
        record=sources.setdefault(source['url'],dict(**source,items=[]))
        if item['name'] not in record['items']:record['items'].append(item['name'])
data=dict(checkedDate='2026-10-19',categories=categories,sectors=sectors,software=software,protocols=protocols,sources=list(sources.values()))
payload=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\/')
template=(ROOT/'layout.html').read_text()
template=template.replace('__ATLAS_STYLES__',(ROOT/'atlas.css').read_text())
template=template.replace('__ATLAS_RUNTIME__',(ROOT/'atlas.js').read_text())
assert template.count('__ATLAS_DATA__')==1
output=template.replace('__ATLAS_DATA__',payload)
(ROOT/'industrial-software-atlas.html').write_text(output)
(ROOT/'research/atlas-data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
scripts=re.findall(r'<script>([\s\S]*?)</script>',output)
assert len(scripts)==1
(ROOT/'research/page-runtime.js').write_text(scripts[0])
summary=dict(software=len(software),protocols=len(protocols),uniqueSources=len(sources),
    baselineSoftware=baseline_count,addedSoftware=len(expansion),
    interfaces=sum(len(x['interfaces']) for x in software),sectors=dict(Counter(x['sector'] for x in software)),
    detailedInteractions=sum(len(x['interactions']) for x in software),
    documentedStandardRelations=sum(len(i['standardIds']) for x in software for i in x['interactions']),
    categories={c['id']:sum(any(i['category']==c['id'] for i in x['interactions']) for x in software) for c in categories},
    sectorCoverage={s['id']:sum(x['sector']==s['id'] or s['id'] in x.get('additionalSectors',[]) for x in software) for s in sectors},
    htmlBytes=len(output.encode()),unexecuted='所有软件接口均未安装或运行测试')
(ROOT/'research/build-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(summary,ensure_ascii=False,indent=2))
