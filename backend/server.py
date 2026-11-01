"""ANIME VOID Studio API. Python 3.11+, standard library. Real payments OFF by default.
Use behind an HTTPS reverse proxy with persistent SQLite storage. Never expose secrets to GitHub Pages.
"""
import os,json,sqlite3,secrets,hashlib,hmac,time,uuid,re,threading,base64,urllib.request,urllib.error,ipaddress
from pathlib import Path
from contextlib import contextmanager
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler

ROOT=Path(__file__).resolve().parent
CAT=json.loads((ROOT.parent/'profile-catalog.json').read_text())
ITEMS={x['id']:x for x in CAT['items']};DEFAULTS=CAT['defaults']
DB_PATH=os.getenv('DB_PATH',str(ROOT/'data/studio.sqlite3'))
APP_ENV=os.getenv('APP_ENV','production');ORIGINS=set(x.strip()for x in os.getenv('ALLOWED_ORIGINS','https://anime-void-app.github.io').split(','))
LOCK=threading.RLock();KDF_LIMIT=threading.BoundedSemaphore(2);ID=re.compile(r'^(?:anilist-)?([1-9]\d{0,9})$');UID=re.compile(r'^[0-9a-f-]{36}$')
SHOP=os.getenv('YOOKASSA_SHOP_ID','');KEY=os.getenv('YOOKASSA_SECRET_KEY','');MODE=os.getenv('PAYMENT_MODE','test')
PUBLIC_URL=os.getenv('PUBLIC_PROFILE_URL','https://anime-void-app.github.io/AV/profile.html')
PROVIDER='https://api.yookassa.ru/v3'
if APP_ENV=='test':PROVIDER=os.getenv('TEST_PROVIDER_URL',PROVIDER)
class APIError(Exception):
 def __init__(self,status,message):self.status=status;self.message=message

def trusted_proxy(address):
 try:return any(ipaddress.ip_address(address)in ipaddress.ip_network(x.strip())for x in os.getenv('TRUSTED_PROXY_IPS','127.0.0.1/32,::1/128').split(','))
 except ValueError:return False

def now():return int(time.time())
def fail(condition,message,status=400):
 if condition:raise APIError(status,message)
def dump(x):return json.dumps(x,ensure_ascii=False,separators=(',',':'))
def digest(x):return hashlib.sha256(x.encode()).hexdigest()
def password_hash(password,salt):
 with KDF_LIMIT:return hashlib.scrypt(password.encode(),salt=bytes.fromhex(salt),n=131072,r=8,p=1,dklen=32,maxmem=256*1024*1024).hex()
def valid_password(p):fail(not isinstance(p,str)or not 12<=len(p)<=128,'Пароль: от 12 до 128 символов.')
def parse_id(v):
 m=ID.fullmatch(str(v));return 'anilist-'+str(int(m[1])) if m and int(m[1])<=2147483647 else None
@contextmanager
def tx():
 with LOCK:
  c=sqlite3.connect(DB_PATH,timeout=15);c.row_factory=sqlite3.Row;c.execute('PRAGMA foreign_keys=ON');c.execute('BEGIN IMMEDIATE')
  try:yield c;c.commit()
  except Exception:c.rollback();raise
  finally:c.close()
