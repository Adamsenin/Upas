import sys
import json
import time
import subprocess
import urllib.request
import urllib.error
import tempfile
import os
import shutil

sys.stdout.reconfigure(encoding='utf-8')

# We can communicate with Chrome CDP via websocket
try:
    import websocket
except ImportError:
    # If websocket-client is not installed, install it or use standard socket
    pass

print('Preparing CDP Test Suite for Pengaturan Kuis...')

