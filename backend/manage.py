"""Local operator tools only. Run with the same protected environment as the API service."""
import sys,sqlite3,json,time,os,shlex,re
from pathlib import Path
# Read, never execute, the protected service environment. Avoid backing up an accidental empty DB.
env_file=Path(os.getenv('AV_ENV_FILE','/etc/anime-void-studio.env'))
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line=line.strip()
        if not line or line.startswith('#') or '='not in line:continue
        key,value=line.split('=',1)
        if re.fullmatch(r'[A-Z][A-Z0-9_]*',key):os.environ.setdefault(key,' '.join(shlex.split(value)))
if not os.getenv('DB_PATH') or not Path(os.environ['DB_PATH']).is_file():
    raise SystemExit('Existing DB_PATH is required. Configure /etc/anime-void-studio.env or AV_ENV_FILE before running operator commands.')
from server import init_db,tx,DB_PATH,payment_order,create_payment,APIError
init_db()
command=sys.argv[1]if len(sys.argv)>1 else'help'
if command=='backup':
    target=Path(sys.argv[2])if len(sys.argv)>2 else Path(DB_PATH).parent/('studio-backup-'+time.strftime('%Y%m%d-%H%M%S')+'.sqlite3')
    target.parent.mkdir(parents=True,exist_ok=True)
    with sqlite3.connect(DB_PATH)as source,sqlite3.connect(target)as dest:source.backup(dest)
    target.chmod(0o600);print('Backup created:',target)
elif command=='account':
    username=sys.argv[2].lower()if len(sys.argv)>2 else''
    with tx()as c:row=c.execute('SELECT id,username,created FROM users WHERE username=?',(username,)).fetchone()
    print(json.dumps(dict(row)if row else{'error':'Not found'},ensure_ascii=False,indent=2))
elif command=='reconcile':
    with tx()as c:rows=[dict(x)for x in c.execute("SELECT * FROM orders WHERE status IN ('creating','pending','refund_pending') ORDER BY created LIMIT 100")]
    for row in rows:
        try:
            if not row['payment_id']:create_payment(row['id'],row.get('receipt_email',''))
            payment_order(row['id']);print(row['id'],'checked')
        except APIError as e:print(row['id'],'requires attention:',e.status,e.message)
elif command=='review':
    with tx()as c:rows=[dict(x)for x in c.execute("SELECT id,user_id,item,rub,status,created FROM orders WHERE status IN ('refund_review','refund_pending') OR (status='creating' AND created<?)",(int(time.time())-23*3600,))]
    print(json.dumps(rows,ensure_ascii=False,indent=2))
else:
    print('Commands: backup [PATH], account USERNAME, reconcile, review.\nNever place databases or backups in a public web directory.')
