/**
 * LUT Based implementation
 * 
 * Basically, trying the algorithm in JS was PAINFULLY slow.
 * As in 1FPS if you're lucky.
 * So at the cost of quality I devised this LUT (look up table)
 * version that uses pre-made LUT PNGs.
 * The images are generated with the script
 * `npm run generate-luts`
 * 
 * Because LUTs are only 512x512 they only have 1/4 the resolution.
 * Doing the full RGB spectrum would be around 49MB images, so... yeah.
 * 
 * Designed to be interoperable with the WASM version for easier switching
 */

export const Modes = {
    NORMAL: 0,
    PROTANOPIA: 1,
    PROTANOMALY: 2,
    DEUTERANOPIA: 3,
    DEUTERANOMALY: 4,
    TRITANOPIA: 5,
    TRITANOMALY: 6,
    ACHROMATOPSIA: 7,
    ACHROMATOMALY: 8,
};

//Maps 1-1 with Modes
const LUTPaths = [
    'normal.lut.png',
    'protanopia.lut.png',
    'protanomaly.lut.png',
    'deuteranopia.lut.png',
    'deuteranomaly.lut.png',
    'tritanopia.lut.png',
    'tritanomaly.lut.png',
    'achromatopsia.lut.png',
    'achromatomaly.lut.png',
];

const LUTS = [];
const LUTImgs = [];

function Processor(mode = Modes.NORMAL) {
    this.perf=0.0;
    this.setMode(mode);
}

Processor.prototype.setMode = function(mode) {
    this.model = mode;
}

/**
 * Loads the data needed to process the incoming data
 * @param {function} cb Callback when loading is complete
 * @param {boolean} all Whether to load all models
 */
Processor.prototype.load = function(cb, all = false) {
    function setLUT() {
        if(all) {
            if(LUTS.length == 9) {
                for(let l of LUTS) {
                    if(!l) return;
                }
                cb(true);
            }
        } else
            cb(true);
    }

    if(all) {
        for(const ind in Modes) {
            console.log('Loading lut', ind);
            this.loadLUT(LUTPaths[ Modes[ind] ], Modes[ind], setLUT.bind(this));
        }
    } else
        this.loadLUT(LUTPaths[ this.model ], this.model, setLUT.bind(this));
}

Processor.prototype.process = function(buf, i) {
    const start = performance.now();

    const ind = Processor.toLUTCoord(buf.data[i*4], buf.data[i*4+1], buf.data[i*4+2]);
    buf.data[i*4] = LUTS[this.model][ind];
    buf.data[i*4+1] = LUTS[this.model][ind+1];
    buf.data[i*4+2] = LUTS[this.model][ind+2];

    this.perf = performance.now() - start;
    return;
}

/**
 * Processes the incoming RGB data and returns the results based on the current model
 * @param {Array} rgbArr Array of RGB values, ie. [red, green, blue]
 * @returns {Array} Resulting array in same mapping, [red, green, blue]
 */
Processor.prototype.processData = function(rgbArr) {
    if(this.curModel) {
        const ind = Processor.toLUTCoord(rgbArr[0], rgbArr[1], rgbArr[2]);

        return [
            this.curModel[ind],
            this.curModel[ind+1],
            this.curModel[ind+2],
        ];
    }
    return rgbArr;
}

Processor.toLUTCoord = function(r,g,b) {
    r = Math.floor(r / 4);
    g = Math.floor(g / 4);
    b = Math.floor(b / 4);

    let x = (b %8) * 64 + r;
    let y = Math.floor(b / 8) * 64 + g;

    return (y * 512 + x)*4;
}

Processor.prototype.loadLUT = function(path, ind, cb) {
    LUTImgs[ind] = new Image();

    LUTImgs[ind].onload = function() {
        const cvs = document.createElement('canvas');
        cvs.width = this.width;
        cvs.height = this.height;

        const c = cvs.getContext('2d');
        c.drawImage(this, 0, 0);

        const data = c.getImageData(0,0, this.width, this.height);
        LUTS[ind] = data.data;
        cb();
    }

    LUTImgs[ind].setAttribute('crossOrigin', 'anonymous');
    LUTImgs[ind].src = path;
}

export default Processor;