def init_db():
 os.umask(0o077);Path(DB_PATH).parent.mkdir(parents=True,exist_ok=True,mode=0o700)
 with sqlite3.connect(DB_PATH)as c:
  c.execute('PRAGMA journal_mode=WAL');c.executescript('''
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT UNIQUE NOT NULL,salt TEXT NOT NULL,password TEXT NOT NULL,recovery TEXT NOT NULL,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS wallets(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,coins INTEGER NOT NULL DEFAULT 0 CHECK(coins>=0),earned INTEGER NOT NULL DEFAULT 0,metrics TEXT NOT NULL DEFAULT '{}',equipped TEXT NOT NULL,animation INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS claims(user_id TEXT REFERENCES users(id) ON DELETE CASCADE,key TEXT,PRIMARY KEY(user_id,key));
CREATE TABLE IF NOT EXISTS inventory(user_id TEXT REFERENCES users(id) ON DELETE CASCADE,item TEXT,source TEXT,PRIMARY KEY(user_id,item,source));
CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,delta INTEGER NOT NULL,kind TEXT NOT NULL,label TEXT NOT NULL,day TEXT NOT NULL,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),request_key TEXT NOT NULL,item TEXT NOT NULL,rub INTEGER NOT NULL,contents TEXT NOT NULL,status TEXT NOT NULL,payment_id TEXT UNIQUE,confirmation TEXT,created INTEGER NOT NULL,updated INTEGER NOT NULL,receipt_email TEXT NOT NULL DEFAULT '',UNIQUE(user_id,request_key));
CREATE TABLE IF NOT EXISTS rates(key TEXT PRIMARY KEY,window INTEGER NOT NULL,n INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS consents(user_id TEXT REFERENCES users(id),kind TEXT,version TEXT,terms_url TEXT,privacy_url TEXT,refund_url TEXT,created INTEGER,PRIMARY KEY(user_id,kind,version));
CREATE INDEX IF NOT EXISTS ledger_user_created ON ledger(user_id,created DESC);
CREATE INDEX IF NOT EXISTS orders_user_created ON orders(user_id,created DESC);
''')
  row=c.execute("SELECT value FROM settings WHERE key='payment_mode'").fetchone()
  if row and row[0]!=MODE:raise RuntimeError('Use a separate DB_PATH for test and live payments.')
  c.execute("INSERT OR IGNORE INTO settings VALUES('payment_mode',?)",(MODE,))
  if 'receipt_email'not in [x[1]for x in c.execute('PRAGMA table_info(orders)')]:c.execute("ALTER TABLE orders ADD COLUMN receipt_email TEXT NOT NULL DEFAULT ''")
def rate(key,maximum,seconds):
 window=now()//seconds
 with tx()as c:
  c.execute('INSERT INTO rates VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET n=CASE WHEN window=excluded.window THEN n+1 ELSE 1 END,window=excluded.window',(key,window));n=c.execute('SELECT n FROM rates WHERE key=?',(key,)).fetchone()['n']
 fail(n>maximum,'Слишком много запросов. Попробуй позже.',429)
def owner(uid):return bool(os.getenv('OWNER_ACCOUNT_ID'))and hmac.compare_digest(uid,os.getenv('OWNER_ACCOUNT_ID',''))
def owned(c,uid):
 out={x['id']for x in CAT['items']if x['cost']==0 and not x.get('ownerOnly')and x['kind']!='bundle'}
 out.update(x['item']for x in c.execute('SELECT item FROM inventory WHERE user_id=?',(uid,)))
 if owner(uid):out.add('fr-author')
 return out

def wallet(c,uid):
 w=c.execute('SELECT * FROM wallets WHERE user_id=?',(uid,)).fetchone();u=c.execute('SELECT username FROM users WHERE id=?',(uid,)).fetchone();own=owned(c,uid);equipped=json.loads(w['equipped'])
 for kind,default in DEFAULTS.items():
  if equipped.get(kind)not in own:equipped[kind]=default
 return {'mode':'account','username':u['username'],'accountId':uid,'role':'author'if owner(uid)else'member','coins':w['coins'],'totalEarned':w['earned'],'owned':sorted(own),'equipped':equipped,'animation':bool(w['animation']),'metrics':json.loads(w['metrics']),'ledger':[dict(x)for x in c.execute('SELECT id,delta,kind,label,created FROM ledger WHERE user_id=? ORDER BY created DESC,rowid DESC LIMIT 60',(uid,))],'orders':[{'id':x['id'],'item':x['item'],'rub':x['rub'],'status':x['status'],'confirmation':x['confirmation'],'created':x['created']}for x in c.execute('SELECT * FROM orders WHERE user_id=? ORDER BY created DESC LIMIT 20',(uid,))]}

