import express from "express";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

GlobalFonts.registerFromPath(
  path.resolve(__dirname, "./assets/Arimo-Bold.ttf"),
  "CustomFont"
);

const app = express();
const PORT = process.env.PORT || 3000;

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    let word = words[i];

    while (ctx.measureText(word).width > maxWidth) {
      let chunk = "";
      for (let c of word) {
        if (ctx.measureText(chunk + c).width > maxWidth) break;
        chunk += c;
      }
      if (currentLine) { lines.push(currentLine); currentLine = ""; }
      lines.push(chunk);
      word = word.slice(chunk.length);
    }

    const test = currentLine ? currentLine + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

app.get("/maker/mikasabrat", async (req, res) => {
  try {
    const text = req.query.text || "halo";

    const image = await loadImage(
      path.resolve(__dirname, "./assets/mikasabrat.png")
    );

    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0);

    const maxWidth = image.width * 0.45;
    const rotasi = 6 * Math.PI / 180;

    // Skala font mengikuti ukuran asli gambar (referensi 1000px)
    const scale = image.width / 1000;

    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let fontSize = Math.round(45 * scale);
    let lineHeight = Math.round(55 * scale);
    ctx.font = `bold ${fontSize}px CustomFont`;

    let lines = wrapText(ctx, text, maxWidth);

    if (lines.length > 4) {
      fontSize = Math.round(28 * scale);
      lineHeight = Math.round(38 * scale);
      ctx.font = `bold ${fontSize}px CustomFont`;
      lines = wrapText(ctx, text, maxWidth);
    } else if (lines.length > 2) {
      fontSize = Math.round(35 * scale);
      lineHeight = Math.round(45 * scale);
      ctx.font = `bold ${fontSize}px CustomFont`;
      lines = wrapText(ctx, text, maxWidth);
    }

    const startY = image.height * 0.68 - ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, i) => {
      ctx.save();
      ctx.translate(image.width / 2, startY + i * lineHeight);
      ctx.rotate(rotasi);
      ctx.fillText(line, 0, 0);
      ctx.restore();
    });

    const buffer = await canvas.encode("png");
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
