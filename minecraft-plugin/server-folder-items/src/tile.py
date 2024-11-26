import base64
import hashlib

class Tile:
    def __init__(self, uri=None, data=None, download_thunk=None):
        self.uri = uri
        self._data = data
        self.basename = uri.rsplit('/', 1)[-1][:-4]
        self.name = base64.decodebytes(f"{self.basename}==".encode()).decode("utf-8")
        self._download = download_thunk
        self._hash = self._calculate_hash()

    def _calculate_hash(self):
        sha256 = hashlib.sha256()
        sha256.update(self.uri.encode())
        return sha256.hexdigest()

    @property
    def hash(self):
        return self._hash

    def __repr__(self):
        is_downloaded = "pending" if data is None else "downloaded"
        return f"<Tile:{self.name}:{is_downloaded}>"

    def download(self):
        if not self._data:
            self._data = self._download().content

    @property
    def data(self):
        self.download()
        return self._data
