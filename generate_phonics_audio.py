#!/usr/bin/env python3
import os
import subprocess
import struct
import aifc

AUDIO_DIR = os.path.join(os.path.dirname(__file__), "public", "audio")
PHONEMES_DIR = os.path.join(os.path.dirname(__file__), "assets", "phonemes")
os.makedirs(AUDIO_DIR, exist_ok=True)

VOICE = "Samantha"

AUTHENTIC_LETTERS = {
    "A": {"fn": "a.m4a", "word": "Apple"},
    "B": {"fn": "b.m4a", "word": "Ball"},
    "C": {"fn": "c.m4a", "word": "Cat"},
    "D": {"fn": "d.m4a", "word": "Dog"},
    "E": {"fn": "e.m4a", "word": "Elephant"},
    "F": {"fn": "f.m4a", "word": "Fish"},
    "G": {"fn": "g.m4a", "word": "Guitar"},
    "H": {"fn": "h.m4a", "word": "Hat"},
    "I": {"fn": "i.m4a", "word": "Igloo"},
    "J": {"fn": "j.m4a", "word": "Juice"},
    "K": {"fn": "k.m4a", "word": "Kangaroo"},
    "L": {"fn": "l.m4a", "word": "Lion"},
    "M": {"fn": "m.m4a", "word": "Monkey"},
    "N": {"fn": "n.m4a", "word": "Nest"},
    "O": {"fn": "o.m4a", "word": "Octopus"},
    "P": {"fn": "p.m4a", "word": "Penguin"},
    "Q": {"fn": "qu.m4a", "word": "Queen"},
    "R": {"fn": "r.m4a", "word": "Rabbit"},
    "S": {"fn": "s.m4a", "word": "Sun"},
    "T": {"fn": "t.m4a", "word": "Tiger"},
    "U": {"fn": "u.m4a", "word": "Umbrella"},
    "V": {"fn": "v.m4a", "word": "Violin"},
    "W": {"fn": "w.m4a", "word": "Watermelon"},
    "X": {"fn": "x.m4a", "word": "Fox", "is_x": True},
    "Y": {"fn": "y.m4a", "word": "Yo-yo"},
    "Z": {"fn": "z.m4a", "word": "Zebra"},
}

PRAISES = {
    "praise_1": "Yay! You found the right letter sound! Great job, Quinn!",
    "praise_2": "Super star! That's the right letter sound!",
    "praise_3": "Wonderful listening, Quinn! You got it!",
    "praise_4": "You're a phonics champion, Quinn! Keep it up!",
    "praise_5": "Awesome job! You know your letter sounds so well!",
    "praise_6": "Hooray! That is correct, Quinn! Fantastic!",
}

INTROS = {
    "intro_balloons": "Welcome to Phonics Balloon Pop! Listen to the sound and pop the matching letter balloon!",
    "intro_fishing": "Welcome to Phonics Pond Fishing! Listen to the sound and catch the swimming fish!",
}

def generate_voice_clip(text, base_name):
    aiff_path = f"/tmp/{base_name}.aiff"
    m4a_path = os.path.join(AUDIO_DIR, f"{base_name}.m4a")

    subprocess.run(["say", "-v", VOICE, "-r", "165", text, "-o", aiff_path], check=True)
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", aiff_path, m4a_path], check=True)
    if os.path.exists(aiff_path):
        os.remove(aiff_path)

