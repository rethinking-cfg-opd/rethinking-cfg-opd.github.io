# Video placeholders

Drop your rendered full-rollout comparison clips here. The page auto-detects them
(via a HEAD request) and swaps the placeholder for a real <video> player.

Expected filenames (mp4 required, webm optional for smaller size):

  pose_comparison.mp4      (+ optional pose_comparison.webm)
  depth_comparison.mp4     (+ optional depth_comparison.webm)
  scribble_comparison.mp4  (+ optional scribble_comparison.webm)

Tips for small, web-friendly video:
  # H.264 mp4 (broad support)
  ffmpeg -i in.mov -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -an -movflags +faststart pose_comparison.mp4
  # VP9 webm (smaller; listed first so browsers prefer it)
  ffmpeg -i in.mov -c:v libvpx-vp9 -crf 34 -b:v 0 -an pose_comparison.webm
