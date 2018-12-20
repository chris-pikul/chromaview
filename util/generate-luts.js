const FS = require('fs');
const Path = require('path');
const PNGImage = require('pngjs-image');
const { Processor, Models } = require('./processor');

const outDir = Path.resolve(__dirname, '../', 'static');

const SPEC_SIZE = 0xFFFFFF; //Number of bytes required to output, ie. the RGB spectrum + 1 
const IMG_SIZE = 512; //Square size image

function toLUTCoord(r,g,b) {
    r = Math.floor(r / 4);
    g = Math.floor(g / 4);
    b = Math.floor(b / 4);

    let x = (b %8) * 64 + r;
    let y = Math.floor(b / 8) * 64 + g;

    return [
        x, y,
        (y * 256 + x)*4,
    ];
}

console.log('Image size: %dx%d', IMG_SIZE, IMG_SIZE);

const proc = new Processor();
for(const key in Models) {
    console.log('Generating lut for %s', key);
    proc.model = key;

    const img = PNGImage.createImage(IMG_SIZE, IMG_SIZE);

    for(let i=0; i < SPEC_SIZE; i += 4) {
        //Convert it to a pixel value
        const r = (i & 0xFF0000) >> 16;
        const g = (i & 0xFF00) >> 8;
        const b = i & 0xFF;
        
        const out = proc.process([r,g,b]);
        
        const loc = toLUTCoord(r,g,b);
        img.setAt(loc[0], loc[1], { red: out[0], green: out[1], blue: out[2], alpha: 255 });
    }

    console.log('Writing to disk');
    const path = outDir+'/'+key.toLowerCase()+'.lut.png';
    img.writeImageSync(path);
    console.log('Image written');
}

console.log('Done');