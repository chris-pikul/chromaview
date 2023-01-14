/**
 * Dev Notes
 * =========
 * 
 * Constructor called when component mounted
 * Load() called when transition into finished.
 * 
 * Constructor should try and see if there are permissions already for the
 * camera. If there are, then start working immediately, otherwise wait for load
 * 
 * Load should see if we are already playing and if so just defer out. Otherwise
 * try and start the camera work and ask for permissions.
 */
import LUT from './lut';

const requestAnimFrame:((cb:FrameRequestCallback) => number) = (() => {
  if(window && 'requestAnimationFrame' in window)
    return window.requestAnimationFrame;
  return (cb:Function) => setTimeout(cb, 1);
})();

export default class Processor {
  visible = false;
  loading:boolean = false;
  requested:boolean = false;
  permitted:boolean = false;
  trackSettings:(MediaTrackSettings|null) = null;
  running:boolean = false;

  acuity:number = 2;

  lastTime = 0;
  deltaTime = 0;
  fpsCount = 0;
  sampleTime = 0;

  #stream:(MediaStream|null) = null;
  #video:(HTMLVideoElement|null) = null;

  #bufferCanvas:(HTMLCanvasElement|null) = null;
  #bufferCTX:(CanvasRenderingContext2D|null) = null;

  #displayCanvas:(HTMLCanvasElement|null) = null;
  #displayCTX:(CanvasRenderingContext2D|null) = null;

  #videoWidth = 320;
  #videoHeight = 240;
  #videoAspect = (320 / 240);
  #domWidth = 320;
  #domHeight = 240;
  #domAspect = (320 / 240);

  #lut:(LUT|null) = null;
  #loadingLUT = false;
  #loadNextLut:(string|URL|null) = null;

