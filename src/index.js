import Processor, { Modes } from "./lut";

if(!navigator.mediaDevices) {
    alert('Browser does not support HTML5 MediaDevices!');
}

var width, height;
var videoEl, cvsProc, ctxProc, cvsTgt, ctxTgt;
const lut = new Processor(Modes.NORMAL);

var _perf=0.0;

function render(time) {
    if(_perf==0.0) _perf = time;

    loopback();

    const delta = time - _perf;
    _perf = time;

    ctxTgt.font = '12px sans-serif';
    ctxTgt.fillStyle = 'rgba(255,255,255,0.5)';
    ctxTgt.fillText(`${Math.round(1000/delta)}FPS - Δ${delta.toFixed(1)} - ${lut.perf.toFixed(2)}`, 2, height - 2);

    window.requestAnimationFrame(render);
}

function loopback() {
    ctxProc.drawImage(videoEl, 0, 0);
    const frame = ctxProc.getImageData(0,0, width, height);
    const bytes = frame.data.length / 4;

    for(let i=0; i < bytes; i++) {
        lut.process(frame, i);
    }

    ctxTgt.putImageData(frame, 0, 0);
}

function lutLoaded(success) {
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

    lut.load(lutLoaded, true);
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

function findDevices() {
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            devices.forEach(device => {
                console.log(device.kind+": "+device.label+' ['+device.deviceId+']');
            });
        });
}

(function() {
    videoEl = document.getElementById('video-plr');

    const selEl = document.getElementById('modesel');
    selEl.addEventListener('change', function(evt) {
        const val = evt.target.value;
        lut.setMode( Modes[val] );

        console.log('Changed', val);
    })

    getMediaDevice();
})();