def normalize_progress(p):
 fail(not isinstance(p,dict),'Неверный прогресс.');titles=p.get('titles',[]);fail(not isinstance(titles,list)or len(titles)>3000,'Слишком большой прогресс.');all_eps={};genres={};minutes=0;count=0
 for x in titles:
  fail(not isinstance(x,dict),'Неверный тайтл.');id=parse_id(x.get('id'));eps=x.get('episodes',[]);fail(not id or not isinstance(eps,list)or len(eps)>10000,'Неверные серии.')
  fail(any(type(n)is not int or not 1<=n<=10000 for n in eps),'Неверный номер серии.');all_eps.setdefault(id,set()).update(eps)
 fail(sum(len(v)for v in all_eps.values())>100000,'Слишком много серий.')
 # One metadata record per canonical ID; the watch history remains explicitly self-reported.
 seen=set()
 for x in titles:
  id=parse_id(x['id'])
  if id in seen:continue
  seen.add(id);n=len(all_eps[id]);duration=x.get('duration',24);duration=float(duration)if type(duration)in(int,float)else 24;duration=max(1,min(300,duration))
  minutes+=n*duration;gs=x.get('genres',[])
  if isinstance(gs,list):
   for g in set(v for v in gs if isinstance(v,str)and 1<=len(v)<=40):genres[g]=genres.get(g,0)+n
 def mapping(key,kind):
  v=p.get(key,{});fail(not isinstance(v,dict)or len(v)>30000,'Неверные списки.');out={}
  for k,val in v.items():
   id=parse_id(k);fail(not id,'Неверный ID.')
   if kind=='status':fail(val not in ['watching','planned','completed','dropped'],'Неверный статус.')
   else:fail(type(val)not in(int,float)or not 0<=val<=10,'Неверная оценка.')
   out[id]=val
  return out
 statuses=mapping('statuses','status');ratings=mapping('ratings','rating');fav=p.get('favorites',[]);fail(not isinstance(fav,list)or len(fav)>30000 or any(not parse_id(x)for x in fav),'Неверное избранное.')
 metrics={'totalEpisodes':sum(len(x)for x in all_eps.values()),'watchedTitles':sum(bool(x)for x in all_eps.values()),'hours':int(minutes/60+.5),'favoritesCount':len(set(parse_id(x)for x in fav)),'ratingsCount':len(ratings),'maxRating':max([0]+list(ratings.values())),'distinctGenres':len([g for g,n in genres.items()if n]),'genreEpisodes':genres}
 for k in ['planned','completed','dropped']:metrics[k]=sum(v==k for v in statuses.values())
 return all_eps,metrics

def metric(m,key):return m.get('genreEpisodes',{}).get(key[6:],0)if key.startswith('genre:')else m.get(key,0)
def eligible(item,m,uid):
 if item.get('ownerOnly'):return owner(uid)
 r=item.get('requirement');return not r or metric(m,r['metric'])>=r['target']
def quote(c,uid,id):
 fail(not isinstance(id,str)or id not in ITEMS,'Предмет не найден.',404);item=ITEMS[id];w=c.execute('SELECT metrics FROM wallets WHERE user_id=?',(uid,)).fetchone();m=json.loads(w['metrics']);fail(not eligible(item,m,uid),'Предмет ещё не открыт.',403);own=owned(c,uid);contents=item.get('contents',[id]);missing=[x for x in contents if x not in own];fail(not missing,'Уже есть в инвентаре.',409)
 if item['kind']=='bundle':
  total=sum(ITEMS[x]['cost']for x in contents);left=sum(ITEMS[x]['cost']for x in missing);cost=(item['cost']*left+total-1)//total;rub=(item['rub']*left+total-1)//total
 else:cost=item['cost'];rub=item['rub']
 return {'item':id,'cost':cost,'rub':rub,'contents':missing,'name':item['name'][0]}
def pending_overlap(c,uid,contents):
 return [x for x in c.execute("SELECT * FROM orders WHERE user_id=? AND status IN ('creating','pending','refund_pending')",(uid,))if set(json.loads(x['contents']))&set(contents)]

