# Exemplo validado em 15/09/2026 na doc da Hotmart (30 endpoints). Entrada: extracao.json
# (pagina, metodo, caminho, http) + um .md por página (firecrawl scrape). Regex são do formato
# dessa doc; adapte para outro site. Ver references/docs-only-extraction.md.
import json,re
TIPOS={'string':'string','integer':'integer','long':'integer','int':'integer','boolean':'boolean','bool':'boolean','number':'number','double':'number','float':'number','array':'array','object':'object','date':'string'}
ex=json.load(open('extracao.json'))
def schema_de(v):
    if isinstance(v,bool): return {'type':'boolean'}
    if isinstance(v,int): return {'type':'integer'}
    if isinstance(v,float): return {'type':'number'}
    if isinstance(v,str): return {'type':'string'}
    if isinstance(v,list): return {'type':'array','items':schema_de(v[0]) if v else {}}
    if isinstance(v,dict): return {'type':'object','properties':{k:schema_de(x) for k,x in v.items()}}
    return {}
paths={}; relat=[]
def carregar(txt):
    txt=txt.replace('\\\n','\n').replace('\\','')
    try: return json.loads(txt)
    except Exception:
        txt=re.sub(r'("|\d|true|false|null|\]|\})(\s*\n\s*")',r'\1,\2',txt)
        txt=re.sub(r':\s*0+(\d)',r': \1',txt)
        txt=re.sub(r',(\s*[\]}])',r'\1',txt)
        return json.loads(txt)
for e in ex:
    f=e['pagina'].replace('v1/','',1).replace('/','__')+'.md'
    t=open(f).read().replace('\\_','_')
    t=re.sub(r'\[([^\]]*) permalink\]\([^)]*\)\s*','',t)
    m=re.search(r'Request parameters(.*?)^(?:GET|POST|PUT|PATCH|DELETE)\s*/',t,re.S|re.M|re.I)
    bloco=m.group(1) if m else ''
    secao='query'; params=[]; body={}; req_body=[]
    for linha_i,bl in enumerate(re.split(r'\n',bloco)):
        s=bl.strip()
        h=re.match(r'^(?:#+\s*|-\s*)(Query|Path|Body|Header)s?\s*$',s,re.I)
        if h: secao=h.group(1).lower(); continue
    # parâmetros: "- nome\n tipo[Required]\n descrição"
    secao='query'
    linhas=bloco.split('\n'); i=0
    while i<len(linhas):
        s=linhas[i].strip()
        h=re.match(r'^(?:#+\s*|-\s*)(Query|Path|Body|Header)s?\s*$',s,re.I)
        if h: secao=h.group(1).lower(); i+=1; continue
        pm=re.match(r'^- ([A-Za-z][A-Za-z0-9_.\[\]]*)$',s)
        if pm and i+1<len(linhas):
            tm=re.match(r'^\s*([a-z]+)(?:\s+containing\s+\w+)?\s*(Required)?\s*$',linhas[i+1].strip())
            if tm and tm.group(1).lower() in TIPOS:
                desc=linhas[i+2].strip() if i+2<len(linhas) else ''
                enum=re.findall(r'`([A-Z_]+)`',linhas[i+3]) if i+3<len(linhas) else []
                sc={'type':TIPOS[tm.group(1).lower()]}
                if tm.group(1).lower()=='long': sc['format']='int64'
                if enum and sc['type']=='string': sc['enum']=enum
                if sc['type']=='array': sc['items']={}
                nome=pm.group(1); obrig=bool(tm.group(2))
                if secao=='body':
                    body[nome]=dict(sc,description=desc)
                    if obrig: req_body.append(nome)
                elif secao!='header':
                    params.append({'name':nome,'in':secao,'required':obrig or secao=='path','description':desc,'schema':sc,'_obrig_doc':obrig})
                i+=3; continue
        i+=1
    caminho=re.sub(r':([a-z_]+)',r'{\1}',e['caminho'])
    for p in params: p['x-obrig']=p.pop('_obrig_doc',None)
    no_url=set(re.findall(r'\{([a-z_]+)\}',caminho))
    orfaos=[x for x in params if x['in']=='path' and x['name'] not in no_url]
    sem_doc=[n for n in re.findall(r'\{([a-z_]+)\}',caminho) if n not in [x['name'] for x in params if x['in']=='path']]
    if len(orfaos)==1 and len(sem_doc)==1:
        orfaos[0]['x-origem']=f"doc chama de '{orfaos[0]['name']}', endereço usa '{sem_doc[0]}': renomeado"
        orfaos[0]['name']=sem_doc[0]; orfaos=[]
    for p in orfaos:
        params.remove(p); body[p['name']]=dict(p['schema'],description=p['description'],**{'x-origem':'doc marca como Path mas não está no endereço: movido para o corpo'})
        if p.get('x-obrig'): req_body.append(p['name'])
    for p in params: p.pop('x-obrig',None)
    faltando=[p for p in re.findall(r'\{([a-z_]+)\}',caminho) if p not in [x['name'] for x in params if x['in']=='path']]
    for p in faltando:
        params.append({'name':p,'in':'path','required':True,'schema':{'type':'string'},'description':'','x-origem':'inferido do endereço'})
    jm=re.search(r'Response\s*\n\s*2\d\d[^\n]*\n\s*```json\n(.*?)```',t,re.S)
    resp={'description':'Sucesso'}; origem_resp='sem exemplo'
    if jm:
        try:
            resp['content']={'application/json':{'schema':schema_de(carregar(jm.group(1)))}}
            origem_resp='montado do exemplo JSON da página'
        except Exception as err: origem_resp=f'exemplo JSON inválido ({err.__class__.__name__})'
    titulo=re.search(r'^## (.+)$',t,re.M)
    op={'operationId':e['pagina'].split('/')[-1].replace('-','_'),'summary':(titulo.group(1).strip() if titulo else e['pagina']),
        'parameters':params,'responses':{'200':resp,'401':{'description':'Token ausente ou expirado'}},
        'x-origem':{'pagina':'https://developers.hotmart.com/docs/en/'+e['pagina'],'endereco':f"provado: HTTP {e['http']} sem token (rota inventada dá 404)",'parametros':'lidos da página','resposta':origem_resp}}
    if body:
        op['requestBody']={'required':bool(req_body),'content':{'application/json':{'schema':{'type':'object','properties':body,'required':req_body or None}}}}
        if not req_body: del op['requestBody']['content']['application/json']['schema']['required']
    paths.setdefault(caminho,{})[e['metodo'].lower()]=op
    relat.append((e['metodo'],caminho,len([p for p in params if p['in']!='path']),len([p for p in params if p['in']=='path']),len(body),origem_resp))
spec={'openapi':'3.1.0','info':{'title':'Hotmart API (extraída da documentação)','version':'2026-09-15','description':'Gerada da documentação pública em 2026-09-15. Cada operação tem x-origem dizendo o que foi provado e o que foi deduzido.'},
 'servers':[{'url':'https://developers.hotmart.com'}],
 'components':{'securitySchemes':{'bearer':{'type':'http','scheme':'bearer','description':'access_token obtido em POST https://api-sec-vlc.hotmart.com/security/oauth/token?grant_type=client_credentials&client_id=...&client_secret=... com Authorization: Basic <basic>. Expira; ao receber 401, gerar outro.'}}},
 'security':[{'bearer':[]}],'paths':paths}
json.dump(spec,open('hotmart-openapi-extraida.json','w'),ensure_ascii=False,indent=2)
for r in relat: print(*r,sep=' | ')
