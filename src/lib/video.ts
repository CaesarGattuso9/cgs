export function buildHlsCommand(inputPath: string, outputDir: string) {
  return `ffmpeg -i ${inputPath} -vf "scale=-2:1080" -c:v libx264 -crf 22 -preset veryfast -c:a aac -hls_time 4 -hls_playlist_type vod ${outputDir}/index.m3u8`;
}
