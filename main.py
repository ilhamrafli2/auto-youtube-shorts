from PIL import Image, ImageDraw, ImageFont
import os

WIDTH, HEIGHT = 1080, 1920
OUTPUT = "shorts.mp4"

# Background sederhana untuk tes pertama
img = Image.new("RGB", (WIDTH, HEIGHT), (10, 10, 15))
draw = ImageDraw.Draw(img)

try:
    font_big = ImageFont.truetype(
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 90
    )
    font_small = ImageFont.truetype(
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 55
    )
except:
    font_big = ImageFont.load_default()
    font_small = ImageFont.load_default()

title = "TEKNOLOGI\nMASA DEPAN"
subtitle = "AI sedang mengubah dunia."

draw.multiline_text(
    (WIDTH // 2, 650),
    title,
    font=font_big,
    fill="white",
    anchor="mm",
    align="center",
)

draw.text(
    (WIDTH // 2, 1050),
    subtitle,
    font=font_small,
    fill="white",
    anchor="mm",
)

img.save("frame.png")

# Buat video 5 detik menggunakan ffmpeg
os.system(
    "ffmpeg -y -loop 1 -i frame.png -t 5 "
    "-vf 'scale=1080:1920' -pix_fmt yuv420p shorts.mp4"
)

print("VIDEO BERHASIL DIBUAT:", OUTPUT)
