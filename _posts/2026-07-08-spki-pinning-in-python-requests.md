---
layout: post
title:  "SPKI Pinning in Python Requests"
date:   2026-07-08 05:32:00 +0300
categories: [Python, Security, SSL/TLS, Cryptography]
---

Certificate pinning has long been the gold standard for preventing man-in-the-middle attacks in client applications. Most ecosystems support fingerprint-based cert pinning, but the industry is shifting toward **SPKI (Subject Public Key Info) pinning** — which pins the underlying public key rather than the certificate itself. This means rotating your CA won't break your clients, while still defending against a rogue CA issuing an untrusted certificate.

Here's how to implement SPKI pinning using `requests` and `urllib3`.

## Why SPKI over Certificate Fingerprint?

A cert fingerprint breaks every time the certificate renews. The public key stays the same. With SPKI pinning you get:

- **Rotatable certificates** without client updates
- **Same attack surface** as cert pinning — still prevents rogue CAs
- **Future-proofing** if you ever move to a different CA or HSM

## The Implementation

```python
import hashlib
from typing import Any

import requests
import urllib3
from cryptography import x509
from cryptography.hazmat.primitives import serialization
from requests.adapters import HTTPAdapter
from urllib3.connection import HTTPSConnection
from urllib3.connectionpool import HTTPSConnectionPool
from urllib3.poolmanager import PoolManager, ProxyManager


PINNED_KEYS = {
    "btwo.danleyb2.dev": {
        "b41ccc8c89282902cc4dbcbfff32323e8ffb098b0afb707f5935e2d75c7ce11a"
    }
}
```

### Step 1: The Connection Class

`urllib3` lets us swap in a custom connection class. We override `connect()` to extract the peer certificate after the TLS handshake, pull its public key, and compare it against our pin:

```python
class PinnedHTTPSConnection(HTTPSConnection):
    def connect(self):
        super().connect()
        hostname = getattr(self.sock, "server_hostname", None) or self.host

        cert_der = self.sock.getpeercert(binary_form=True)
        cert = x509.load_der_x509_certificate(cert_der)
        spki = cert.public_key().public_bytes(
            serialization.Encoding.DER,
            serialization.PublicFormat.SubjectPublicKeyInfo
        )
        actual = hashlib.sha256(spki).hexdigest()

        expected = PINNED_KEYS.get(hostname)
        if expected is None:
            self.sock.close()
            raise requests.exceptions.SSLError(f"No SPKI pin configured: {hostname}")

        if isinstance(expected, str):
            expected = {expected}

        if actual not in expected:
            self.sock.close()
            raise requests.exceptions.SSLError(
                f"SPKI pin mismatch for {hostname} (sha256={actual})"
            )
```

### Step 2: Pool Classes

We wire the custom connection into urllib3's pool hierarchy:

```python
class PinnedHTTPSConnectionPool(HTTPSConnectionPool):
    ConnectionCls = PinnedHTTPSConnection


class PinnedPoolManager(PoolManager):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pool_classes_by_scheme = {
            "http": urllib3.connectionpool.HTTPConnectionPool,
            "https": PinnedHTTPSConnectionPool,
        }


class PinnedProxyManager(ProxyManager):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pool_classes_by_scheme = {
            "http": urllib3.connectionpool.HTTPConnectionPool,
            "https": PinnedHTTPSConnectionPool,
        }
```

### Step 3: The Adapter

The adapter bridges urllib3's pools with the requests `Session` interface:

```python
class PinnedHTTPAdapter(HTTPAdapter):
    def init_poolmanager(self, connections: int, maxsize: int, block: bool = False, **pool_kwargs):
        self._pool_connections = connections
        self._pool_maxsize = maxsize
        self._pool_block = block
        self.poolmanager = PinnedPoolManager(
            num_pools=connections, maxsize=maxsize, block=block, **pool_kwargs
        )

    def proxy_manager_for(self, proxy, **proxy_kwargs):
        proxy_str = proxy.url if hasattr(proxy, 'url') else proxy
        if proxy_str not in self.proxy_manager:
            manager = PinnedProxyManager(
                proxy_url=proxy_str,
                num_pools=self._pool_connections,
                maxsize=self._pool_maxsize,
                block=self._pool_block,
                **proxy_kwargs
            )
            self.proxy_manager[proxy_str] = manager
        return self.proxy_manager[proxy_str]
```

### Step 4: Usage

```python
if __name__ == '__main__':
    session = requests.Session()
    session.mount("https://", PinnedHTTPAdapter())

    # Optional — blocks proxies that do TLS inspection (MITM)
    session.proxies.update({
        "http": "http://0.0.0.0:8087",
        "https": "http://0.0.0.0:8087",
    })

    res = session.get("https://btwo.danleyb2.dev/api/v1/secure")
    res.raise_for_status()
    print(res)
```

## Getting Your SPKI Pin

You can extract the pin from any server that's already running:

```python
import ssl, hashlib
from cryptography import x509

context = ssl.create_default_context()
conn = context.wrap_socket(ssl.socket(), server_hostname="btwo.danleyb2.dev")
conn.connect()

spki = conn.getpeercert(binary_form=True)
cert = x509.load_der_x509_certificate(spki)
pin = hashlib.sha256(
    cert.public_key().public_bytes(
        serialization.Encoding.DER,
        serialization.PublicFormat.SubjectPublicKeyInfo
    )
).hexdigest()
print(pin)  # your sha256 SPKI fingerprint
```

## Caveats

- This pins to the leaf cert's public key, not the full chain. If you have intermediate CAs with different keys, that doesn't matter — only the server's key matters for pinning.
- **Never skip the pin in production.** The code above raises on mismatch, which is correct. A `verify=False` approach defeats the entire purpose.
- You'll want a fallback pin in your config so you can rotate without downtime — just add more entries to `PINNED_KEYS[hostname]`.

## Dependencies

```
cryptography >= 41.0.0
requests >= 2.31.0
urllib3 >= 2.0.0
```

The full working example is in my [spki-pinning](https://github.com/danleyb2) repo. Questions or improvements? Drop a comment below.
