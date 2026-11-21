#!/usr/bin/env python3
"""Deterministic Android emulator QA: real catalogue fixture, UI navigation, screenshots.
This script is for CI only. It never ships fixture content inside the APK.
"""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "android-app" / "qa" / "screenshots"
PKG = "ru.animevoid.app.preview"
OUT.mkdir(parents=True, exist_ok=True)


def adb(*args, check=True, timeout=50):
    result = subprocess.run(["adb", *args], capture_output=True, timeout=timeout)
    if check and result.returncode:
        raise RuntimeError("adb " + " ".join(args) + " failed (" +
                           str(result.returncode) + "): stdout=" +
                           result.stdout.decode(errors="replace")[-2000:] +
                           "; stderr=" + result.stderr.decode(errors="replace")[-2000:])
    return result


def fixture():
    manifest = json.loads((ROOT / "kodik-data" / "manifest.json").read_text("utf-8"))
    generation = manifest["generation"]
    titles = []
    known = set()
    for n in range(4):
        path = ROOT / "kodik-data" / generation / ("titles-%04d.json" % n)
        if not path.is_file():
            continue
        raw = json.loads(path.read_text("utf-8"))
        for item in raw.get("titles", []):
            key = item.get("id", "")
            if not re.fullmatch(r"(?:shikimori|kinopoisk)-[1-9][0-9]*|kodik-(?:movie|serial)-[1-9][0-9]*", key):
                continue
            if key in known or any(g in ("Хентай", "Эротика") for g in item.get("genres", [])):
                continue
            known.add(key)
            titles.append({
                "id": key,
                "titleRu": item.get("titleRu", ""),
                "titleOriginal": item.get("titleOriginal", ""),
                "year": item.get("year", 0),
                "type": item.get("type", ""),
                "poster": item.get("poster", ""),
                "genres": item.get("genres", []),
                "variantCount": len(item.get("variants", [])),
                "chunk": "titles-%04d.json" % n
            })
        if len(titles) >= 250:
            break
    assert len(titles) >= 110, "Need at least 110 real licensed-metadata samples"
    source = OUT / "qa-catalog-index.json"
    source.write_text(json.dumps({"titles": titles}, ensure_ascii=False), "utf-8")
    adb("push", str(source), "/data/local/tmp/av-qa-index.json")
    adb("shell", "chmod", "644", "/data/local/tmp/av-qa-index.json")
    # Android may not have created the app cache directory before first launch.
    command = "mkdir -p cache && cat /data/local/tmp/av-qa-index.json > cache/av-kodik-index-v87.json"
    adb("shell", "run-as", PKG, "sh", "-c", command)
    print("CI metadata fixture:", len(titles), "real catalogue items", flush=True)


def dump():
    result = adb("shell", "uiautomator", "dump", "--compressed",
                 "/sdcard/av-ui.xml", check=False, timeout=50)
    if result.returncode:
        raise RuntimeError("UIAutomator dump failed: " + result.stderr.decode(errors="replace"))
    contents = adb("exec-out", "cat", "/sdcard/av-ui.xml").stdout
    return ET.fromstring(contents)


def locate(query, exact=True):
    for node in dump().iter("node"):
        values = (node.attrib.get("content-desc", ""), node.attrib.get("text", ""))
        if any((v == query if exact else query in v) for v in values):
            bounds = node.attrib.get("bounds", "")
            found = re.fullmatch(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds)
            if found:
                x1, y1, x2, y2 = map(int, found.groups())
                return (x1 + x2) // 2, (y1 + y2) // 2
    return None


def tap(query, exact=True, scroll=False):
    for attempt in range(5 if scroll else 2):
        center = locate(query, exact)
        if center is not None:
            adb("shell", "input", "tap", str(center[0]), str(center[1]))
            time.sleep(1.5)
            return
        if scroll:
            adb("shell", "input", "swipe", "250", "670", "250", "280", "400")
            time.sleep(1)
        else:
            time.sleep(2)
    raise AssertionError("Missing navigable UI element: " + query)


def capture(name):
    time.sleep(1)
    result = adb("exec-out", "screencap", "-p")
    path = OUT / (name + ".png")
    path.write_bytes(result.stdout)
    assert path.stat().st_size > 9000, "Invalid or blank screenshot: " + name
    xml = ET.tostring(dump(), encoding="unicode")
    (OUT / (name + ".xml")).write_text(xml, "utf-8")
    print("PASS:", name, path.stat().st_size, "bytes", flush=True)


def expect(token):
    xml = ET.tostring(dump(), encoding="unicode")
    assert token in xml, "Expected visible UI token: " + token


def main():
    adb("wait-for-device")
    apk = ROOT / "android-app/app/build/outputs/apk/debug/app-debug.apk"
    assert apk.is_file(), "Build the APK before starting the emulator QA"
    adb("install", "-r", str(apk), timeout=100)
    fixture()
    adb("shell", "am", "start", "-n", PKG + "/ru.animevoid.app.MainActivity")
    time.sleep(7)
    expect("ANIME VOID")
    capture("01-home")
    tap("Каталог")
    time.sleep(4)
    expect("Поиск")
    capture("02-catalog")
    tap("открыть описание", exact=False, scroll=True)
    capture("03-title-detail")
    adb("shell", "input", "keyevent", "4")
    time.sleep(1)
    tap("Поиск")
    expect("Найди свой мир")
    capture("04-discovery")
    tap("Моё")
    capture("05-library")
    tap("Личный дневник", exact=False, scroll=True)
    capture("06-diary")
    tap("Профиль")
    capture("07-profile")
    tap("Настройки и оформление", exact=False, scroll=True)
    capture("08-settings")
    print("Emulator navigation, poster catalogue, title sheet and backup UI passed.", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        raise
