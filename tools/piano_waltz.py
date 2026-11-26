"""Renders an original piano waltz (3/4, F major an octave below where it is written, A-B-A form).

Usage: python tools/piano_waltz.py assets/musica/vals-de-piano.wav
"""
import sys
import wave

import numpy as np

SAMPLE_RATE = 22050
BEAT_SECONDS = 60 / 92          # a light, cheerful waltz, one beat per quarter note
RELEASE_SECONDS = 0.35          # how long a note rings after its written length
TAIL_SECONDS = 3.0
PEAK_LEVEL = 0.42               # quiet background music, also on phones that ignore page volume
# The owner found the earlier renders too high-pitched: the whole piece sounds an octave lower
# than written and everything above SOFT_CUTOFF_HZ is gently rolled off.
TRANSPOSE_SEMITONES = -12
BASS_LIFT_SEMITONES = 12        # keeps the bass where small phone speakers can still play it
SOFT_CUTOFF_HZ = 3000
RANDOM = np.random.default_rng(15)   # fixed seed: the "human" timing is the same on every render

# Chords as (bass note, chord on beat 2, chord on beat 3), MIDI numbers.
F = (41, [57, 60, 65], [57, 60, 65])
A_MINOR = (45, [60, 64, 69], [60, 64, 69])
B_FLAT = (46, [58, 62, 65], [58, 62, 65])
C = (48, [60, 64, 67], [60, 64, 67])
C_SEVENTH = (48, [58, 64, 67], [58, 64, 67])
D_MINOR = (50, [57, 62, 65], [57, 62, 65])
G_MINOR_SEVENTH = (43, [58, 62, 65], [58, 62, 65])
F_OVER_C = (48, [57, 60, 65], [57, 60, 65])
G_MINOR_TO_C_SEVENTH = (43, [58, 62, 65], [58, 64, 67])

# Each bar: (chord, melody as [(MIDI note, beats)]). Melody lives around C5 to G6.
THEME = [
    (F, [(81, 2), (84, 1)]),
    (A_MINOR, [(88, 2), (86, 1)]),
    (B_FLAT, [(86, 1), (84, 0.5), (82, 0.5), (81, 1)]),
    (C, [(79, 1), (84, 2)]),
    (D_MINOR, [(77, 1), (81, 1), (86, 1)]),
    (B_FLAT, [(89, 2), (86, 1)]),
    (G_MINOR_SEVENTH, [(84, 0.5), (86, 0.5), (84, 1), (82, 1)]),
    (C_SEVENTH, [(79, 2), (81, 0.5), (82, 0.5)]),
]
THEME_ANSWER = [
    (F, [(81, 2), (84, 1)]),
    (A_MINOR, [(88, 2), (91, 1)]),
    (B_FLAT, [(89, 1), (86, 1), (82, 1)]),
    (B_FLAT, [(86, 2), (84, 1)]),
    (F_OVER_C, [(81, 1), (84, 1), (89, 1)]),
    (D_MINOR, [(88, 2), (86, 1)]),
    (G_MINOR_TO_C_SEVENTH, [(82, 1), (81, 1), (79, 1)]),
    (F, [(77, 3)]),
]
MIDDLE = [
    (D_MINOR, [(86, 1), (88, 1), (89, 1)]),
    (B_FLAT, [(86, 2), (82, 1)]),
    (F, [(84, 0.5), (86, 0.5), (84, 1), (81, 1)]),
    (C, [(79, 1), (81, 0.5), (82, 0.5), (84, 1)]),
    (D_MINOR, [(86, 1), (88, 1), (89, 1)]),
    (B_FLAT, [(91, 2), (89, 1)]),
    (G_MINOR_SEVENTH, [(86, 2), (82, 1)]),
    (C_SEVENTH, [(84, 1), (79, 1), (76, 1)]),
]
SONG = THEME + THEME_ANSWER + MIDDLE + THEME + THEME_ANSWER
RITARDANDO_BARS = 4             # the last bars slow down to close the piece gently


def main(output_path):
    song = render_song()
    write_wav(output_path, song)
    print(f"{output_path}: {len(song) / SAMPLE_RATE:.1f} s")