  constructor() {
    this.load = this.load.bind(this);
    this.checkAlreadyPermitted = this.checkAlreadyPermitted.bind(this);
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.process = this.process.bind(this);
    this.render = this.render.bind(this);
    this.changeLUT = this.changeLUT.bind(this);
    this.loadLUTFromURL = this.loadLUTFromURL.bind(this);
    this.setCanvas = this.setCanvas.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.updateVisibility = this.updateVisibility.bind(this);

    this.#video = document.createElement('video');
    this.#video.width = this.#videoWidth = 320;
    this.#video.height = this.#videoHeight = 320;

    this.#bufferCanvas = document.createElement('canvas');
    this.#bufferCanvas.width = this.#videoWidth;
    this.#bufferCanvas.height = this.#videoHeight;
    this.#bufferCTX = this.#bufferCanvas.getContext('2d', {
      alpha: false,
      willReadFrequently: true,
    });

    // Start with a do-nothing LUT
    this.#lut = new LUT();

    document.addEventListener('visibilitychange', this.updateVisibility);
    this.updateVisibility();

    console.log('Processor constructed, checking if already permitted...');
    this.checkAlreadyPermitted();
  }

  checkAlreadyPermitted():void {
    console.log('Checking if camera is already permitted...');

    // Enumerate devices to see if permission already given
    if('mediaDevices' in navigator) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const permitted = devices.find(device => (device.kind === 'videoinput' && device.label !== ''));

          // If we already have permission, start the load and display sequence
          if(permitted) {
            console.log('Permission already given, starting now');
            this.permitted = true;
            this.load();
          } else {
            // If not permitted, hold until load() is called manually
            this.permitted = false;
            console.log('Not permitted yet, waiting to ask');
          }
        })
        .catch(err => {
          console.error('Error checking if already permitted: ', err.message ?? err);
          this.permitted = false;
        });
    } else {
      console.error('No support for MediaDevices in navigator!');
      this.permitted = false;
    }
  }

  load() {
    // Shortcut if already trying to load
    if(this.loading || this.#stream) return;

    // Only work if mediaDevices is supported in browser
    if(navigator && 'mediaDevices' in navigator) {
      // Catch race conditions and React's strict mode
      this.loading = true;
      console.log('Requesting camera permission...');

      // Ask for a camera stream
      navigator.mediaDevices.getUserMedia({
        video: {
          width: {
            max: 1920,
          },
          height: {
            max: 1080,
          },
          facingMode: 'environment',
        },
      } as MediaStreamConstraints).then(stream => {
        console.info('Received response from mediaDevices');

        // Ensure we have video tracks
        if(stream.getVideoTracks().length > 0) {
          this.permitted = true;
          this.#stream = stream;

          const videoTrack = this.#stream.getVideoTracks()[0];
          this.trackSettings = videoTrack.getSettings();

          console.log(`User gave camera permission: number of tracks = ${stream.getVideoTracks().length}`, this.trackSettings);

          // Assign the video stream object to the hidden video element
          if(this.#video) {
            this.#video.width = this.#videoWidth = this.trackSettings.width ?? 320;
            this.#video.height = this.#videoHeight = this.trackSettings.height ?? 240;
            this.#videoAspect = this.#videoWidth / this.#videoHeight;
            this.#video.srcObject = this.#stream;
            this.#video.play();

            console.info('Stream was attached to internal video element');

            // Start processing!
            this.start();
          } else {
            console.error(`No video element to send stream to`);
          }
        } else {
          console.error('No video tracks available in the stream');
        }
      }).catch(err => {
        console.error(`Error attempting to get camera stream`, err.message ?? err);
      }).finally(() => {
        this.requested = true;
        this.loading = false;
        console.info('Finished loading sequence');
      });
    } else {
      // !navigator && mediaDevices in navigator
      console.error('No support for MediaDevices in navigator');
    }
  }

  start() {
    console.info('Starting rendering and processing loop');
    this.lastTime = Date.now();
    this.running = true;
    requestAnimFrame(this.render);
  }

  stop() {
    console.log('Stopping the process');

    this.running = false;

    if(this.#stream) {
      this.#stream.getTracks().forEach(track => track.stop());
      this.#stream = null;
    }
  }

  process() {
    if(this.running && this.#video && this.#bufferCanvas && this.#bufferCTX) {
      this.#bufferCanvas.width = this.#videoWidth;
      this.#bufferCanvas.height = this.#videoHeight;
      
      if(this.acuity > 1) 
        this.#bufferCTX.filter = `blur(${Math.trunc(Math.min(this.#videoWidth / this.#domWidth, 0.66) * (this.acuity * this.acuity))}px)`;

      this.#bufferCTX.drawImage(this.#video, 0, 0, this.#videoWidth, this.#videoHeight);

      // Use current LUT if available
      if(this.#lut) {
        const frame = this.#bufferCTX.getImageData(0, 0, this.#videoWidth, this.#videoHeight);
        this.#lut.processBuffer(frame.data);
        this.#bufferCTX.putImageData(frame, 0, 0);
      }
    }
  }

  render() {
    if(!this.running) return;

    this.process();

    if(this.#displayCanvas && this.#displayCTX) {
      this.#displayCanvas.width = this.#domWidth;
      this.#displayCanvas.height = this.#domHeight;

      // Copy the buffer and up-scale it to the display
      if(this.#bufferCanvas) {
        // Maintain video aspect ratio, centered in canvas
        const dispHeight = this.#domWidth * (1.0 / this.#videoAspect);
        const offsetY = (this.#domHeight - dispHeight) / 2;
        this.#displayCTX.drawImage(this.#bufferCanvas, 0, offsetY, this.#domWidth, dispHeight);
      }

      // Draw the FPS clock
      this.#displayCTX.font = '10px Arial';
      this.#displayCTX.fillStyle = 'white';
      this.#displayCTX.fillText(`${this.fpsCount.toString().padStart(3, ' ')}FPS | Δ${this.deltaTime.toPrecision(2).padStart(4, ' ')}/ms`, 5, 15);
    }

    // Time keeping FPS/Delta counters
    const delta = (Date.now() - this.lastTime);
    this.sampleTime += delta;
    if(this.sampleTime > 200) {
      this.deltaTime = delta;
      this.fpsCount = Math.floor(1.0 / (this.deltaTime * 0.001));
      this.sampleTime = 0;
    }
    this.lastTime = Date.now();

    // Request next frame
    requestAnimFrame(this.render);
  }

  changeLUT(url?:(string|URL|null)) {
    if(!url) {
      this.#lut = new LUT();
    } else {
      this.loadLUTFromURL(url);
    }
  }

  loadLUTFromURL(url:(string|URL)) {
    if(this.#loadingLUT) {
      this.#loadNextLut = url;
      return;
    }

    this.#loadingLUT = true;
    LUT.loadLUTImage(url)
      .then(lut => {
        this.#lut = lut;
        console.log('Received LUT from async loading');
      })
      .catch(err => {
        console.error('Bad LUT received', err);
      })
      .finally(() => {
        this.#loadingLUT = false;

        // Continue to the next requested lut load if we have one
        if(this.#loadNextLut !== null) {
          const next = this.#loadNextLut;
          this.#loadNextLut = null;
          // Possible race conditions here, if only I finished async-synchro
          this.loadLUTFromURL(next);
          return;
        }
      });
  }

  setCanvas(canvas:HTMLCanvasElement) {
    // Clear old canvas info if we need to
    this.#displayCanvas = canvas;
    this.#displayCanvas.width = this.#domWidth;
    this.#displayCanvas.height = this.#domHeight;

    this.#displayCTX = this.#displayCanvas.getContext('2d', {
      alpha: false,
    });
    if(!this.#displayCTX)
      throw new Error(`Unable to get canvas 2D rendering context`);

    console.info('Received and applied new canvas from React');
  }

  handleResize(bounds:DOMRect) {
    this.#domWidth = bounds.width;
    this.#domHeight = bounds.height;
    this.#domAspect = this.#domWidth / this.#domHeight;
  }

  updateVisibility() {
    this.visible = document?.visibilityState === 'visible' ?? false;

    if(this.running && !this.visible) {
      console.info('Visibility changed to hidden, stopping rendering');
      this.stop();
    } else if(!this.running && this.visible) {
      console.info('Visibility resumed to visible, starting rendering again');
      this.load();
    }
  }
}
