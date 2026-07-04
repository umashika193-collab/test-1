const Jimp = require('jimp');

async function processImage(path, customThreshold = 35) {
  try {
    const image = await Jimp.read(path);
    
    // 左上(0,0)のピクセル色を背景色として取得
    const bgIdx = image.getPixelIndex(0, 0);
    const bgR = image.bitmap.data[bgIdx + 0];
    const bgG = image.bitmap.data[bgIdx + 1];
    const bgB = image.bitmap.data[bgIdx + 2];
    
    const threshold = customThreshold; // 許容誤差

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      // 背景色と近い色を透過する
      if (Math.abs(r - bgR) < threshold && 
          Math.abs(g - bgG) < threshold && 
          Math.abs(b - bgB) < threshold) {
        this.bitmap.data[idx + 3] = 0;
      }
    });
    await image.writeAsync(path);
    console.log('Processed auto-bg-removal for', path);
  } catch (err) {
    console.error('Error processing', path, err);
  }
}

async function run() {
  await processImage('./public/assets/player.png');
  await processImage('./public/assets/enemy.png');
  await processImage('./public/assets/powerup.png', 80); // しきい値を高くして下半分のグレーも消す
  await processImage('./public/assets/funnel.png');
  await processImage('./public/assets/boss.png');
}

run();
