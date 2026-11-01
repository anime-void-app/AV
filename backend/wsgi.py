"""Production WSGI entry point: gunicorn --workers 1 --threads 4 --bind 127.0.0.1:8128 wsgi:application.
The API router is transport-independent: only command, headers, address, path, body and send() are used.
"""
from email.message import Message
from http import HTTPStatus
from server import Handler,init_db,ORIGINS,dump
init_db()
class Request:
    handle_api=Handler.handle_api
    def __init__(self,environ):
        self.command=environ['REQUEST_METHOD'];self.path=environ.get('PATH_INFO','/')
        self.client_address=(environ.get('REMOTE_ADDR','127.0.0.1'),0)
        self.rfile=environ['wsgi.input'];self.headers=Message();self.result=None
        for key,value in environ.items():
            if key.startswith('HTTP_'):self.headers[key[5:].replace('_','-')]=value
        for key in ['CONTENT_TYPE','CONTENT_LENGTH']:
            if environ.get(key):self.headers[key.replace('_','-')]=environ[key]
    def send(self,status,data):self.result=(status,data)

def application(environ,start_response):
    request=Request(environ);origin=request.headers.get('Origin','')
    if request.command=='OPTIONS':
        allowed=origin in ORIGINS;status=204 if allowed else 403;body=b'' if allowed else b'{"error":"Origin not allowed"}'
    else:
        request.handle_api();status,data=request.result or (500,{'error':'No response'});body=dump(data).encode()
    headers=[('Content-Type','application/json; charset=utf-8'),('Cache-Control','no-store'),('X-Content-Type-Options','nosniff'),('Vary','Origin'),('Content-Length',str(len(body)))]
    if origin in ORIGINS:
        headers.append(('Access-Control-Allow-Origin',origin))
        if request.command=='OPTIONS':headers.extend([('Access-Control-Allow-Methods','GET, POST, OPTIONS'),('Access-Control-Allow-Headers','Content-Type, Authorization')])
    start_response(str(status)+' '+HTTPStatus(status).phrase,headers);return [body]
