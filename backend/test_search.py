#!/usr/bin/env python
import urllib.request
import json

url = 'http://127.0.0.1:5000/api/search/'
data = json.dumps({}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode('utf-8')
        result = json.loads(body)
        
        print(f"\n📊 STATUS: {resp.status}")
        print(f"📝 Message: {result.get('message')}")
        docs = result.get('data', [])
        print(f"📄 Documents found: {len(docs)}\n")
        
        for doc in docs:
            print(f"  - {doc.get('id')} | {doc.get('employeeName')} | {doc.get('documentType')}")
except Exception as e:
    print(f"❌ Error: {e}")
