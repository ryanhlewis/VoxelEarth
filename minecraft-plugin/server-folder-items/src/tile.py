import base64
import binascii
import hashlib
from urllib.parse import urlparse
from pathlib import PurePosixPath

def _urlsafe_b64_to_text(s: str) -> str | None:
    """Try URL-safe base64 → utf-8 string. Return None on any failure."""
    # Add correct padding
    pad = (-len(s)) % 4
    padded = s + ("=" * pad)
    try:
        raw = base64.urlsafe_b64decode(padded.encode("ascii"))
        return raw.decode("utf-8")
    except (binascii.Error, UnicodeDecodeError, ValueError):
        return None

class Tile:
    def __init__(self, uri: str | None = None, data: bytes | None = None, download_thunk=None):
        self.uri = uri or ""
        self._data = data
        self._download = download_thunk

        # Robust basename: parse URL path, strip extension safely
        path = PurePosixPath(urlparse(self.uri).path)
        stem = path.stem  # "abc123" from ".../abc123.glb"

        # Try URL-safe base64 first; fall back to the raw stem
        decoded = _urlsafe_b64_to_text(stem)
        self.basename = stem
        self.name = decoded if decoded is not None else stem

        # Stable, deterministic id/hash (include full uri; also accept bytes)
        self._hash = self._calculate_hash()

    def _calculate_hash(self) -> str:
        h = hashlib.sha256()
        if isinstance(self.uri, bytes):
            h.update(self.uri)
        else:
            h.update(self.uri.encode("utf-8", errors="surrogatepass"))
        return h.hexdigest()

    @property
    def hash(self) -> str:
        return self._hash

    def __repr__(self):
        status = "downloaded" if self._data is not None else "pending"
        return f"<Tile:{self.name}:{status}>"

    def download(self):
        if self._data is None:
            if self._download is None:
                raise RuntimeError("No download thunk provided for Tile")
            # Support either a requests.Response or a bytes-like return
            blob = self._download()
            self._data = getattr(blob, "content", blob)

    @property
    def data(self) -> bytes:
        self.download()
        return self._data
