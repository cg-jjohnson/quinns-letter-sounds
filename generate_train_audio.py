#!/usr/bin/env python3
import os
import struct
import aifc
import subprocess
import random
import math

AUDIO_DIR = os.path.join(os.path.dirname(__file__), "public", "audio")
PHONEMES_DIR = os.path.join(os.path.dirname(__file__), "assets", "phonemes")
os.makedirs(AUDIO_DIR, exist_ok=True)

sr = 22050

print("1. Generating Train SFX & Prompts...")

# 1. Train Whistle (Double toot steam chime)
dur_whistle = 1.8
samples = []
for i in range(int(sr * dur_whistle)):
    t = i / sr
    if t < 0.12: env = t / 0.12
    elif t > 1.4: env = max(0, (1.8 - t) / 0.4)
    else: env = 1.0
    vibrato = 1.0 + 0.008 * math.sin(2 * math.pi * 8 * t)
    toot_env = 1.0
    if 0.55 < t < 0.75:
        if t < 0.62: toot_env = (0.62 - t) / 0.07
        elif t > 0.68: toot_env = (t - 0.68) / 0.07
        else: toot_env = 0.0
    amp = env * toot_env
    s1 = math.sin(2 * math.pi * 466 * vibrato * t)
    s2 = 0.8 * math.sin(2 * math.pi * 622 * vibrato * t)
    s3 = 0.6 * math.sin(2 * math.pi * 784 * vibrato * t)
    s4 = 0.25 * math.sin(2 * math.pi * 932 * vibrato * t)
    air = (random.random() * 2 - 1) * 0.18
    val = (s1 + s2 + s3 + s4 + air) * amp * 9000
    samples.append(int(max(-31000, min(31000, val))))

out = aifc.open("/tmp/whistle.aiff", "w")
out.setnchannels(1)
out.setsampwidth(2)
out.setframerate(sr)
out.writeframes(struct.pack(f">{len(samples)}h", *samples))
out.close()
subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "/tmp/whistle.aiff", os.path.join(AUDIO_DIR, "train_whistle.m4a")], check=True)

# 2. Train Chug (Accelerating locomotive chuffs)
dur_chug = 2.4
samples_chug = [0] * int(sr * dur_chug)
times = [0.0, 0.45, 0.85, 1.20, 1.50, 1.76, 1.98, 2.18]
for t_start in times:
    chuff_dur = 0.16
    n_chuff = int(sr * chuff_dur)
    start_idx = int(t_start * sr)
    for j in range(n_chuff):
        idx = start_idx + j
        if idx >= len(samples_chug): break
        frac = j / n_chuff
        burst = math.sin(frac * math.pi) ** 1.8
        noise = (random.random() * 2 - 1)
        thump = math.sin(2 * math.pi * 95 * (j / sr)) * 0.7
        val = (noise + thump) * burst * 14000
        samples_chug[idx] = int(max(-31000, min(31000, samples_chug[idx] + val)))

out = aifc.open("/tmp/chug.aiff", "w")
out.setnchannels(1)
out.setsampwidth(2)
out.setframerate(sr)
out.writeframes(struct.pack(f">{len(samples_chug)}h", *samples_chug))
out.close()
subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "/tmp/chug.aiff", os.path.join(AUDIO_DIR, "train_chug.m4a")], check=True)

# 3. Train Spoken Audio Clips
CLIPS = [
    ("intro_train", "Welcome to Phonics Train! Listen to the word, put the letter cars on the track, and pull the whistle to check!"),
    ("hint_wrong", "Almost there! Move the train cars around to fix the letters!"),
    ("level_up_train", "All aboard! Great job, Quinn! You reached the next train level!"),
]
for name, text in CLIPS:
    tmp_aiff = f"/tmp/{name}.aiff"
    subprocess.run(["say", "-v", "Samantha", "-r", "165", text, "-o", tmp_aiff], check=True)
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", tmp_aiff, os.path.join(AUDIO_DIR, f"{name}.m4a")], check=True)

print("2. Caching 26 Authentic Phonemes in Memory...")
PHONEME_CACHE = {}
for code in "abcdefghijklmnopqrstuvwxyz":
    fn = f"{code}.m4a" if code != "q" else "qu.m4a"
    ph_path = os.path.join(PHONEMES_DIR, fn)
    if not os.path.exists(ph_path):
        ph_path = os.path.join(PHONEMES_DIR, "c.m4a")
    tmp_aiff = f"/tmp/cache_{code}.aiff"
    subprocess.run(["afconvert", "-f", "AIFF", "-d", "BEI16@22050", "-c", "1", ph_path, tmp_aiff], check=True)
    f = aifc.open(tmp_aiff, "r")
    n = f.getnframes()
    raw = f.readframes(n)
    f.close()
    if os.path.exists(tmp_aiff): os.remove(tmp_aiff)
    s_list = list(struct.unpack(f">{n}h", raw))
    peak = max(abs(s) for s in s_list) if s_list else 1
    gain = min(26000.0 / peak, 32.0) if peak > 0 else 1.0
    amp = [int(max(-31000, min(31000, s * gain))) for s in s_list]
    PHONEME_CACHE[code.upper()] = amp

