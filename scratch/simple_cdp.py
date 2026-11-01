import socket
import base64
import os
import struct
import json
import urllib.request
import time

class SimpleCDP:
    def __init__(self, ws_url):
        url_part = ws_url.replace("ws://", "")
        host_port, path = url_part.split("/", 1)
        host, port = host_port.split(":")
        self.sock = socket.create_connection((host, int(port)), timeout=15)
        self.sock.settimeout(15)
        self.path = "/" + path
        self.host = host_port
        self._handshake()
        self.msg_id = 0

    def _handshake(self):
        key = base64.b64encode(os.urandom(16)).decode('utf-8')
        headers = [
            f"GET {self.path} HTTP/1.1",
            f"Host: {self.host}",
            "Upgrade: websocket",
            "Connection: Upgrade",
            f"Sec-WebSocket-Key: {key}",
            "Sec-WebSocket-Version: 13",
            "\r\n"
        ]
        self.sock.sendall("\r\n".join(headers).encode('utf-8'))
        resp = b""
        while b"\r\n\r\n" not in resp:
            chunk = self.sock.recv(4096)
            if not chunk:
                break
            resp += chunk
        if b"101 " not in resp:
            raise RuntimeError(f"WebSocket handshake failed: {resp.decode('latin1', errors='ignore')}")

    def send_cmd(self, method, params=None):
        self.msg_id += 1
        req = {"id": self.msg_id, "method": method}
        if params:
            req["params"] = params
        payload = json.dumps(req).encode('utf-8')
        
        mask_key = os.urandom(4)
        length = len(payload)
        
        frame = bytearray()
        frame.append(0x81)
        
        if length <= 125:
            frame.append(0x80 | length)
        elif length <= 65535:
            frame.append(0x80 | 126)
            frame.extend(struct.pack("!H", length))
        else:
            frame.append(0x80 | 127)
            frame.extend(struct.pack("!Q", length))
            
        frame.extend(mask_key)
        masked_payload = bytearray(payload[i] ^ mask_key[i % 4] for i in range(length))
        frame.extend(masked_payload)
        
        self.sock.sendall(frame)
        return self._recv_response(self.msg_id)

    def _recv_response(self, req_id):
        while True:
            header = self._recv_exact(2)
            b1, b2 = header[0], header[1]
            opcode = b1 & 0x0F
            is_masked = (b2 & 0x80) != 0
            payload_len = b2 & 0x7F
            
            if payload_len == 126:
                ext = self._recv_exact(2)
                payload_len = struct.unpack("!H", ext)[0]
            elif payload_len == 127:
                ext = self._recv_exact(8)
                payload_len = struct.unpack("!Q", ext)[0]
                
            mask = self._recv_exact(4) if is_masked else None
            data = self._recv_exact(payload_len)
            
            if is_masked:
                data = bytearray(data[i] ^ mask[i % 4] for i in range(payload_len))
                
            if opcode == 0x1:
                msg = json.loads(data.decode('utf-8'))
                if msg.get("id") == req_id:
                    return msg
            elif opcode == 0x8:
                self.sock.close()
                raise ConnectionResetError("WebSocket closed by server")

    def _recv_exact(self, n):
        buf = bytearray()
        while len(buf) < n:
            chunk = self.sock.recv(n - len(buf))
            if not chunk:
                raise ConnectionResetError("Socket closed prematurely")
            buf.extend(chunk)
        return buf

    def eval(self, expr, await_promise=False):
        res = self.send_cmd("Runtime.evaluate", {
            "expression": expr,
            "returnByValue": True,
            "awaitPromise": await_promise
        })
        result = res.get("result", {})
        if "exceptionDetails" in result:
            raise RuntimeError(f"JS Error in eval: {result['exceptionDetails']}")
        return result.get("result", {}).get("value")

    def close(self):
        try:
            self.sock.close()
        except:
            pass
