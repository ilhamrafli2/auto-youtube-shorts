from PIL import Image, ImageDraw, ImageFont
import subprocess
import os
import textwrap

W, H = 1080, 1920
FPS = 30
DURATION = 48
OUTPUT = "shorts.mp4"

SCENES = [
    ("AI SEKARANG\nBISA MELIHAT DUNIA", "Bukan cuma mengenali wajah."),
    ("KAMERA AI", "Teknologi ini bisa mengenali objek secara real-time."),
    ("ROBOT", "Bahkan robot bisa menggunakan penglihatan seperti ini."),
    ("ANALISIS", "AI menganalisis ribuan informasi hanya dalam hitungan detik."),
    ("MASA DEPAN", "Teknologi ini mulai digunakan di mobil, pabrik, dan rumah."),
    ("DAN INI BARU\nPERMULAANNYA", "Kemampuan AI berkembang jauh lebih cepat dari yang kita kira."),
]

def font(size, bold=True):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    ]
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

FONT_BIG = font(92)
FONT_SUB = font(52, False)

os.makedirs("frames", exist_ok=True)

def make_frame(index, title, subtitle):
    img = Image.new("RGB", (W, H), (5, 8, 15))
    draw = ImageDraw.Draw(img)

    # grid futuristik
    for x in range(0, W, 90):
        draw.line((x, 0, x, H), fill=(20, 28, 42), width=1)

    for y in range(0, H, 90):
        draw.line((0, y, W, y), fill=(20, 28, 42), width=1)

    # lingkaran / interface
    cx, cy = W // 2, 650
    radius = 260 + index * 15

    draw.ellipse(
        (cx-radius, cy-radius, cx+radius, cy+radius),
        outline=(70, 110, 150),
        width=5
    )

    draw.ellipse(
        (cx-130, cy-130, cx+130, cy+130),
        outline=(120, 160, 210),
        width=4
    )

    # titik AI
    for i in range(12):
        x = cx + int(230 * __import__("math").cos(i * 0.52))
        y = cy + int(230 * __import__("math").sin(i * 0.52))
        draw.ellipse((x-8, y-8, x+8, y+8), fill=(180, 210, 240))

    # nomor scene
    draw.text(
        (70, 100),
        f"TECHNOLOGY // 0{index + 1}",
        font=font(32, False),
        fill=(150, 170, 190)
    )

    # judul
    draw.multiline_text(
        (W // 2, 1050),
        title,
        font=FONT_BIG,
        fill="white",
        anchor="mm",
        align="center",
        spacing=15
    )

    # subtitle
    lines = textwrap.wrap(subtitle, width=34)

    draw.multiline_text(
        (W // 2, 1370),
        "\n".join(lines),
        font=FONT_SUB,
        fill=(215, 220, 230),
        anchor="mm",
        align="center",
        spacing=12
    )

    return img

# Buat frame tiap scene
for i, (title, subtitle) in enumerate(SCENES):
    frame = make_frame(i, title, subtitle)
    frame.save(f"frames/scene_{i}.png")

# Buat video 48 detik dengan zoom sederhana
scene_duration = 8
frames_per_scene = scene_duration * FPS

inputs = []
filters = []

for i in range(len(SCENES)):
    # Hanya satu frame input untuk setiap scene.
    # Ini mencegah zoompan menghasilkan ribuan frame ekstra.
    inputs += [
        "-loop", "1",
        "-framerate", "1",
        "-t", "1",
        "-i", f"frames/scene_{i}.png"
    ]

    filters.append(
        f"[{i}:v]"
        f"zoompan="
        f"z='min(zoom+0.0015,1.12)':"
        f"x='iw/2-(iw/zoom/2)':"
        f"y='ih/2-(ih/zoom/2)':"
        f"d={frames_per_scene}:"
        f"s={W}x{H}:"
        f"fps={FPS}"
        f"[v{i}]"
    )

concat_inputs = "".join(f"[v{i}]" for i in range(len(SCENES)))

filter_complex = (
    ";".join(filters)
    + ";"
    + concat_inputs
    + f"concat=n={len(SCENES)}:v=1:a=0[outv]"
)

cmd = [
    "ffmpeg",
    "-y",
    *inputs,
    "-filter_complex",
    filter_complex,
    "-map",
    "[outv]",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "26",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    OUTPUT
]

subprocess.run(cmd, check=True)

print("================================")
print("VIDEO BERHASIL DIBUAT")
print(f"DURASI: {DURATION} detik")
print(f"RESOLUSI: {W}x{H}")
print(f"FILE: {OUTPUT}")
print("================================")