ALL_WORDS = [
    # Pre-K
    "CAT", "BAT", "HAT", "MAT", "RAT",
    "DOG", "PIG", "FOX", "BUG", "COW",
    "SUN", "CUP", "BUS", "RUN", "TUB",
    "BED", "HEN", "PEN", "NET", "RED",
    "PIN", "WIN", "LIP", "ZIP", "BIG",
    "HOT", "POT", "TOP", "HOP", "MOP",
    "JAM", "HAM", "PAN", "FAN", "VAN",
    "BOX", "SIX", "MIX", "FIX", "WIG",
    "MUD", "NUT", "HUG", "JUG", "RUG",
    # Kindergarten
    "CAN", "SEE", "YOU", "AND", "THE",
    "FOR", "NOT", "ONE", "TWO", "WE",
    "BLUE", "PLAY", "HELP", "LOOK", "MAKE",
    "FROG", "DUCK", "FISH", "BIRD", "BEAR",
    "STOP", "FAST", "JUMP", "WALK", "SWIM",
    "STAR", "MOON", "TREE", "SNOW", "RAIN",
    "BOOK", "DESK", "BELL", "BALL", "DOLL",
    "LIKE", "HAVE", "GOOD", "SAID", "WENT",
    "SHIP", "BOAT", "CAR", "TRUCK", "TRAIN",
    "LOVE", "BABY", "HOME", "MILK", "CAKE",
]

unique_words = sorted(list(set(ALL_WORDS)))
print(f"3. Generating {len(unique_words)} Word Phonics Spelling Clips...")

silence_gap = [0] * int(sr * 0.35)
silence_mid = [0] * int(sr * 0.45)

for idx, word in enumerate(unique_words, 1):
    w_lower = word.lower()
    dest_m4a = os.path.join(AUDIO_DIR, f"spell_{w_lower}.m4a")

    # Generate Prefix: "Spell the word [word]!"
    prefix_aiff = f"/tmp/p_{w_lower}.aiff"
    subprocess.run(["say", "-v", "Samantha", "-r", "155", f"Spell the word {w_lower}!", "-o", prefix_aiff], check=True)
    subprocess.run(["afconvert", "-f", "AIFF", "-d", "BEI16@22050", "-c", "1", prefix_aiff, f"/tmp/p_{w_lower}_22k.aiff"], check=True)
    f_p = aifc.open(f"/tmp/p_{w_lower}_22k.aiff", "r")
    n_p = f_p.getnframes()
    samples_pre = list(struct.unpack(f">{n_p}h", f_p.readframes(n_p)))
    f_p.close()

    # Generate Suffix: "[word]!"
    suffix_aiff = f"/tmp/s_{w_lower}.aiff"
    subprocess.run(["say", "-v", "Samantha", "-r", "155", f"{w_lower}!", "-o", suffix_aiff], check=True)
    subprocess.run(["afconvert", "-f", "AIFF", "-d", "BEI16@22050", "-c", "1", suffix_aiff, f"/tmp/s_{w_lower}_22k.aiff"], check=True)
    f_s = aifc.open(f"/tmp/s_{w_lower}_22k.aiff", "r")
    n_s = f_s.getnframes()
    samples_suf = list(struct.unpack(f">{n_s}h", f_s.readframes(n_s)))
    f_s.close()

    for p in [prefix_aiff, f"/tmp/p_{w_lower}_22k.aiff", suffix_aiff, f"/tmp/s_{w_lower}_22k.aiff"]:
        if os.path.exists(p): os.remove(p)

    combined = samples_pre + silence_mid

    # Splice each authentic phoneme
    for char in word.upper():
        ph_samples = PHONEME_CACHE.get(char, PHONEME_CACHE.get("C"))
        combined += ph_samples + silence_gap

    combined += silence_mid + samples_suf

    out_aiff = f"/tmp/spell_{w_lower}.aiff"
    out_f = aifc.open(out_aiff, "w")
    out_f.setnchannels(1)
    out_f.setsampwidth(2)
    out_f.setframerate(sr)
    out_f.writeframes(struct.pack(f">{len(combined)}h", *combined))
    out_f.close()

    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", out_aiff, dest_m4a], check=True)
    if os.path.exists(out_aiff): os.remove(out_aiff)

    if idx % 10 == 0 or idx == len(unique_words):
        print(f"  Processed {idx}/{len(unique_words)} words...")

print("🎉 Complete! All train spelling audio clips generated successfully!")
