"""Make or edit a picture with FLUX.2 [klein] 4B (Apache 2.0) in the local ComfyUI.

    tools\\.venv\\Scripts\\python.exe tools\\comfy\\run_flux_klein.py --prompt "..." --out <png>
        [--ref <png> ...] [--width 1024 --height 1024] [--seed 1] [--count 1] [--steps 4]

Without --ref: text to image. With --ref: the pictures are references ("image 1", "image 2"),
for edits like "the same toy seen from its left side". Starts ComfyUI if it is not running
and stops it again. With --count N, makes N variants (seed, seed+1, ...) as <out>_1.png ...
Prints "FLUX OK: <files> (<seconds> s)".
"""
import argparse
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comfy_api as api  # noqa: E402

MODEL, TEXT_ENCODER, VAE = "flux-2-klein-4b.safetensors", "qwen_3_4b.safetensors", "flux2-vae.safetensors"


def build(prompt, refs, width, height, seed, steps, prefix):
    p = {
        "unet": {"class_type": "UNETLoader", "inputs": {"unet_name": MODEL, "weight_dtype": "default"}},
        "clip": {"class_type": "CLIPLoader", "inputs": {"clip_name": TEXT_ENCODER, "type": "flux2", "device": "default"}},
        "vae": {"class_type": "VAELoader", "inputs": {"vae_name": VAE}},
        "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["clip", 0]}},
        "neg": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["pos", 0]}},
        "latent": {"class_type": "EmptyFlux2LatentImage", "inputs": {"width": width, "height": height, "batch_size": 1}},
        "sigmas": {"class_type": "Flux2Scheduler", "inputs": {"steps": steps, "width": width, "height": height}},
        "sampler": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}},
        "noise": {"class_type": "RandomNoise", "inputs": {"noise_seed": seed}},
    }
    pos, neg = ["pos", 0], ["neg", 0]
    for i, name in enumerate(refs):
        # Each reference picture: scaled to about 1 megapixel, encoded, attached to both conditionings.
        p["ref%d" % i] = {"class_type": "LoadImage", "inputs": {"image": name}}
        p["scale%d" % i] = {"class_type": "ImageScaleToTotalPixels",
                            "inputs": {"image": ["ref%d" % i, 0], "upscale_method": "lanczos", "megapixels": 1.0,
                                       "resolution_steps": 1}}
        p["enc%d" % i] = {"class_type": "VAEEncode", "inputs": {"pixels": ["scale%d" % i, 0], "vae": ["vae", 0]}}
        p["rpos%d" % i] = {"class_type": "ReferenceLatent", "inputs": {"conditioning": pos, "latent": ["enc%d" % i, 0]}}
        p["rneg%d" % i] = {"class_type": "ReferenceLatent", "inputs": {"conditioning": neg, "latent": ["enc%d" % i, 0]}}
        pos, neg = ["rpos%d" % i, 0], ["rneg%d" % i, 0]
    p["guider"] = {"class_type": "CFGGuider", "inputs": {"model": ["unet", 0], "positive": pos, "negative": neg, "cfg": 1.0}}
    p["sample"] = {"class_type": "SamplerCustomAdvanced",
                   "inputs": {"noise": ["noise", 0], "guider": ["guider", 0], "sampler": ["sampler", 0],
                              "sigmas": ["sigmas", 0], "latent_image": ["latent", 0]}}
    p["decode"] = {"class_type": "VAEDecode", "inputs": {"samples": ["sample", 0], "vae": ["vae", 0]}}
    p["save"] = {"class_type": "SaveImage", "inputs": {"images": ["decode", 0], "filename_prefix": prefix}}
    return p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--ref", action="append", default=[])
    ap.add_argument("--width", type=int, default=1024)
    ap.add_argument("--height", type=int, default=1024)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--count", type=int, default=1)
    ap.add_argument("--steps", type=int, default=4)
    args = ap.parse_args()
    started = time.time()
    log = os.path.join(os.path.dirname(os.path.abspath(args.out)), "comfy_server.log")
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    outs = []
    with api.comfy_server(log):
        refs = [api.upload(r) for r in args.ref]
        for k in range(args.count):
            out = args.out if args.count == 1 else args.out.replace(".png", "_%d.png" % (k + 1))
            entry = api.run(build(args.prompt, refs, args.width, args.height, args.seed + k, args.steps, "flux_klein"))
            outs += api.copy_images(entry, [out])
    print("FLUX OK: %s (%.0f s)" % (", ".join(outs), time.time() - started))


if __name__ == "__main__":
    main()
