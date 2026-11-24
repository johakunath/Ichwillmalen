"""Small helpers to drive the local ComfyUI through its HTTP API (used by run_flux_klein.py).
Copied from the Toy Racer project (tools/comfy); copy these scripts into a project's tools folder.
Changed here: upload() gives every reference a content-hashed server-side name."""
import contextlib
import hashlib
import json
import os
import shutil
import subprocess
import time
import urllib.error
import urllib.request

SERVER = "http://127.0.0.1:8188"
# The ComfyUI install (with its .venv). Override with the COMFYUI_DIR environment variable.
COMFY = os.environ.get("COMFYUI_DIR", os.path.join(os.path.expanduser("~"), "AI projects Local", "ComfyUI"))


def http(path, data=None, server=SERVER):
    req = urllib.request.Request(server + path, data=json.dumps(data).encode() if data is not None else None,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        try:
            return json.loads(body)
        except ValueError:
            raise SystemExit("COMFY FAIL: %s %s" % (e.code, body[:500]))


def upload(path, server=SERVER):
    """Uploads a reference picture and returns its server-side name. The name starts with a hash of the
    content, so two references with the same file name (pose1/ref.png, pose2/ref.png) cannot replace each
    other, and nothing else in a reused ComfyUI's input folder is overwritten."""
    boundary = "----comfyapi%d" % time.time_ns()
    with open(path, "rb") as f:
        content = f.read()
    name = "%s_%s" % (hashlib.sha1(content).hexdigest()[:12], os.path.basename(path))
    body = (("--%s\r\nContent-Disposition: form-data; name=\"image\"; filename=\"%s\"\r\n"
             "Content-Type: image/png\r\n\r\n" % (boundary, name)).encode() + content +
            ("\r\n--%s\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\ntrue\r\n--%s--\r\n"
             % (boundary, boundary)).encode())
    req = urllib.request.Request(server + "/upload/image", data=body,
                                 headers={"Content-Type": "multipart/form-data; boundary=" + boundary})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())["name"]


def server_up(server=SERVER):
    try:
        urllib.request.urlopen(server + "/system_stats", timeout=3)
        return True
    except Exception:
        return False


@contextlib.contextmanager
def comfy_server(log_path, comfy=COMFY):
    """Uses a running ComfyUI, or starts one for the duration and stops it again (frees the GPU)."""
    proc = None
    if not server_up():
        log = open(log_path, "w")
        proc = subprocess.Popen([os.path.join(comfy, ".venv", "Scripts", "python.exe"), "main.py",
                                 "--listen", "127.0.0.1", "--port", "8188", "--disable-auto-launch"],
                                cwd=comfy, stdout=log, stderr=subprocess.STDOUT)
        for _ in range(180):
            if server_up():
                break
            if proc.poll() is not None:
                raise SystemExit("COMFY FAIL: server did not start, see %s" % log_path)
            time.sleep(2)
        else:
            raise SystemExit("COMFY FAIL: server did not answer in 6 minutes")
    try:
        yield
    finally:
        if proc is not None:
            proc.terminate()


def run(prompt):
    """Queues an API prompt, waits, returns the history entry (raises on errors)."""
    res = http("/prompt", {"prompt": prompt, "client_id": "local-game-assets"})
    if res.get("error") or res.get("node_errors"):
        raise SystemExit("COMFY FAIL: %s %s" % (json.dumps(res.get("error")), json.dumps(res.get("node_errors"))[:2000]))
    pid = res["prompt_id"]
    while True:
        time.sleep(2)
        hist = http("/history/" + pid)
        if pid in hist:
            entry = hist[pid]
            if entry.get("status", {}).get("status_str") == "error":
                msgs = [m[1] for m in entry["status"].get("messages", []) if m[0] == "execution_error"]
                raise SystemExit("COMFY FAIL: %s" % (msgs[0].get("exception_message") if msgs else "error"))
            return entry


def copy_images(entry, out_paths, comfy=COMFY):
    """Copies the saved images of a finished prompt to out_paths (in order)."""
    images = []
    for node_out in entry.get("outputs", {}).values():
        images += node_out.get("images", [])
    done = []
    for img, out in zip(images, out_paths):
        src = os.path.join(comfy, "output", img.get("subfolder", ""), img["filename"])
        os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
        shutil.copy(src, out)
        done.append(out)
    return done
