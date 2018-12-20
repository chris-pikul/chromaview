import loadWASM from 'rust/src/lib.rs';

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

function Processor(ctx, width, height, mode = Modes.NORMAL) {
    this.loaded = false;
    this.app = null;

    this.setMode(mode);
    
    this.width = width;
    this.height = height;

    this.ptr = null;
    this.buffer = null;

    this.ctx = ctx;
}

Processor.prototype.setMode = function(mode) {
    this.mode = mode;
}

Processor.prototype.load = function(cb) {
    loadWASM()
        .then(result => {
            this.app = result.instance.exports;

            const bytes = this.width * this.height * 4;
            this.outPtr = this.app.alloc(bytes);

            const outArr = new Uint8ClampedArray(this.app.memory.buffer, this.ptr, bytes);
            this.buffer = new ImageData(outArr, this.width, this.height);

            this.loaded = true;
            console.log('Loaded native module, buffer size: ', bytes, this.width, this.height);
            cb(true);
        })
        .catch(err => {
            console.error('Failed to load native module! Error occured: ', err);
            cb(false);
        });
}

Processor.prototype.process = function() {
    if(!this.loaded) return;

    this.app.process(this.ptr, this.width, this.height, this.mode);
    this.ctx.putImageData(this.buffer, 0, 0);
}

Processor.prototype.memcopy = function(buf) {
    new Uint8Array(this.app.memory.buffer, this.ptr, buf.byteLength).set(new Uint8Array(buf));
};

export default Processor;