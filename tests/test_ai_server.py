import importlib.util
import io
import json
import os
import sys
from pathlib import Path
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
spec=importlib.util.spec_from_file_location('arena_server',ROOT/'server.py')
server=importlib.util.module_from_spec(spec);spec.loader.exec_module(server)

class AIValidation(unittest.TestCase):
    def setUp(self):
        self.body={'asset':json.loads((ROOT/'assets/pixel-moves/completed/ember.json').read_text()),'frame':0,'prompt':'Keep the outline, refine the tip'}

    def test_missing_key(self):
        with patch.dict(os.environ,{'OPENAI_API_KEY':''}):
            with self.assertRaises(RuntimeError): server.correct(self.body)

    def test_bad_input(self):
        for field,value in [('frame',-1),('prompt','')]:
            body={**self.body,field:value}
            with self.assertRaises(ValueError): server.validate_request(body)
        self.body['asset']['frames'][0]['runs']=[1,12289]
        with self.assertRaises(ValueError):server.validate_request(self.body)

    def test_output_bounds(self):
        for edit in [{'x':128,'y':2,'colorIndex':1},{'x':2,'y':2,'colorIndex':99},{'x':True,'y':2,'colorIndex':1}]:
            with self.assertRaises(ValueError):server.validate_edits({'edits':[edit]},5)

    def test_mock_provider(self):
        expected={'edits':[{'x':64,'y':45,'colorIndex':2}]}
        response={'status':'completed','output':[{'content':[{'type':'output_text','text':json.dumps(expected)}]}]}
        with patch.dict(os.environ,{'OPENAI_API_KEY':'test-only'}),patch.object(server.urllib.request,'urlopen',return_value=io.BytesIO(json.dumps(response).encode())) as call:
            self.assertEqual(server.correct(self.body),expected)
            request=call.call_args.args[0];payload=json.loads(request.data)
            self.assertEqual(request.full_url,'https://api.openai.com/v1/responses')
            self.assertFalse(payload['store'])
            self.assertTrue(payload['text']['format']['strict'])
            self.assertNotIn('test-only',json.dumps(payload))

if __name__=='__main__':unittest.main()
