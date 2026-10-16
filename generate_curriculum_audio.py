#!/usr/bin/env python3
import os
import struct
import aifc
import subprocess

AUDIO_DIR = os.path.join(os.path.dirname(__file__), "public", "audio")
PHONEMES_DIR = os.path.join(os.path.dirname(__file__), "assets", "phonemes")
os.makedirs(AUDIO_DIR, exist_ok=True)

sr = 22050

print("1. Generating Authentic Realistic Steam Train Whistle & Chug...")

# UP844 Authentic Whistle from /tmp/up844.aiff
if os.path.exists("/tmp/up844.aiff"):
    f = aifc.open("/tmp/up844.aiff", "r")
    f_sr = f.getframerate()
    n = f.getnframes()
    raw = f.readframes(n)
    f.close()
    samples = struct.unpack(f">{n}h", raw)

    # 33.2s to 35.8s is the pristine steam whistle chime
    s1 = int(33.2 * f_sr)
    s2 = int(35.8 * f_sr)
    whistle_seg = list(samples[s1:s2])
    peak = max(abs(s) for s in whistle_seg)
    norm_w = [int(s * 27000 / peak) for s in whistle_seg]
    fade_in = int(0.08 * f_sr)
    fade_out = int(0.25 * f_sr)
    for i in range(fade_in): norm_w[i] = int(norm_w[i] * (i / fade_in))
    for i in range(fade_out): norm_w[-1 - i] = int(norm_w[-1 - i] * (i / fade_out))

    out_w = aifc.open("/tmp/whistle_clean.aiff", "w")
    out_w.setnchannels(1); out_w.setsampwidth(2); out_w.setframerate(f_sr)
    out_w.writeframes(struct.pack(f">{len(norm_w)}h", *norm_w))
    out_w.close()

    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "/tmp/whistle_clean.aiff", os.path.join(AUDIO_DIR, "train_whistle.m4a")], check=True)
    print("  -> Realistic train_whistle.m4a updated!")

# Steam Train Departure (Whistle + Rhythmic Steam Chugachuga Chuffs)
if os.path.exists("/tmp/steam_passing.aiff") and os.path.exists("/tmp/whistle_clean.aiff"):
    f_p = aifc.open("/tmp/steam_passing.aiff", "r")
    f_sr = f_p.getframerate()
    n_p = f_p.getnframes()
    raw_p = f_p.readframes(n_p)
    f_p.close()
    p_samples = struct.unpack(f">{n_p}h", raw_p)

    # 16.5s to 21.0s (4.5s of realistic chugachuga steam chuffs)
    s1 = int(16.5 * f_sr)
    s2 = int(21.0 * f_sr)
    chug_seg = list(p_samples[s1:s2])
    peak_c = max(abs(s) for s in chug_seg)
    norm_c = [int(s * 25000 / peak_c) for s in chug_seg]
    fade_out_c = int(0.8 * f_sr)
    for i in range(fade_out_c):
        norm_c[-1 - i] = int(norm_c[-1 - i] * (i / fade_out_c))

    # Load whistle
    f_w = aifc.open("/tmp/whistle_clean.aiff", "r")
    n_w = f_w.getnframes()
    raw_w = f_w.readframes(n_w)
    f_w.close()
    w_samples = struct.unpack(f">{n_w}h", raw_w)

    total_len = max(len(norm_c), len(w_samples) + int(1.5 * f_sr))
    depart = [0] * total_len

    # Add chug
    for i in range(len(norm_c)):
        depart[i] += int(norm_c[i] * 0.9)

    # Add whistle overlay starting at 0.0s
    for i in range(len(w_samples)):
        depart[i] += int(w_samples[i] * 0.95)

    depart = [int(max(-31000, min(31000, s))) for s in depart]

    out_dep = aifc.open("/tmp/depart_clean.aiff", "w")
    out_dep.setnchannels(1); out_dep.setsampwidth(2); out_dep.setframerate(f_sr)
    out_dep.writeframes(struct.pack(f">{len(depart)}h", *depart))
    out_dep.close()

    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "/tmp/depart_clean.aiff", os.path.join(AUDIO_DIR, "train_chug.m4a")], check=True)
    print("  -> Realistic train_chug.m4a (whistle + chugachuga) updated!")

print("2. Caching 26 Authentic Human Phonemes in Memory...")
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

# Complete List of Pre-K & Kindergarten Sight Words
KINDER_WORDS = [
    'he', 'was', 'that', 'she', 'on', 'they', 'but', 'at',
    'with', 'all', 'there', 'out', 'be', 'have', 'am', 'do',
    'did', 'what', 'so', 'get', 'like', 'this', 'will', 'yes',
    'went', 'are', 'now', 'no', 'came', 'ride', 'into', 'good',
    'want', 'too', 'pretty', 'four', 'saw', 'well', 'ran', 'brown',
    'eat', 'who', 'new', 'must', 'black', 'white', 'soon', 'our',
    'ate', 'say', 'under', 'please'
]

PREK_WORDS = [
    'cat', 'bat', 'hat', 'mat', 'rat',
    'dog', 'pig', 'fox', 'bug', 'cow',
    'sun', 'cup', 'bus', 'run', 'tub',
    'bed', 'hen', 'pen', 'net', 'red',
    'go', 'to', 'up', 'in', 'is', 'it',
    'see', 'the', 'you', 'and', 'can',
    'big', 'not', 'one', 'two', 'we',
    'blue', 'play', 'look', 'help', 'make',
    'jump', 'away', 'down', 'find', 'here',
    'pin', 'win', 'lip', 'zip', 'hot', 'pot', 'top', 'hop', 'mop',
    'jam', 'ham', 'pan', 'fan', 'van', 'box', 'six', 'mix', 'fix', 'wig',
    'mud', 'nut', 'hug', 'jug', 'rug'
]

ALL_WORDS = sorted(list(set(KINDER_WORDS + PREK_WORDS)))
print(f"3. Verifying & Generating Audio for {len(ALL_WORDS)} Words...")

silence_gap = [0] * int(sr * 0.35)
silence_mid = [0] * int(sr * 0.45)

generated_count = 0
for idx, w_lower in enumerate(ALL_WORDS, 1):
    dest_m4a = os.path.join(AUDIO_DIR, f"spell_{w_lower}.m4a")
    if os.path.exists(dest_m4a):
        continue

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
    for char in w_lower.upper():
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
    generated_count += 1
    print(f"  [{generated_count}] Generated spell_{w_lower}.m4a")

print(f"🎉 Complete! Generated {generated_count} new spelling clips. All {len(ALL_WORDS)} words ready!")