def payment_config():
 urls={k:os.getenv(k,'')for k in ['TERMS_URL','PRIVACY_URL','REFUND_URL']};enabled=os.getenv('REAL_PAYMENTS_ENABLED')=='1'and bool(SHOP and KEY and os.getenv('MERCHANT_NAME')and os.getenv('SUPPORT_EMAIL'))and all(v.startswith('https://')for v in urls.values())and MODE in ['test','live']
 fiscal=os.getenv('RECEIPT_MODE','')
 enabled=enabled and PUBLIC_URL.startswith('https://')and bool(re.fullmatch(r'[0-9]{1,20}',SHOP))and fiscal in ['provider','external']and(os.getenv('FISCAL_READY')=='1')
 return {'paymentsEnabled':bool(enabled),'paymentMode':MODE,'merchantName':os.getenv('MERCHANT_NAME',''),'supportEmail':os.getenv('SUPPORT_EMAIL',''),'termsUrl':urls['TERMS_URL'],'privacyUrl':urls['PRIVACY_URL'],'refundUrl':urls['REFUND_URL'],'reason':None if enabled else'Оплата ещё не подключена владельцем сайта.','selfReportedProgress':True,'termsVersion':os.getenv('TERMS_VERSION','17.0')}
def provider(method,path,payload=None,idem=None):
 headers={'Authorization':'Basic '+base64.b64encode((SHOP+':'+KEY).encode()).decode(),'Content-Type':'application/json'}
 if idem:headers['Idempotence-Key']=idem
 req=urllib.request.Request(PROVIDER+path,data=dump(payload).encode()if payload is not None else None,headers=headers,method=method)
 try:
  with urllib.request.urlopen(req,timeout=15)as r:return json.load(r)
 except (urllib.error.URLError,TimeoutError,ValueError):raise APIError(503,'Платёжный сервис временно недоступен. Повтори проверку заказа.')
def payment_check(order,p):
 fail(p.get('metadata',{}).get('order_id')!=order['id']or p.get('metadata',{}).get('user_id')!=order['user_id'],'Платёж не соответствует заказу.',502)
 fail(p.get('amount',{}).get('currency')!='RUB'or p.get('amount',{}).get('value')!=str(order['rub'])+'.00','Сумма платежа не совпала.',502)
 fail(p.get('test')!=(MODE=='test'),'Несовпадение тестового и рабочего режима.',502)
 fail(str(p.get('recipient',{}).get('account_id',''))!=str(SHOP),'Неверный получатель платежа.',502)
def payment_order(oid):
 with tx()as c:row=c.execute('SELECT * FROM orders WHERE id=?',(oid,)).fetchone();fail(row is None,'Заказ не найден.',404);o=dict(row)
 fail(not o['payment_id'],'Платёж ещё не создан. Повтори открытие заказа.',409);p=provider('GET','/payments/'+o['payment_id']);payment_check(o,p)
 status=p.get('status')
 if status=='succeeded':
  fail(p.get('paid')is not True,'Платёж ещё не оплачен.',409)
  with tx()as c:
   current=c.execute('SELECT status FROM orders WHERE id=?',(oid,)).fetchone()['status']
   if current not in ['paid','refunded','refund_pending','refund_review']:
    # A second source grants no extra value; duplicate ownership is fully refunded.
    existing=owned(c,o['user_id']);duplicate=all(x in existing for x in json.loads(o['contents']))
    if duplicate:c.execute('UPDATE orders SET status=?,updated=? WHERE id=?',('refund_pending',now(),oid))
    else:
     for id in json.loads(o['contents']):c.execute('INSERT OR IGNORE INTO inventory VALUES(?,?,?)',(o['user_id'],id,'pay:'+oid))
     c.execute('UPDATE orders SET status=?,updated=? WHERE id=?',('paid',now(),oid))
  with tx()as c:current=c.execute('SELECT status FROM orders WHERE id=?',(oid,)).fetchone()['status']
  if current=='refund_pending':
   refund=provider('POST','/refunds',{'payment_id':o['payment_id'],'amount':{'value':str(o['rub'])+'.00','currency':'RUB'},'description':'Предмет уже есть в инвентаре'},'refund-'+oid)
   if refund.get('status')=='succeeded':apply_refund(refund)
 elif status=='canceled':
  with tx()as c:c.execute("UPDATE orders SET status='canceled',updated=? WHERE id=? AND status NOT IN ('paid','refunded')",(now(),oid))
 return oid

