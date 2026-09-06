FROM lcy362/free-short-video:latest

FROM mwader/static-ffmpeg:6.1 AS ffmpeg-tools

FROM lcy362/free-short-video:latest

COPY --from=ffmpeg-tools /ffprobe /usr/local/bin/ffprobe

RUN chmod +x /usr/local/bin/ffprobe && \
    ln -sf /usr/local/bin/ffprobe /usr/bin/ffprobe && \
    echo "=== BUILD-TIME FFPROBE VERIFICATION ===" && \
    command -v ffprobe && \
    ffprobe -version | head -3
