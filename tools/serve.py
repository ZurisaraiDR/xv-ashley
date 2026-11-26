"""Local preview server that forbids browser caching, so every reload shows the latest files.

Usage: python tools/serve.py [port]   (default 8090, serves the project root)
http.server: https://docs.python.org/3/library/http.server.html
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main(port):
    handler = partial(NoCacheHandler, directory=str(PROJECT_ROOT))
    with ThreadingHTTPServer(("", port), handler) as server:
        print(f"Serving {PROJECT_ROOT} at http://localhost:{port}/ (no cache)")
        server.serve_forever()


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 8090)
