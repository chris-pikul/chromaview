//import Processor, { Modes } from "./lut";

if(!navigator.mediaDevices) {
    alert('Browser does not support HTML5 MediaDevices!');
}

var width, height;
var videoEl, cvsProc, ctxProc, cvsTgt, ctxTgt;
var _perf=0.0;

const Modes = {
    NORMAL: 'NORMAL',
    PROTANOPIA: 'PROTANOPIA',
    PROTANOMALY: 'PROTANOMALY',
    DEUTERANOPIA: 'DEUTERANOPIA',
    DEUTERANOMALY: 'DEUTERANOMALY',
    TRITANOPIA: 'TRITANOPIA',
    TRITANOMALY: 'TRITANOMALY',
    ACHROMATOPSIA: 'ACHROMATOPSIA',
    ACHROMATOMALY: 'ACHROMATOMALY',
};
const lutsLoaded = {};
var curMode = Modes.NORMAL;
var nextMode = null;
var loadedInit = false;

function toLUTCoord(r, g, b) {
    r = Math.floor(r / 4);
    g = Math.floor(g / 4);
    b = Math.floor(b / 4);

    let x = (b % 8) * 64 + r;
    let y = Math.floor(b / 8) * 64 + g;

    return (y * 512 + x)*4;
}

function loadLUT(mode) {
    const path = mode.toLowerCase()+'.lut.png';
    const img = new Image();
    img.src = path;
    img.onload = function() {
        const cvs = document.createElement('canvas');
        cvs.width = this.width;
        cvs.height = this.height;

        const c = cvs.getContext('2d');
        c.drawImage(this, 0, 0);

        lutsLoaded[mode] = c.getImageData(0,0, this.width, this.height).data;

        if(nextMode && curMode != nextMode)
            curMode = nextMode;

        if(!loadedInit)
            startRendering();

        console.log('Loaded LUT', mode);
    };
}

function changeMode(newMode) {
    if(!lutsLoaded.hasOwnProperty(newMode)) {
        //Load the new lut first
        nextMode = newMode;
        loadLUT(newMode);
    } else {
        curMode = newMode;
    }
}

function processFrame() {
    ctxProc.drawImage(videoEl, 0, 0);
    const frame = ctxProc.getImageData(0,0, width, height);
    const bytes = frame.data.length / 4;

    if(loadedInit && lutsLoaded[curMode]) {
        for(let i=0; i < bytes; i++) {
            const j = i*4;
            const r = frame.data[j], g = frame.data[j+1], b = frame.data[j+2];
            const c = toLUTCoord(r,g,b);
            frame.data[j] = lutsLoaded[curMode][c];
            frame.data[j+1] = lutsLoaded[curMode][c+1];
            frame.data[j+2] = lutsLoaded[curMode][c+2];
        }
    }

    ctxTgt.putImageData(frame, 0, 0);
}

function render(time) {
    if(_perf==0.0) _perf = time;

    processFrame();

    const delta = time - _perf;
    _perf = time;

    ctxTgt.font = '12px sans-serif';
    ctxTgt.fillStyle = 'rgba(255,255,255,0.5)';
    ctxTgt.fillText(`${Math.round(1000/delta)}FPS - Δ${delta.toFixed(1)}`, 2, height - 2);

    window.requestAnimationFrame(render);
}

function startRendering() {
    loadedInit = true;
    videoEl.play();
    window.requestAnimationFrame(render);
}

function initProcessing() {
    cvsProc = document.createElement('canvas');
    cvsProc.width = width;
    cvsProc.height = height;
    ctxProc = cvsProc.getContext('2d');

    cvsTgt = document.getElementById('render-target');
    cvsTgt.width = width;
    cvsTgt.height = height;
    ctxTgt = cvsTgt.getContext('2d');

    changeMode(Modes.NORMAL);
}

function getMediaDevice() {
    navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            width: { ideal: 1080, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'environment',
        }
    }).then(stream => {
        console.log('Got camera media, binding to video');
        const track = stream.getVideoTracks()[0];
        if(track) {
            const settings = track.getSettings();
            console.log('Video settings: ', settings);

            width = settings.width;
            height = settings.height;

            videoEl.width = settings.width;
            videoEl.height = settings.height;
            videoEl.srcObject = stream;

            initProcessing();
        }
    }).catch(err => {
        console.error('Error getting camera media: ', err);
    })
}

(function() {
    videoEl = document.getElementById('video-plr');

    const selEl = document.getElementById('modesel');
    selEl.addEventListener('change', function(evt) {
        const val = evt.target.value;
        changeMode(val);

        console.log('Changed', val);
    })

    getMediaDevice();
})();
