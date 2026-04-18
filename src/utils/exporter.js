// Export helpers. We composite the main drawing canvas onto a fresh canvas
// (with an optional background fill) so the PNG looks right even when the app
// is in dark mode and the live canvas is transparent.

export function exportCanvasAsPng(canvas, { filename = 'spirograph.png', background = null } = {}) {
  if (!canvas) return;
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d');
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, out.width, out.height);
  }
  ctx.drawImage(canvas, 0, 0);
  const url = out.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