def generate_letter_clips(letter, info):
    src_file = os.path.join(PHONEMES_DIR, info["fn"])
    word = info["word"]
    is_x = info.get("is_x", False)

    # 1. Convert raw phoneme to 22050 Hz AIFF mono
    buzz_aiff = f"/tmp/ph_{letter}.aiff"
    subprocess.run(["afconvert", "-f", "AIFF", "-d", "BEI16@22050", "-c", "1", src_file, buzz_aiff], check=True)

    f_buzz = aifc.open(buzz_aiff, "r")
    n_buzz = f_buzz.getnframes()
    raw_buzz = f_buzz.readframes(n_buzz)
    f_buzz.close()
    if os.path.exists(buzz_aiff):
        os.remove(buzz_aiff)

    samples_buzz = list(struct.unpack(f">{n_buzz}h", raw_buzz))
    peak = max(abs(s) for s in samples_buzz) if samples_buzz else 1
    gain = min(26000.0 / peak, 32.0) if peak > 0 else 1.0

    # Apply gain with soft limiter
    amp_buzz = []
    for s in samples_buzz:
        v = int(s * gain)
        if v > 31000: v = 31000
        elif v < -31000: v = -31000
        amp_buzz.append(v)

    silence_short = [0] * int(22050 * 0.20)
    silence_mid = [0] * int(22050 * 0.35)

    # 1. Short clip: Pure normalized authentic phoneme
    out_short = aifc.open(f"/tmp/short_{letter}.aiff", "w")
    out_short.setnchannels(1)
    out_short.setsampwidth(2)
    out_short.setframerate(22050)
    out_short.writeframes(struct.pack(f">{len(amp_buzz)}h", *amp_buzz))
    out_short.close()
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", f"/tmp/short_{letter}.aiff", os.path.join(AUDIO_DIR, f"short_{letter}.m4a")], check=True)
    if os.path.exists(f"/tmp/short_{letter}.aiff"):
        os.remove(f"/tmp/short_{letter}.aiff")

    # 2. Sound clip: [Phoneme] + [Pause] + [Phoneme] + "as in {Word}!" (or "at the end of Fox and Box!")
    suffix_text = f"as in {word}!" if not is_x else "at the end of Fox and Box!"
    suffix_aiff = f"/tmp/suffix_{letter}.aiff"
    subprocess.run(["say", "-v", VOICE, "-r", "160", suffix_text, "-o", suffix_aiff], check=True)
    subprocess.run(["afconvert", "-f", "AIFF", "-d", "BEI16@22050", "-c", "1", suffix_aiff, f"/tmp/suffix_{letter}_22k.aiff"], check=True)

    f_suf = aifc.open(f"/tmp/suffix_{letter}_22k.aiff", "r")
    n_suf = f_suf.getnframes()
    raw_suf = f_suf.readframes(n_suf)
    f_suf.close()
    samples_suf = list(struct.unpack(f">{n_suf}h", raw_suf))
    for p in [suffix_aiff, f"/tmp/suffix_{letter}_22k.aiff"]:
        if os.path.exists(p): os.remove(p)

    combined_sound = amp_buzz + silence_mid + amp_buzz + silence_short + samples_suf
    out_sound = aifc.open(f"/tmp/sound_{letter}.aiff", "w")
    out_sound.setnchannels(1)
    out_sound.setsampwidth(2)
    out_sound.setframerate(22050)
    out_sound.writeframes(struct.pack(f">{len(combined_sound)}h", *combined_sound))
    out_sound.close()
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", f"/tmp/sound_{letter}.aiff", os.path.join(AUDIO_DIR, f"sound_{letter}.m4a")], check=True)
    if os.path.exists(f"/tmp/sound_{letter}.aiff"):
        os.remove(f"/tmp/sound_{letter}.aiff")

    # 3. Prompt clip:
    # "Which letter makes the" + [Phoneme] + "sound, as in {Word}?"
    # For X: "Which letter makes the sound at the end of Fox and Box?"
    if is_x:
        x_prompt_text = "Which letter makes the sound at the end of Fox and Box?"
        generate_voice_clip(x_prompt_text, f"prompt_{letter}")
    else:
        prefix_aiff = f"/tmp/pre_{letter}.aiff"
        subprocess.run(["say", "-v", VOICE, "-r", "160", "Which letter makes the", "-o", prefix_aiff], check=True)
        subprocess.run(["afconvert", "-f", "AIFF", "-d", "BEI16@22050", "-c", "1", prefix_aiff, f"/tmp/pre_{letter}_22k.aiff"], check=True)

        f_pre = aifc.open(f"/tmp/pre_{letter}_22k.aiff", "r")
        n_pre = f_pre.getnframes()
        raw_pre = f_pre.readframes(n_pre)
        f_pre.close()
        samples_pre = list(struct.unpack(f">{n_pre}h", raw_pre))

        post_aiff = f"/tmp/post_{letter}.aiff"
        subprocess.run(["say", "-v", VOICE, "-r", "160", f"sound, as in {word}?", "-o", post_aiff], check=True)
        subprocess.run(["afconvert", "-f", "AIFF", "-d", "BEI16@22050", "-c", "1", post_aiff, f"/tmp/post_{letter}_22k.aiff"], check=True)

        f_post = aifc.open(f"/tmp/post_{letter}_22k.aiff", "r")
        n_post = f_post.getnframes()
        raw_post = f_post.readframes(n_post)
        f_post.close()
        samples_post = list(struct.unpack(f">{n_post}h", raw_post))

        for p in [prefix_aiff, f"/tmp/pre_{letter}_22k.aiff", post_aiff, f"/tmp/post_{letter}_22k.aiff"]:
            if os.path.exists(p): os.remove(p)

        combined_prompt = samples_pre + silence_short + amp_buzz + silence_short + samples_post
        out_prompt = aifc.open(f"/tmp/prompt_{letter}.aiff", "w")
        out_prompt.setnchannels(1)
        out_prompt.setsampwidth(2)
        out_prompt.setframerate(22050)
        out_prompt.writeframes(struct.pack(f">{len(combined_prompt)}h", *combined_prompt))
        out_prompt.close()
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", f"/tmp/prompt_{letter}.aiff", os.path.join(AUDIO_DIR, f"prompt_{letter}.m4a")], check=True)
        if os.path.exists(f"/tmp/prompt_{letter}.aiff"):
            os.remove(f"/tmp/prompt_{letter}.aiff")

print("🔊 Generating authentic pre-recorded phonics audio clips for all 26 letters...")

for letter, info in sorted(AUTHENTIC_LETTERS.items()):
    print(f"Generating authentic phonics clips for {letter} ({info['word']})...")
    generate_letter_clips(letter, info)

print("🔊 Generating praise clips...")
for key, text in PRAISES.items():
    print(f"Generating praise: {key}...")
    generate_voice_clip(text, key)

print("🔊 Generating intro clips...")
for key, text in INTROS.items():
    print(f"Generating intro: {key}...")
    generate_voice_clip(text, key)

print("🎉 Complete! All letters now use authentic pre-recorded human phonics audio clips!")