def apply_refund(r):
 if r.get('status')!='succeeded':return
 with tx()as c:
  o=c.execute('SELECT * FROM orders WHERE payment_id=?',(r.get('payment_id'),)).fetchone();fail(o is None,'Неизвестный возврат.',404)
  # Full refunds revoke only the paid entitlement, never independent coin purchases.
  if r.get('amount',{}).get('currency')=='RUB'and r.get('amount',{}).get('value')==str(o['rub'])+'.00':
   c.execute('DELETE FROM inventory WHERE user_id=? AND source=?',(o['user_id'],'pay:'+o['id']));c.execute("UPDATE orders SET status='refunded',updated=? WHERE id=?",(now(),o['id']))
  else:c.execute("UPDATE orders SET status='refund_review',updated=? WHERE id=?",(now(),o['id']))

def create_payment(oid,email):
 with tx()as c:o=dict(c.execute('SELECT * FROM orders WHERE id=?',(oid,)).fetchone())
 if o['payment_id']:return
 fail(now()-o['created']>23*3600,'Заказ требует ручной проверки: не повторяй оплату, обратись в поддержку.',409)
 payload={'amount':{'value':str(o['rub'])+'.00','currency':'RUB'},'capture':True,'confirmation':{'type':'redirect','return_url':PUBLIC_URL+'?studioOrder='+oid+'#studio'},'description':'ANIME VOID: '+ITEMS[o['item']]['name'][0],'metadata':{'order_id':oid,'user_id':o['user_id']}}
 if os.getenv('RECEIPT_MODE')=='provider':
  email=o.get('receipt_email','') or email
  fail(not isinstance(email,str)or not re.fullmatch(r'[^\s@]{1,100}@[^\s@.]{1,100}\.[^\s@]{2,30}',email),'Нужен email для чека.');vat=int(os.getenv('RECEIPT_VAT_CODE','1'));fail(vat not in range(1,13),'Не настроен НДС.',503)
  payload['receipt']={'customer':{'email':email},'items':[{'description':payload['description'][:128],'quantity':'1.00','amount':payload['amount'],'vat_code':vat,'payment_subject':os.getenv('RECEIPT_SUBJECT','service'),'payment_mode':'full_payment'}]}
 p=provider('POST','/payments',payload,oid);payment_check(o,p);pid=p.get('id','');url=p.get('confirmation',{}).get('confirmation_url','');fail(not UID.fullmatch(pid),'Неверный ответ оплаты.',502)
 from urllib.parse import urlsplit
 u=urlsplit(url);fail(u.scheme!='https'or not(u.hostname in ['yoomoney.ru','yookassa.ru']or(u.hostname or'').endswith('.yoomoney.ru')or(u.hostname or'').endswith('.yookassa.ru')),'Недопустимая ссылка оплаты.',502)
 with tx()as c:c.execute('UPDATE orders SET payment_id=?,confirmation=?,status=?,updated=? WHERE id=? AND payment_id IS NULL',(pid,url,'pending',now(),oid))

