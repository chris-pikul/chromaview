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

function Processor(ctx, width, height, mode = Modes.NORMAL) {
    this.loaded = false;

    this.width = width;
    this.height = height;
    this.ctx = ctx;

    this.luts = [null,null,null,null,null,null,null,null,null] //9 Modes can be loaded

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
    function setLUT(data) {
        this.luts[ this.model ] = data.data;
        console.log('Loaded LUT image: %d', this.model);

        cb(true);
    }

    this.loadLUT(LUTPaths[ this.model], setLUT.bind(this));
}

/**
 * Processes the incoming RGB data and returns the results based on the current model
 * @param {Array} rgbArr Array of RGB values, ie. [red, green, blue]
 * @returns {Array} Resulting array in same mapping, [red, green, blue]
 */
Processor.prototype.processData = function(rgbArr) {
    if(this.luts[this.model] !== null) {
        const ind = Processor.toLUTCoord(rgbArr[0], rgbArr[1], rgbArr[2]);

        return [
            this.luts[this.model][ind],
            this.luts[this.model][ind+1],
            this.luts[this.model][ind+2],
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

Processor.prototype.loadLUT = function(path, cb) {
    if(!this._imgLoad) {
        this._imgLoad = new Image();
    }

    this._imgLoad.onload = function() {
        const cvs = document.createElement('canvas');
        cvs.width = this.width;
        cvs.height = this.height;

        const c = cvs.getContext('2d');
        c.drawImage(this, 0, 0);

        const data = c.getImageData(0,0, this.width, this.height);
        cb(data);
    }

    this._imgLoad.setAttribute('crossOrigin', 'anonymous');
    this._imgLoad.src = path;
}


export default Processor;