def render_song():
    bar_starts = bar_start_times()
    total_seconds = bar_starts[-1] + 3 * beat_length(len(SONG) - 1) + TAIL_SECONDS
    track = np.zeros(int(total_seconds * SAMPLE_RATE))

    for bar_index, (chord, melody) in enumerate(SONG):
        start, beat = bar_starts[bar_index], beat_length(bar_index)
        add_waltz_left_hand(track, start, beat, chord)
        add_melody_bar(track, start, beat, melody)

    return normalize(soften(add_room(track)))


def bar_start_times():
    starts, time = [], 0.0
    for bar_index in range(len(SONG)):
        starts.append(time)
        time += 3 * beat_length(bar_index)
    return starts


def beat_length(bar_index):
    bars_left = len(SONG) - bar_index
    if bars_left > RITARDANDO_BARS:
        return BEAT_SECONDS
    slowdown = (RITARDANDO_BARS - bars_left + 1) / RITARDANDO_BARS
    return BEAT_SECONDS * (1 + 0.25 * slowdown)


def add_waltz_left_hand(track, bar_start, beat, chord):
    bass, second_beat, third_beat = chord
    add_note(track, bar_start, bass + BASS_LIFT_SEMITONES, beats_long=3 * beat, loudness=0.42)
    for offset, notes in ((1, second_beat), (2, third_beat)):
        for midi in notes:
            # Short (staccato) chords on beats 2 and 3 give the waltz its bounce.
            add_note(track, bar_start + offset * beat, midi, beats_long=0.45 * beat, loudness=0.16)


def add_melody_bar(track, bar_start, beat, melody):
    time = bar_start
    for midi, beats in melody:
        add_note(track, time, midi, beats_long=beats * beat, loudness=0.62)
        time += beats * beat


def add_note(track, start_seconds, midi, beats_long, loudness):
    """A piano-like tone: stretched (inharmonic) partials, a soft attack and a two-stage decay."""
    start_seconds += RANDOM.normal(0, 0.008)           # a few milliseconds of human looseness
    loudness *= RANDOM.uniform(0.92, 1.05)
    frequency = 440.0 * 2 ** ((midi + TRANSPOSE_SEMITONES - 69) / 12)
    length = beats_long + RELEASE_SECONDS
    t = np.arange(int(length * SAMPLE_RATE)) / SAMPLE_RATE

    tone = np.zeros_like(t)
    for n in range(1, 9):
        partial = n * frequency * np.sqrt(1 + 0.0004 * n * n)   # piano strings stretch upward
        if partial > SAMPLE_RATE * 0.45:                         # stay below Nyquist: no aliasing
            break
        # Upper partials are quieter and die faster than on a bright piano: a warmer, rounder tone.
        tone += (1 / n ** 2) * np.sin(2 * np.pi * partial * t) * np.exp(-(0.9 + 1.2 * n) * t)

    attack = np.minimum(1.0, t / 0.006)
    body = 0.65 * np.exp(-2.2 * t) + 0.35 * np.exp(-0.5 * t)    # quick fade, then a long sustain
    release = np.clip((length - t) / RELEASE_SECONDS, 0, 1)      # the key is let go
    note = tone * attack * body * release * loudness

    start = max(0, int(start_seconds * SAMPLE_RATE))
    end = min(len(track), start + len(note))
    track[start:end] += note[: end - start]


def add_room(track):
    """A small, soft room: two quiet early echoes, no long repeating tail (it can sound metallic)."""
    roomy = track.copy()
    for delay_seconds, gain in ((0.05, 0.12), (0.11, 0.07)):
        delay = int(delay_seconds * SAMPLE_RATE)
        roomy[delay:] += gain * track[:-delay]
    return roomy


def soften(track):
    """A gentle low-pass (second-order roll-off past SOFT_CUTOFF_HZ) applied in the frequency domain."""
    spectrum = np.fft.rfft(track)
    frequencies = np.fft.rfftfreq(len(track), 1 / SAMPLE_RATE)
    roll_off = 1 / (1 + (frequencies / SOFT_CUTOFF_HZ) ** 4)
    return np.fft.irfft(spectrum * roll_off, n=len(track))


def normalize(track):
    return track / np.max(np.abs(track)) * PEAK_LEVEL


def write_wav(path, track):
    samples = (track * 32767).astype("<i2")
    with wave.open(path, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(samples.tobytes())


if __name__ == "__main__":
    main(sys.argv[1])