class Handler(BaseHTTPRequestHandler):
 server_version='AVStudio'
 def setup(self):
  super().setup();self.connection.settimeout(25)
 def log_message(self,*a):pass # Do not log credentials, payment payloads or webhook secrets.
 def send(self,status,data):
  body=dump(data).encode();self.send_response(status);origin=self.headers.get('Origin','')
  if origin in ORIGINS:self.send_header('Access-Control-Allow-Origin',origin)
  self.send_header('Vary','Origin');self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
 def do_OPTIONS(self):
  if self.headers.get('Origin')not in ORIGINS:return self.send(403,{'error':'Origin not allowed'})
  self.send_response(204);self.send_header('Access-Control-Allow-Origin',self.headers['Origin']);self.send_header('Access-Control-Allow-Methods','GET, POST, OPTIONS');self.send_header('Access-Control-Allow-Headers','Content-Type, Authorization');self.send_header('Vary','Origin');self.end_headers()
 def do_GET(self):self.handle_api()
 def do_POST(self):self.handle_api()
 def handle_api(self):
  try:
   fail(bool(self.headers.get('Origin'))and self.headers['Origin']not in ORIGINS,'Origin not allowed',403)
   if APP_ENV=='production':fail(not(os.getenv('TRUST_PROXY')=='1'and trusted_proxy(self.client_address[0]) and self.headers.get('X-Forwarded-Proto')=='https'),'Требуется HTTPS reverse proxy.',503)
   length=int(self.headers.get('Content-Length','0'));fail(length<0 or length>3*1024*1024,'Запрос слишком большой.',413)
   payload={}
   if self.command=='POST':
    fail(not self.headers.get('Content-Type','').startswith('application/json'),'Требуется JSON.',415)
    try:payload=json.loads(self.rfile.read(length))
    except Exception:raise APIError(400,'Неверный JSON.')
    fail(not isinstance(payload,dict),'Неверный JSON.')
   path=self.path.split('?')[0];client=self.client_address[0]
   if os.getenv('TRUST_PROXY')=='1'and trusted_proxy(client):
    forwarded=self.headers.get('X-Forwarded-For','').split(',')[0].strip()
    try:client=str(ipaddress.ip_address(forwarded))
    except ValueError:pass
   ip=digest(client);rate('api:'+ip,180,60)
   if path=='/api/config'and self.command=='GET':return self.send(200,payment_config())
   if path=='/api/health'and self.command=='GET':return self.send(200,{'ok':True,'version':'17.0'})
   webhook='/api/payments/webhook/'+os.getenv('WEBHOOK_SECRET','disabled')
   if path==webhook and len(os.getenv('WEBHOOK_SECRET',''))>=32 and self.command=='POST':
    obj=payload.get('object',{});pid=obj.get('id','');fail(not UID.fullmatch(str(pid)),'Неверное уведомление.')
    if payload.get('event')=='refund.succeeded':
     r=provider('GET','/refunds/'+pid);apply_refund(r)
    else:
     with tx()as c:o=c.execute('SELECT id FROM orders WHERE payment_id=?',(pid,)).fetchone()
     fail(o is None,'Неизвестный платёж.',404);payment_order(o['id'])
    return self.send(200,{'ok':True})
   if path in ['/api/auth/register','/api/auth/login','/api/auth/recover']and self.command=='POST':
    rate('auth:'+ip,10,900);username=payload.get('username','');fail(not isinstance(username,str)or not re.fullmatch(r'[a-zA-Z0-9_]{3,24}',username),'Логин: 3–24 латинских букв, цифр или _.');username=username.lower();rate('username:'+digest(username),20,900);password=payload.get('password');valid_password(password)
    with tx()as c:u=c.execute('SELECT * FROM users WHERE username=?',(username,)).fetchone()
    recovery=None
    if path.endswith('/register'):
     rate('register:'+ip,5,3600);fail(APP_ENV=='production'and not all(os.getenv(k,'').startswith('https://')for k in ['TERMS_URL','PRIVACY_URL']),'Условия аккаунта ещё не настроены.',503);fail(payload.get('acceptedTerms')is not True,'Подтверди условия аккаунта.');fail(u is not None,'Логин занят.',409);uid=str(uuid.uuid4());salt=secrets.token_hex(24);recovery=secrets.token_urlsafe(32);ph=password_hash(password,salt)
     with tx()as c:
      fail(c.execute('SELECT 1 FROM users WHERE username=?',(username,)).fetchone()is not None,'Логин занят.',409);c.execute('INSERT INTO users VALUES(?,?,?,?,?,?)',(uid,username,salt,ph,digest(recovery),now()));c.execute('INSERT INTO wallets(user_id,equipped) VALUES(?,?)',(uid,dump(DEFAULTS)));c.execute('INSERT INTO consents VALUES(?,?,?,?,?,?,?)',(uid,'account',os.getenv('TERMS_VERSION','17.0'),os.getenv('TERMS_URL',''),os.getenv('PRIVACY_URL',''),'',now()))
    elif path.endswith('/recover'):
     code=payload.get('recovery','');fail(not isinstance(code,str)or not u or not hmac.compare_digest(digest(code),u['recovery']),'Неверный логин или код восстановления.',401);uid=u['id'];salt=secrets.token_hex(24);recovery=secrets.token_urlsafe(32);ph=password_hash(password,salt)
     with tx()as c:c.execute('UPDATE users SET salt=?,password=?,recovery=? WHERE id=?',(salt,ph,digest(recovery),uid));c.execute('DELETE FROM sessions WHERE user_id=?',(uid,))
    else:
     computed=password_hash(password,u['salt']if u else'00'*24);fail(not u or not hmac.compare_digest(computed,u['password']),'Неверный логин или пароль.',401);uid=u['id']
    token=secrets.token_urlsafe(40)
    with tx()as c:c.execute('DELETE FROM sessions WHERE expires<?',(now(),));c.execute('INSERT INTO sessions VALUES(?,?,?)',(digest(token),uid,now()+7*86400));w=wallet(c,uid)
    return self.send(200,{'token':token,'recoveryCode':recovery,'wallet':w,'config':payment_config()})
   token=self.headers.get('Authorization','').removeprefix('Bearer ');fail(len(token)<32 or len(token)>160,'Войди в аккаунт.',401)
   with tx()as c:u=c.execute('SELECT user_id FROM sessions WHERE token=? AND expires>?',(digest(token),now())).fetchone()
   fail(u is None,'Сессия истекла. Войди снова.',401);uid=u['user_id']
   if path=='/api/me'and self.command=='GET':
    with tx()as c:return self.send(200,{'wallet':wallet(c,uid),'config':payment_config()})
   fail(self.command!='POST','Маршрут не найден.',404)
   result={}
   if path=='/api/auth/logout':
    with tx()as c:c.execute('DELETE FROM sessions WHERE token=?',(digest(token),))
    return self.send(200,{'ok':True})
   elif path=='/api/rewards/claim':
    eps,m=normalize_progress(payload.get('progress'));day=time.strftime('%Y-%m-%d',time.gmtime());delta=0;episode_delta=0;bonuses=0
    with tx()as c:
     used=c.execute("SELECT COALESCE(SUM(delta),0) AS n FROM ledger WHERE user_id=? AND day=? AND kind='episode'",(uid,day)).fetchone()['n']
     for id,ns in sorted(eps.items()):
      for ep in sorted(ns):
       if used+episode_delta+2>CAT['dailyEpisodeCap']:break
       key='e:'+id+':'+str(ep)
       if c.execute('INSERT OR IGNORE INTO claims VALUES(?,?)',(uid,key)).rowcount:episode_delta+=2
     for rule in CAT['achievements']:
      if metric(m,rule['metric'])>=rule['target']and c.execute('INSERT OR IGNORE INTO claims VALUES(?,?)',(uid,'a:'+rule['id'])).rowcount:bonuses+=rule['bonus']
     for amount,kind,label in [(episode_delta,'episode','Новые отметки серий'),(bonuses,'achievement','Полученные достижения')]:
      if amount:c.execute('INSERT INTO ledger VALUES(?,?,?,?,?,?,?)',(str(uuid.uuid4()),uid,amount,kind,label,day,now()))
     delta=episode_delta+bonuses;c.execute('UPDATE wallets SET coins=coins+?,earned=earned+?,metrics=? WHERE user_id=?',(delta,delta,dump(m),uid));result={'awarded':delta,'dailyEpisodeUsed':used+episode_delta}
   elif path=='/api/quote':
    with tx()as c:return self.send(200,quote(c,uid,payload.get('item')))
   elif path=='/api/shop/buy':
    with tx()as c:
     q=quote(c,uid,payload.get('item'));fail(type(payload.get('expectedCost'))is not int or payload['expectedCost']!=q['cost'],'Цена изменилась. Обнови магазин.',409)
     fail(bool(pending_overlap(c,uid,q['contents'])),'Сначала заверши или проверь ожидающую оплату этого предмета.',409)
     changed=c.execute('UPDATE wallets SET coins=coins-? WHERE user_id=? AND coins>=?',(q['cost'],uid,q['cost'])).rowcount;fail(not changed,'Недостаточно осколков.',409);source='coin:'+str(uuid.uuid4())
     for id in q['contents']:c.execute('INSERT INTO inventory VALUES(?,?,?)',(uid,id,source))
     c.execute('INSERT INTO ledger VALUES(?,?,?,?,?,?,?)',(str(uuid.uuid4()),uid,-q['cost'],'purchase',q['name'],time.strftime('%Y-%m-%d',time.gmtime()),now()))
   elif path=='/api/equip':
    eq=payload.get('equipped');fail(not isinstance(eq,dict)or set(eq)!=set(DEFAULTS),'Неверное оформление.')
    with tx()as c:
     own=owned(c,uid)
     for kind,id in eq.items():fail(id not in own or id not in ITEMS or ITEMS[id]['kind']!=kind,'Предмет не принадлежит аккаунту.',403)
     fail(type(payload.get('animation'))is not bool,'Неверная настройка анимации.');c.execute('UPDATE wallets SET equipped=?,animation=? WHERE user_id=?',(dump(eq),int(payload['animation']),uid))
   elif path=='/api/payments/create':
    fail(not payment_config()['paymentsEnabled'],'Оплата ещё не подключена владельцем сайта.',503);fail(payload.get('acceptedTerms')is not True,'Подтверди условия продажи.');fail(payload.get('termsVersion',os.getenv('TERMS_VERSION','17.0'))!=os.getenv('TERMS_VERSION','17.0'),'Условия обновлены. Обнови страницу.',409);req=payload.get('requestId','');fail(not UID.fullmatch(str(req)),'Неверный ключ запроса.')
    with tx()as c:
     previous=c.execute('SELECT * FROM orders WHERE user_id=? AND request_key=?',(uid,req)).fetchone()
     if previous:fail(previous['item']!=payload.get('item'),'Ключ уже используется для другого заказа.',409);oid=previous['id']
     else:
      q=quote(c,uid,payload.get('item'));fail(q['rub']<=0 or payload.get('expectedRub')!=q['rub'],'Цена изменилась или предмет не продаётся.',409);overlap=pending_overlap(c,uid,q['contents'])
      if overlap:
       fail(overlap[0]['item']!=q['item'],'Сначала проверь ожидающий заказ с предметами этого набора.',409);oid=overlap[0]['id']
      else:
       fail(c.execute("SELECT COUNT(*) AS n FROM orders WHERE user_id=? AND status IN ('creating','pending')",(uid,)).fetchone()['n']>=5,'Сначала проверь предыдущие заказы.',409);email=payload.get('email','')
       fail(os.getenv('RECEIPT_MODE')=='provider'and(not isinstance(email,str)or not re.fullmatch(r'[^\s@]{1,100}@[^\s@.]{1,100}\.[^\s@]{2,30}',email)),'Нужен корректный email для чека.')
       oid=str(uuid.uuid4());c.execute('INSERT INTO orders(id,user_id,request_key,item,rub,contents,status,payment_id,confirmation,created,updated,receipt_email) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',(oid,uid,req,q['item'],q['rub'],dump(q['contents']),'creating',None,None,now(),now(),email));c.execute('INSERT INTO consents VALUES(?,?,?,?,?,?,?)',(uid,'order:'+oid,os.getenv('TERMS_VERSION','17.0'),os.getenv('TERMS_URL',''),os.getenv('PRIVACY_URL',''),os.getenv('REFUND_URL',''),now()))
    create_payment(oid,payload.get('email',''))
    with tx()as c:o=c.execute('SELECT confirmation FROM orders WHERE id=?',(oid,)).fetchone()
    result={'orderId':oid,'confirmationUrl':o['confirmation'],'paymentMode':MODE}
   elif path=='/api/payments/check':
    oid=payload.get('orderId','');fail(not UID.fullmatch(str(oid)),'Неверный заказ.')
    with tx()as c:o=c.execute('SELECT * FROM orders WHERE id=? AND user_id=?',(oid,uid)).fetchone();fail(o is None,'Заказ не найден.',404)
    if not o['payment_id']:create_payment(oid,payload.get('email',''))
    payment_order(oid)
   else:raise APIError(404,'Маршрут не найден.')
   with tx()as c:result['wallet']=wallet(c,uid)
   return self.send(200,result)
  except APIError as e:self.send(e.status,{'error':e.message})
  except (BrokenPipeError,ConnectionResetError):pass
  except Exception as e:
   print('API error:',type(e).__name__,flush=True);self.send(500,{'error':'Внутренняя ошибка. Покупка не подтверждена; проверь состояние перед повтором.'})

if __name__=='__main__':
 init_db();host=os.getenv('BIND','127.0.0.1');port=int(os.getenv('PORT','8128'));print('ANIME VOID Studio API on '+host+':'+str(port)+'; payments '+('enabled '+MODE if payment_config()['paymentsEnabled']else'disabled'),flush=True);ThreadingHTTPServer((host,port),Handler).serve_forever()
