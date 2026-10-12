#!/usr/bin/env python3
import os
import subprocess

AUDIO_DIR = os.path.join(os.path.dirname(__file__), "public", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

VOICE = "Samantha" # High clarity natural English voice

PHONICS_MAP = {
    "A": {
        "prompt": "Which letter makes the ah sound, as in Apple?",
        "sound": "Ah... Ah... Ah... as in Apple!",
        "short": "Ah",
    },
    "B": {
        "prompt": "Which letter makes the buh sound, as in Ball?",
        "sound": "Buh... Buh... Buh... as in Ball!",
        "short": "Buh",
    },
    "C": {
        "prompt": "Which letter makes the kuh sound, as in Cat?",
        "sound": "Kuh... Kuh... Kuh... as in Cat!",
        "short": "Kuh",
    },
    "D": {
        "prompt": "Which letter makes the duh sound, as in Dog?",
        "sound": "Duh... Duh... Duh... as in Dog!",
        "short": "Duh",
    },
    "E": {
        "prompt": "Which letter makes the eh sound, as in Elephant?",
        "sound": "Eh... Eh... Eh... as in Elephant!",
        "short": "Eh",
    },
    "F": {
        "prompt": "Which letter makes the fff sound, as in Fish?",
        "sound": "Ffff... Ffff... Ffff... as in Fish!",
        "short": "Ffff",
    },
    "G": {
        "prompt": "Which letter makes the guh sound, as in Grapes?",
        "sound": "Guh... Guh... Guh... as in Grapes!",
        "short": "Guh",
    },
    "H": {
        "prompt": "Which letter makes the huh sound, as in Hat?",
        "sound": "Huh... Huh... Huh... as in Hat!",
        "short": "Huh",
    },
    "I": {
        "prompt": "Which letter makes the ih sound, as in Igloo?",
        "sound": "Ih... Ih... Ih... as in Igloo!",
        "short": "Ih",
    },
    "J": {
        "prompt": "Which letter makes the juh sound, as in Jump?",
        "sound": "Juh... Juh... juh... as in Jump!",
        "short": "Juh",
    },
    "K": {
        "prompt": "Which letter makes the kuh sound, as in Kite?",
        "sound": "Kuh... Kuh... Kuh... as in Kite!",
        "short": "Kuh",
    },
    "L": {
        "prompt": "Which letter makes the lll sound, as in Lion?",
        "sound": "Lll... Lll... Lll... as in Lion!",
        "short": "Lll",
    },
    "M": {
        "prompt": "Which letter makes the mmm sound, as in Monkey?",
        "sound": "Mmmm... Mmmm... Mmmm... as in Monkey!",
        "short": "Mmmm",
    },
    "N": {
        "prompt": "Which letter makes the nnn sound, as in Nest?",
        "sound": "Nnnn... Nnnn... Nnnn... as in Nest!",
        "short": "Nnnn",
    },
    "O": {
        "prompt": "Which letter makes the aw sound, as in Octopus?",
        "sound": "Aw... Aw... Aw... as in Octopus!",
        "short": "Aw",
    },
    "P": {
        "prompt": "Which letter makes the puh sound, as in Pizza?",
        "sound": "Puh... Puh... Puh... as in Pizza!",
        "short": "Puh",
    },
    "Q": {
        "prompt": "Which letter makes the kwuh sound, as in Queen?",
        "sound": "Kwuh... Kwuh... Kwuh... as in Queen!",
        "short": "Kwuh",
    },
    "R": {
        "prompt": "Which letter makes the rrr sound, as in Rainbow?",
        "sound": "Rrr... Rrr... Rrr... as in Rainbow!",
        "short": "Rrr",
    },
    "S": {
        "prompt": "Which letter makes the sss sound, as in Sun?",
        "sound": "Ssss... Ssss... Ssss... as in Sun!",
        "short": "Ssss",
    },
    "T": {
        "prompt": "Which letter makes the tuh sound, as in Turtle?",
        "sound": "Tuh... Tuh... Tuh... as in Turtle!",
        "short": "Tuh",
    },
    "U": {
        "prompt": "Which letter makes the uh sound, as in Umbrella?",
        "sound": "Uh... Uh... Uh... as in Umbrella!",
        "short": "Uh",
    },
    "V": {
        "prompt": "Which letter makes the vvv sound, as in Volcano?",
        "sound": "Vvvv... Vvvv... Vvvv... as in Volcano!",
        "short": "Vvvv",
    },
    "W": {
        "prompt": "Which letter makes the wuh sound, as in Water?",
        "sound": "Wuh... Wuh... Wuh... as in Water!",
        "short": "Wuh",
    },
    "X": {
        "prompt": "Which letter makes the ks sound, as in Fox?",
        "sound": "Ks... Ks... Ks... as in Fox!",
        "short": "Ks, ks",
    },
    "Y": {
        "prompt": "Which letter makes the yuh sound, as in Yo-yo?",
        "sound": "Yuh... Yuh... Yuh... as in Yo-yo!",
        "short": "Yuh",
    },
    "Z": {
        "prompt": "Which letter makes the zzz sound, as in Zebra?",
        "sound": "Zzzz... Zzzz... Zzzz... as in Zebra!",
        "short": "Zzzz",
    },
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

def generate_clip(text, base_name):
    aiff_path = f"/tmp/{base_name}.aiff"
    m4a_path = os.path.join(AUDIO_DIR, f"{base_name}.m4a")
    mp3_path = os.path.join(AUDIO_DIR, f"{base_name}.mp3")

    # Generate speech audio
    subprocess.run(["say", "-v", VOICE, "-r", "165", text, "-o", aiff_path], check=True)

    # Convert to M4A (AAC)
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", aiff_path, m4a_path], check=True)

    # Convert to MP3 if ffmpeg is available, or use m4a
    if os.path.exists("/usr/local/bin/ffmpeg") or os.path.exists("/opt/homebrew/bin/ffmpeg"):
        ffmpeg_bin = "/usr/local/bin/ffmpeg" if os.path.exists("/usr/local/bin/ffmpeg") else "/opt/homebrew/bin/ffmpeg"
        subprocess.run([ffmpeg_bin, "-y", "-i", aiff_path, "-codec:a", "libmp3lame", "-qscale:a", "2", mp3_path], stderr=subprocess.DEVNULL)
    
    if os.path.exists(aiff_path):
        os.remove(aiff_path)

print("🔊 Generating corrected phonetic audio files...")

# A-Z Prompts and Pure Phonics Sounds
for letter, data in PHONICS_MAP.items():
    print(f"Generating A-Z sounds for {letter}...")
    generate_clip(data["prompt"], f"prompt_{letter}")
    generate_clip(data["sound"], f"sound_{letter}")
    generate_clip(data["short"], f"short_{letter}")

# Praises
for key, text in PRAISES.items():
    print(f"Generating praise: {key}...")
    generate_clip(text, key)

# Intros
for key, text in INTROS.items():
    print(f"Generating intro: {key}...")
    generate_clip(text, key)

print("🎉 All 88 corrected phonics audio clips generated successfully!")
