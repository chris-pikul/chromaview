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
  #canvas:(HTMLCanvasElement|null) = null;
  #ctx:(CanvasRenderingContext2D|null) = null;

  #videoWidth = 320;
  #videoHeight = 240;
  #domWidth = 320;
  #domHeight = 240;

  constructor() {
    this.load = this.load.bind(this);
    this.checkAlreadyPermitted = this.checkAlreadyPermitted.bind(this);
    this.start = this.start.bind(this);
    this.render = this.render.bind(this);
    this.setCanvas = this.setCanvas.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.#video = document.createElement('video');
    this.#video.width = this.#videoWidth = 320;
    this.#video.height = this.#videoHeight = 320;

    console.log('Constructed checking if already permitted...');
    this.checkAlreadyPermitted();
  }

  checkAlreadyPermitted():void {
    console.log('Checking if camera is already permitted');

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
      this.permitted = false;
    }
  }

  load() {
    console.info('Checking if load allowed', this.loading);

    // Shortcut if already trying to load
    if(this.loading) return;

    // Only work if mediaDevices is supported in browser
    if(navigator && 'mediaDevices' in navigator) {
      // Catch race conditions and React's strict mode
      this.loading = true;
      console.log('Requesting camera permission');

      // Ask for a camera stream
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
      }).then(stream => {
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
        console.log('Finished loading sequence');
      });
    }
  }

  start() {
    console.log('Start called on Processor');
    this.lastTime = Date.now();
    requestAnimFrame(this.render);
  }

  render() {
    if(this.#canvas && this.#ctx && this.#video && this.#stream) {
      this.#canvas.width = this.#domWidth;
      this.#canvas.height = this.#domHeight;
      this.#ctx.drawImage(this.#video, 0, 0, this.#domWidth, this.#domHeight);

      // Dummy manipulate
      const frame = this.#ctx.getImageData(0, 0, this.#domWidth, this.#domHeight);
      const { data } = frame;
      for(let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];

        data[i] = green;
        data[i + 1] = blue;
        data[i + 2] = red;
      }
      this.#ctx.putImageData(frame, 0, 0);

      // Draw the FPS clock
      this.#ctx.font = '10px Arial';
      this.#ctx.fillStyle = 'white';
      this.#ctx.fillText(`${this.fpsCount.toString().padStart(3, ' ')}FPS | Δ${this.deltaTime.toPrecision(2).padStart(4, ' ')}/ms`, 5, 15);
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
    this.#canvas = canvas;
    this.#ctx = this.#canvas.getContext('2d', {
      alpha: false,
      willReadFrequently: true,
    });
    if(!this.#ctx)
      throw new Error(`Unable to get canvas 2D rendering context`);

    console.log('Applied new canvas element');
  }

  handleResize(bounds:DOMRect) {
    this.#domWidth = bounds.width;
    this.#domHeight = bounds.height;
  }
}
