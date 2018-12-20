if(__DEV__) require('./index.html');

var USE_WASM = false;

import Processor, { Modes } from './processor';
import LUTProcessor from './lut';

var proc, lutProc;

var elVideo, elCanvasProc, elCanvasTgt;
var ctx, ctxTgt;
var width, height;
var _perf=0.0, samp=0;

function processFrame(time) {
    if(elVideo.paused || elVideo.ended) {
        console.log('Video over!');
        return; //Leave loop on pause/end
    }

    if(_perf===null) _perf = time;

    if(USE_WASM)
        processFrameWASM();
    else
        processFrameLUT();

    const delta = time - _perf;
    _perf = time;
    samp = (samp+1) % 30;

    
    ctxTgt.font = '10px sans-serif';
    ctxTgt.fillStyle = 'rgba(255,255,255,0.5)';
    ctxTgt.fillText(`${Math.round(1000/delta)}FPS - Δ${delta.toFixed(1)}`, 2, elCanvasTgt.height - 2);

    window.requestAnimationFrame(processFrame);
}

function processFrameWASM() {
    //Compute the frame
    ctx.drawImage(elVideo, 0, 0, width, height);
    const frame = ctx.getImageData(0,0, width,height);

    //Copy into processor
    proc.memcopy(frame.data.buffer);
    proc.process();
}

function processFrameLUT(time) {
    //Compute the frame
    ctx.drawImage(elVideo, 0, 0, width, height);
    const frame = ctx.getImageData(0,0, width,height);
    const bytes = frame.data.length / 4; //4 bytes = RGBA

    for(let i=0; i < bytes; i++) {
        const inp = [
            frame.data[i*4 + 0],
            frame.data[i*4 + 1],
            frame.data[i*4 + 2]
        ];

        const out = lutProc.processData(inp);

        //Set the frame pixels
        frame.data[i*4 + 0] = out[0];
        frame.data[i*4 + 1] = out[1];
        frame.data[i*4 + 2] = out[2];
    }
    ctxTgt.putImageData(frame, 0,0); //Replace the frame
}

function startProcessing() {
    elVideo.addEventListener('play', function() {
        width = elVideo.width;
        height = elVideo.height;

        elCanvasProc.width = width;
        elCanvasProc.height = height;

        elCanvasTgt.width = width;
        elCanvasTgt.height = height;

        window.requestAnimationFrame(processFrame);
    }, false);

    elVideo.play();
}

function wasmLoaded(success) {
    if(success) {
        startProcessing();
    } else {
        //Fallback to LUT mode
        lutProc = new LUTProcessor(ctxTgt, proc.width, proc.height, proc.model, proc.anom);
        lutProc.load(lutLoaded, false);
    }
}

function lutLoaded(success) {
    if(success) {
        startProcessing();
    }
    //Dead for now.
}

(function(){ //Document load
    //Grab the elements from the page and get the contexts
    elVideo = document.getElementById('video-plr');
    elCanvasProc = document.createElement('canvas');
    elCanvasProc.width = elVideo.width;
    elCanvasProc.height = elVideo.height;

    elCanvasTgt = document.getElementById('render-target');
    ctx = elCanvasProc.getContext('2d');
    ctxTgt = elCanvasTgt.getContext('2d');

    //Create processor
    console.log('Creating processor', elVideo.width, elVideo.height);

    if(USE_WASM) {
        proc = new Processor(ctxTgt, elVideo.width, elVideo.height, Modes.PROTANOPIA);
        proc.load(wasmLoaded);
    } else {
        lutProc = new LUTProcessor(ctxTgt, elVideo.width, elVideo.height, Modes.PROTANOPIA);
        lutProc.load(lutLoaded, false);
    }
})();