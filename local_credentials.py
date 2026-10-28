"""Windows user-bound DPAPI storage; no credentials belong in the repository."""
import ctypes
import os
from pathlib import Path

def credential_path():
    return Path(os.environ['LOCALAPPDATA'])/'PokemonArena'/'openai-key.dpapi'

def crypt(data, protect):
    if os.name != 'nt':
        raise RuntimeError('Windows DPAPI is required')
    from ctypes import wintypes
    class Blob(ctypes.Structure):
        _fields_=[('size',wintypes.DWORD),('data',ctypes.POINTER(ctypes.c_ubyte))]
    buffer=ctypes.create_string_buffer(data)
    source=Blob(len(data),ctypes.cast(buffer,ctypes.POINTER(ctypes.c_ubyte)))
    target=Blob()
    library=ctypes.WinDLL('crypt32',use_last_error=True)
    function=library.CryptProtectData if protect else library.CryptUnprotectData
    function.argtypes=[ctypes.POINTER(Blob),ctypes.c_void_p,ctypes.c_void_p,ctypes.c_void_p,ctypes.c_void_p,wintypes.DWORD,ctypes.POINTER(Blob)]
    function.restype=wintypes.BOOL
    if not function(ctypes.byref(source),None,None,None,None,1,ctypes.byref(target)):
        raise ctypes.WinError(ctypes.get_last_error())
    try:return ctypes.string_at(target.data,target.size)
    finally:
        kernel=ctypes.WinDLL('kernel32');kernel.LocalFree.argtypes=[ctypes.c_void_p];kernel.LocalFree(target.data)

def api_key():
    # Explicit environment variables take precedence, including an empty value.
    if 'OPENAI_API_KEY' in os.environ:
        return os.environ['OPENAI_API_KEY'].strip()
    if os.name!='nt':return ''
    try:return crypt(credential_path().read_bytes(),False).decode().strip()
    except (OSError,ValueError,UnicodeError):return ''

if __name__=='__main__':
    import sys
    source=Path(sys.argv[1])
    value=source.read_text(encoding='utf-8').strip()
    if not value.startswith('sk-') or len(value)<30:
        raise ValueError('Invalid key format')
    target=credential_path()
    target.write_bytes(crypt(value.encode(),True))
    if crypt(target.read_bytes(),False).decode()!=value:
        raise RuntimeError('Credential verification failed')
    source.unlink()
    print('Credential encrypted for the current Windows user; temporary plaintext removed.')
