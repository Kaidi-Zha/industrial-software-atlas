import csv
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
sectors=[
 dict(id='materials',name='新材料与化工',short='新材料与化工',scope='材料结构与性质计算、化工流程设计，以及生产方案的物料、能量与多物理场分析。',flow=['材料建模','物性与相平衡','流程与设备分析','工艺评估'],featured=['p12','p14','p01','p50']),
 dict(id='biopharma',name='生物医药与高端医疗器械',short='生物医药与医疗器械',scope='涵盖分子模拟、化学信息处理、生物制药流程与制造执行、实验室数据，以及医疗影像和器械生物力学。',flow=['流程或器械开发','批记录与配方','生产执行','检验与数据归档'],featured=['p15','p17','p18','p11']),
 dict(id='food',name='现代食品与轻工制造',short='食品与轻工制造',scope='涵盖食品批加工与追溯、生产排程、包装印前与结构、服装版型等工作；各子领域的工程对象和数据格式不同。',flow=['配方或版型设计','生产准备','批次与作业执行','质量与追溯'],featured=['p20','p21','p22','p11']),
 dict(id='electronics',name='电子信息与集成电路',short='电子信息与集成电路',scope='涵盖集成电路、半导体工艺与器件、PCB、高频电磁分析和半导体制造执行。',flow=['电路与版图设计','器件及工艺分析','制造资料准备','制造执行'],featured=['p27','p23','p24','p25','p28']),
 dict(id='equipment',name='高端装备与智能制造',short='装备与智能制造',scope='涵盖二维与机械 CAD/CAM、数控加工、机器人仿真与离线编程、PLC 工程和工业数据接入。',flow=['零件与装配设计','加工编程','机器人与控制','设备数据采集'],featured=['p30','p09','p07','p01']),
 dict(id='aerospace',name='航空航天与轨道交通装备',short='航空航天与轨道装备',scope='涵盖航空几何与结构、显式动力学、多体及轨道车辆分析、系统建模、航天任务与测试。',flow=['几何与结构设计','性能及动力学分析','系统联合仿真','设备与测试数据交换'],featured=['p30','p13','p32','p33','p34']),
 dict(id='power',name='新能源与电力系统',short='新能源与电力系统',scope='涵盖电网与多能源规划、暂态及电力电子、配电与新能源项目分析，以及能源控制、监控和历史数据。',flow=['能源与电网建模','潮流及暂态分析','项目与接入评估','控制与运行监测'],featured=['p35','p36','p37','p38']),
 dict(id='civil',name='建筑与土木工程',short='建筑与土木工程',scope='涵盖建筑与结构 BIM、土木线路设计、结构动力与抗震、岩土有限元和建筑能耗分析。',flow=['地形与工程模型','建筑及结构设计','施工阶段与性能分析','模型交付与协同'],featured=['p39','p40','p41','p48']),
 dict(id='mining',name='矿业与油气资源开发',short='矿业与油气开发',scope='涵盖勘探与地球物理、地质和储层建模、井筒及生产系统、矿山设计和生产调度。',flow=['勘探与测井数据','地质及储层建模','开采设计','生产与模拟分析'],featured=['p42','p43','p44','p45','p46']),
 dict(id='environment',name='生态环保与水务工程',short='环保与水务工程',scope='涵盖空间数据分析、流域配水、供排水与管网韧性、污水处理、地下水和水动力，以及大气环境。',flow=['监测与模型输入','水与污染过程分析','设施与方案评估','运行数据交换'],featured=['p48','p49','p50','p01']),
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
electronics_names=['electronics-lceda','electronics-simulation','electronics-pcb','electronics-ansys']
electronics=[]
for name in electronics_names:
    electronics.extend(json.loads((ROOT/'research'/f'{name}-base.json').read_text()))
for i,item in enumerate(electronics,len(software)+1):
    item['id']=f'sw{i:03}'
software.extend(electronics)
structural_names=['structural-pkpm','structural-opensees','structural-mapdl']
structural=[]
for name in structural_names:
    structural.extend(json.loads((ROOT/'research'/f'{name}-base.json').read_text()))
for i,item in enumerate(structural,len(software)+1):
    item['id']=f'sw{i:03}'
software.extend(structural)
lifecycle_names=['lifecycle-process','lifecycle-design','lifecycle-civil-resources','lifecycle-power-environment']
lifecycle=[]
for name in lifecycle_names:
    lifecycle.extend(json.loads((ROOT/'research'/f'{name}-base.json').read_text()))
for i,item in enumerate(lifecycle,len(software)+1):
    item['id']=f'sw{i:03}'
software.extend(lifecycle)
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
for name in [*expansion_names,*electronics_names,*structural_names,*lifecycle_names]:
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
electronics_context=json.loads((ROOT/'research/electronics-context.json').read_text())
structural_context=json.loads((ROOT/'research/structural-context.json').read_text())
software_by_name={x['name']:x for x in software}
for name,context in electronics_context['products'].items():
    assert name in software_by_name,name
    item=software_by_name[name]
    item['productContext']=context
    item['sources']=list({s['url']:s for s in [*item['sources'],*context['sources']]}.values())
for group in [*electronics_context['areas'],*electronics_context['access'],*electronics_context['relationships']]:
    assert group['softwareNames']
    assert all(name in software_by_name for name in group['softwareNames']),group['name']
for name,context in structural_context['products'].items():
    assert name in software_by_name,name
    item=software_by_name[name]
    item['productContext']=context
    if item['sector']!='civil':
        item['additionalSectors']=list(dict.fromkeys([*item.get('additionalSectors',[]),'civil']))
    if name in structural_context['descriptions']:
        item['purpose']=structural_context['descriptions'][name]
    item['sources']=list({s['url']:s for s in [*item['sources'],*context['sources']]}.values())
assert all(name in software_by_name for name in structural_context['softwareNames'])
# 阅读索引为编辑分类，链接到已有逐软件证据；不推断互连或替代关系。
workflow_specs={
 'materials':[
  ('原子、电子与分子计算',['VASP','Quantum ESPRESSO','CP2K','LAMMPS']),
  ('物性、相平衡与反应动力学',['Thermo-Calc','Cantera','BIOVIA Materials Studio']),
  ('流程、分离与自定义单元',['Aspen Plus','Aspen HYSYS','ChemSep','Aspen Custom Modeler']),
  ('多物理场与生产控制',['COMSOL Multiphysics','SIMATIC PCS 7']),
 ],
 'biopharma':[
  ('分子模拟与化学信息处理',['GROMACS','OpenMM','RDKit','Schrödinger Suite']),
  ('影像与器械生物力学',['3D Slicer','FEBio','Materialise Mimics']),
  ('工艺、批次与制造执行',['SuperPro Designer','PAS-X MES','Opcenter Execution Pharma']),
  ('实验室、数据与检验',['LabKey Server','LabWare','Waters Empower','Benchling']),
 ],
 'food':[
  ('食品批次与车间执行',['Opcenter Execution Process','Sepasoft','SAP Digital Manufacturing']),
  ('排程与生产监控',['Opcenter APS','AVEVA Manufacturing Execution System','FactoryTalk View SE']),
  ('服装版型与裁剪准备',['Valentina','Seamly2D','Lectra Modaris','Gerber AccuMark']),
  ('包装结构与印前流程',['Packmage','Esko ArtiosCAD','Esko Automation Engine']),
 ],
 'electronics':[
  ('IC、版图与数字实现',['Virtuoso','KLayout','OpenROAD','Innovus']),
  ('PCB 与制造资料',['嘉立创EDA','KiCad','Allegro X','Cadence OrCAD']),
  ('电路级仿真',['ngspice','LTspice','PSpice','Ansys Circuit']),
  ('电磁、信号电源完整性与热',['Ansys HFSS','openEMS','Ansys siwave','Ansys Icepak']),
 ],
 'equipment':[
  ('二维制图与机械 CAD',['FreeCAD','LibreCAD','GstarCAD','ZWCAD','Solid Edge','Onshape']),
  ('数控加工与制造准备',['NX','Mastercam','Autodesk Fusion']),
  ('机器人仿真与离线编程',['RoboDK','CoppeliaSim','RobotStudio']),
  ('控制工程与设备数据接入',['TIA Portal','CODESYS','KEPServerEX','Ignition']),
 ],
 'aerospace':[
  ('几何、结构与显式动力学',['CATIA V5','Abaqus','LS-DYNA','MSC Nastran']),
  ('多体与车辆动力学',['Simpack','Adams','Simcenter Amesim']),
  ('系统建模与联合仿真',['Dymola','OpenModelica','MATLAB / Simulink']),
  ('轨道任务与测试',['GMAT','STK','LabVIEW']),
 ],
 'power':[
  ('潮流与能源规划',['MATPOWER','PyPSA','PowerFactory','pandapower']),
  ('暂态与电力电子',['PSCAD','EMTP','PLECS','PSIM']),
  ('配电、负荷与新能源项目',['GridLAB-D','OpenDSS','SAM','PVsyst']),
  ('能源控制、监控与历史数据',['OpenEMS（能源管理系统）','EcoStruxure Power Operation','AVEVA PI System']),
 ],
 'civil':[
  ('CAD、BIM 与模型协调',['AutoCAD','Revit','Bonsai','Navisworks']),
  ('建筑结构与抗震设计',['PKPM','盈建科','OpenSees','ETABS']),
  ('通用有限元与研究计算',['Code_Aster','CalculiX','Ansys Mechanical APDL','COMSOL Multiphysics']),
  ('桥梁、岩土与专业结构',['SOFiSTiK','Dlubal','MIDAS CIVIL','PLAXIS']),
 ],
 'mining':[
  ('勘探、地质与地球物理',['Leapfrog Geo','Oasis montaj','Petrel','Surpac']),
  ('储层计算与结果分析',['ECLIPSE','MRST','ResInsight','OPM Flow']),
  ('井筒、管网与生产系统',['PIPESIM','OLGA','Petroleum Experts']),
  ('矿山设计、岩体与生产调度',['Deswik','FLAC3D','DISPATCH']),
 ],
 'environment':[
  ('空间数据与分析准备',['QGIS','ArcGIS Pro']),
  ('供水、排水与韧性',['EPANET','WNTR','SWMM','InfoWorks ICM']),
  ('流域、水动力与地下水',['WEAP','TELEMAC-MASCARET','HEC-RAS','MODFLOW 6']),
  ('污水处理与大气环境',['GPS-X','BioWin','CMAQ','AERMOD']),
 ],
}
for sector in sectors:
    groups=[]
    for title,prefixes in workflow_specs[sector['id']]:
        names=[]
        for prefix in prefixes:
            matches=[x for x in software if prefix.casefold() in x['name'].casefold() and (x['sector']==sector['id'] or sector['id'] in x.get('additionalSectors',[]))]
            assert len(matches)==1,(sector['id'],prefix,[x['name'] for x in matches])
            item=matches[0]
            assert item['sector']==sector['id'] or sector['id'] in item.get('additionalSectors',[]),(sector['id'],item['name'])
            names.append(item['name'])
        groups.append(dict(name=title,softwareNames=names))
    sector['workflows']=groups
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
theory_records=[]
for group in ['process','design','power-civil','resources']:
    theory_records.extend(json.loads((ROOT/'research'/f'theory-{group}.json').read_text()))
theory_by_id={t['softwareId']:t for t in theory_records}
assert len(theory_records)==len(theory_by_id)==len(software),'Theory audit must cover every software exactly once'
# Keep the earlier survey as evidence history; explicit rechecks replace its interpretation.
rechecks=[]
for group in ['process','eda','cad','resources']:
    rechecks.extend(json.loads((ROOT/'research'/f'recheck-{group}-docs.json').read_text()))
recheck_by_id={r['softwareId']:r for r in rechecks}
assert len(rechecks)==len(recheck_by_id)==41
assert set(recheck_by_id)=={t['softwareId'] for t in theory_records if t['status']=='not-located'}
remaining_rechecks=[]
for group in ['gproms','optitex','slb']:
    records=json.loads((ROOT/'research'/f'recheck-final-{group}.json').read_text())
    remaining_rechecks.extend(records if isinstance(records,list) else [records])
assert len(remaining_rechecks)==4
assert {r['softwareId'] for r in remaining_rechecks}=={'sw067','sw084','sw129','sw130'}
recheck_by_id.update({r['softwareId']:r for r in remaining_rechecks})
rechecks=list(recheck_by_id.values())
assert len(rechecks)==44
for sid,r in recheck_by_id.items():
    assert r['name']==theory_by_id[sid]['name'] and r['reason']
    f=r['functionDocumentation']
    assert f['status'] in {'confirmed','not-confirmed'} and f['summary'] and f['retrieval']
    assert f['status']!='confirmed' or f['documents']
    for d in f['documents']:
        assert all(d.get(k) for k in ['title','url','version','access','evidence'])
    for attempt in f['retrieval']:
        assert all(attempt.get(k) for k in ['method','url','result'])
    if r['theoryPatch']:
        assert r['theoryPatch']['softwareId']==sid and r['theoryPatch']['name']==r['name']
        theory_by_id[sid]=r['theoryPatch']
theory_records=list(theory_by_id.values())
theory_kinds=['物理与机理','数学模型','数值算法','几何与数据模型','业务与控制模型']
theory_statuses={'documented':'有理论或模型正文','limited':'局部机理或模型说明','access-limited':'机理正文访问受限','not-located':'机理正文待核实'}
for item in software:
    t=theory_by_id[item['id']]
    assert t['name']==item['name'],(item['id'],t['name'],item['name'])
    assert t['status'] in theory_statuses and t['summary'] and t['documents'] and t['searchNote']
    assert t['checkedDate']=='2026-10-21'
    assert t['status'] not in {'documented','limited'} or t['topics'],item['name']
    doc_urls={d['url'] for d in t['documents']}
    for d in t['documents']:
        assert all(d.get(k) for k in ['title','url','version','access','evidence']),item['name']
        assert urlparse(d['url']).scheme in {'http','https'}
    for topic in t['topics']:
        assert topic['kind'] in theory_kinds and all(topic.get(k) for k in ['title','explanation','assumptions','locator','sourceUrls']),item['name']
        assert set(topic['sourceUrls'])<=doc_urls,item['name']
    item['theory']={k:v for k,v in t.items() if k not in {'softwareId','name'}}
    if item['id'] in recheck_by_id:
        item['theory']['functionDocumentation']=recheck_by_id[item['id']]['functionDocumentation']
        item['theory']['functionDocumentation']['checkedDate']='2026-10-21'
    item['sources']=list({s['url']:s for s in [*item['sources'],*[{'title':d['title'],'url':d['url']} for d in t['documents']]]}.values())
    if item['id'] in recheck_by_id:
        item['sources']=list({s['url']:s for s in [*item['sources'],*[{'title':d['title'],'url':d['url']} for d in item['theory']['functionDocumentation']['documents']]]}.values())
theory_summary=dict(checkedDate='2026-10-21',reviewed=len(theory_records),
    statuses={key:sum(t['status']==key for t in theory_records) for key in theory_statuses},
    topics=sum(len(t['topics']) for t in theory_records),
    documents=len({d['url'] for t in theory_records for d in t['documents']}),
    functionDocumentationReviewed=len(rechecks),
    functionDocumentationConfirmed=sum(r['functionDocumentation']['status']=='confirmed' for r in rechecks))
# Product discovery and interface/model audits are different evidence levels.
# Keep the audited records and IDs intact; product pages do not become API contracts.
industry_sectors=json.loads((ROOT/'research/industry-sectors.json').read_text())
for sector in industry_sectors:
    assert sector['id'] not in sector_order
    sector.update(featured=[],workflows=[])
    sectors.append(sector)
    sector_order[sector['id']]=len(sector_order)
theory_statuses['not-reviewed']='机理尚未专项核查'
with (ROOT/'research/industry-catalog.tsv').open(newline='') as stream:
    catalog=list(csv.DictReader(stream,delimiter='\t'))
for i,entry in enumerate(catalog,len(software)+1):
    assert all(entry.values()) and len(entry)==9,entry
    assert entry['sector'] in sector_order and urlparse(entry['url']).scheme=='https'
    source=dict(title=f"{entry['name']}：官方产品或文档入口",url=entry['url'])
    software.append(dict(
        id=f'sw{i:03}',name=entry['name'],vendor=entry['vendor'],sector=entry['sector'],
        stage=entry['stage'],purpose=entry['purpose'],capabilities=entry['capabilities'].split('；'),
        keywords=entry['keywords'].split(),interfaces=[],interactions=[],sources=[source],
        evidence='官方用途与功能检索',sourceDate='2026-10-24',coverageDepth='function',
        constraints=entry['boundary'],
        profile=dict(humanEntry='从官方产品或文档入口查阅，安装和操作方式以所用版本为准。',
            coverage=entry['purpose'],versionBoundary=entry['boundary'],
            unknowns=['尚未逐项核查 API、CLI、文件交换及通信接口的数据契约。','尚未开展机理手册专项核查或安装运行验证。']),
        theory=dict(status='not-reviewed',summary='已核实产品用途；尚未开展机理与模型专项核查。',topics=[],documents=[],checkedDate='',
            searchNote='产品页面与文档入口用于确认名称、用途和功能范围，不能据此推断内部算法。')))
assert len({x['name'].casefold() for x in software})==len(software),'Duplicate catalog name'
by_name={x['name']:x for x in software}
relations=json.loads((ROOT/'research/industry-links.json').read_text())
for name,related in relations['crossSectors'].items():
    assert name in by_name,name
    item=by_name[name]
    assert all(s in sector_order and s!=item['sector'] for s in related),name
    item['additionalSectors']=list(dict.fromkeys([*item.get('additionalSectors',[]),*related]))
for name,keywords in relations['keywords'].items():
    assert name in by_name,name
    by_name[name]['keywords']=list(dict.fromkeys([*by_name[name].get('keywords',[]),*keywords]))
for item in software:
    item.setdefault('coverageDepth','interface')
reviews=json.loads((ROOT/'research/industry-reviews.json').read_text())
review_by_id={r['softwareId']:r for r in reviews}
assert len(review_by_id)==len(reviews)==len(catalog),'Incomplete or duplicate industry reviews'
assert set(review_by_id)=={f'sw{i:03}' for i in range(212,212+len(catalog))}
for item in software:
    if item['id'] not in review_by_id:
        continue
    review=review_by_id[item['id']]
    assert review['name']==item['name'],item['id']
    for key in ['profile','constraints','interfaces','interactions','theory']:
        item[key]=review[key]
    item['sourceDate']=review['checkedDate']
    item['coverageDepth']='interface'
    item['evidence']='官方接口与模型资料核查；未运行软件'
    item['sources']=list({s['url']:s for s in [*item['sources'],*review['sources']]}.values())
    source_urls={s['url'] for s in item['sources']}
    assert item['interactions'] and item['theory']['topics'] and item['theory']['documents']
    assert {i['name'] for i in item['interfaces']}=={i['name'] for i in item['interactions']}
    for route in item['interactions']:
        assert route['category'] in {c['id'] for c in categories}
        assert all(route.get(k) for k in ['entry','role','direction','operations','dataContract','protocolNotes','version','workflow','execution','failure','prerequisites','evidence','example'])
        assert set(route['evidence']['sourceUrls'])<=source_urls
        assert route['example']['sourceUrl'] in source_urls
        assert set(route['standardIds'])<={p['id'] for p in protocols}
    for topic in item['theory']['topics']:
        assert topic['kind'] in theory_kinds,item['name']
        assert set(topic['sourceUrls'])<={d['url'] for d in item['theory']['documents']}
for group in electronics_context['areas']:
    if group['id']=='circuit':
        group['softwareNames'].extend(['NanoSpice','Empyrean ALPS'])
electronics_context['areas'].append(dict(id='packaging',name='封装工艺仿真',softwareNames=['Moldex3D']))
for group in electronics_context['access']:
    if group['id']=='domestic':
        group['name']='国产设计与仿真'
        group['softwareNames'].extend(['NanoSpice','Empyrean ALPS'])
theory_summary=dict(checkedDate=max(x['theory']['checkedDate'] for x in software),
    reviewed=sum(x['theory']['status']!='not-reviewed' for x in software),
    statuses={key:sum(x['theory']['status']==key for x in software) for key in theory_statuses},
    topics=sum(len(x['theory']['topics']) for x in software),
    documents=len({d['url'] for x in software for d in x['theory']['documents']}),
    functionDocumentationReviewed=sum('functionDocumentation' in x['theory'] for x in software),
    functionDocumentationConfirmed=sum(x['theory'].get('functionDocumentation',{}).get('status')=='confirmed' for x in software))
catalog_summary=dict(checkedDate='2026-10-24',functionOnly=sum(not x['interactions'] for x in software),interfaceAudited=sum(bool(x['interactions']) for x in software),
    scope='工业生产、工程设计与相关运营；含研究求解器和专业库，不包含全部行业、地区及历史产品。')
sources={}
for item in [*software,*protocols,*electronics_context['relationships']]:
    for source in item['sources']:
        record=sources.setdefault(source['url'],dict(**source,items=[]))
        if item['name'] not in record['items']:record['items'].append(item['name'])
data=dict(checkedDate='2026-10-24',interfaceCheckedDate=max(x['sourceDate'] for x in software),catalogSummary=catalog_summary,theorySummary=theory_summary,theoryKinds=theory_kinds,theoryStatuses=theory_statuses,electronicsContext=electronics_context,structuralContext=structural_context,categories=categories,sectors=sectors,software=software,protocols=protocols,sources=list(sources.values()))
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
summary=dict(software=len(software),sectorCount=len(sectors),catalog=catalog_summary,protocols=len(protocols),uniqueSources=len(sources),theory=theory_summary,
    interfaces=sum(len(x['interfaces']) for x in software),sectors=dict(Counter(x['sector'] for x in software)),
    detailedInteractions=sum(len(x['interactions']) for x in software),
    documentedStandardRelations=sum(len(i['standardIds']) for x in software for i in x['interactions']),
    categories={c['id']:sum(any(i['category']==c['id'] for i in x['interactions']) for x in software) for c in categories},
    sectorCoverage={s['id']:sum(x['sector']==s['id'] or s['id'] in x.get('additionalSectors',[]) for x in software) for s in sectors},
    htmlBytes=len(output.encode()),unexecuted='所有软件接口均未安装或运行测试')
(ROOT/'research/build-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(summary,ensure_ascii=False,indent=2))
