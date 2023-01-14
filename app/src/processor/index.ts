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

const requestAnimFrame:((cb:FrameRequestCallback) => number) = (() => {
  if(window && 'requestAnimationFrame' in window)
    return window.requestAnimationFrame;
  return (cb:Function) => setTimeout(cb, 1);
})();

export default class Processor {
  loading:boolean = false;
  requested:boolean = false;
  permitted:boolean = false;
  trackSettings:(MediaTrackSettings|null) = null;

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
  #domWidth = 320;
  #domHeight = 240;

  constructor() {
    this.load = this.load.bind(this);
    this.checkAlreadyPermitted = this.checkAlreadyPermitted.bind(this);
    this.start = this.start.bind(this);
    this.process = this.process.bind(this);
    this.render = this.render.bind(this);
    this.setCanvas = this.setCanvas.bind(this);
    this.handleResize = this.handleResize.bind(this);

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
    if(this.loading || this.requested || this.#stream) return;

    // Only work if mediaDevices is supported in browser
    if(navigator && 'mediaDevices' in navigator) {
      // Catch race conditions and React's strict mode
      this.loading = true;
      console.log('Requesting camera permission...');

      // Ask for a camera stream
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
      }).then(stream => {
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
    requestAnimFrame(this.render);
  }

  process() {
    if(this.#video && this.#bufferCanvas && this.#bufferCTX) {
      this.#bufferCanvas.width = this.#videoWidth;
      this.#bufferCanvas.height = this.#videoHeight;
      
      this.#bufferCTX.drawImage(this.#video, 0, 0, this.#videoWidth, this.#videoHeight);

      // Dummy manipulate
      const frame = this.#bufferCTX.getImageData(0, 0, this.#videoWidth, this.#videoHeight);
      const { data } = frame;
      for(let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];

        data[i] = green;
        data[i + 1] = blue;
        data[i + 2] = red;
      }
      this.#bufferCTX.putImageData(frame, 0, 0);
    }
  }

  render() {
    this.process();

    if(this.#displayCanvas && this.#displayCTX) {
      this.#displayCanvas.width = this.#domWidth;
      this.#displayCanvas.height = this.#domHeight;

      // Copy the buffer and up-scale it to the display
      if(this.#bufferCanvas)
        this.#displayCTX.drawImage(this.#bufferCanvas, 0, 0, this.#domWidth, this.#domHeight);

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

  setCanvas(canvas:HTMLCanvasElement) {
    // Clear old canvas info if we need to
    this.#displayCanvas = canvas;
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

    console.info('Received new bounding size from React', bounds);
  }
}
