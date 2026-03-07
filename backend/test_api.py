import json
import urllib.request

url = 'http://127.0.0.1:5000/api/search/'
data = '{}'.encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    body = resp.read().decode('utf-8')
    print('STATUS:', resp.status)
    print('BODY:', body)
