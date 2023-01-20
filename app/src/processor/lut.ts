import { integerToRGB, RGB, rgbToInteger } from './rgb';

/**
 * LUT is a Look-up-table image.
 * 
 * This class/object represents a singular image data loaded in to help process
 * frames of data.
 */
export default class LUT {
  // The number of bytes/channels in a pixel, we drop the alpha 
  static readonly NUM_BYTES:number = 3;

  // The number of pixels in one dimension of a Image LUT
  static readonly PIXEL_SIZE:number = 512;

  /**
   * Calculates the coordinate within a given 3D image LUT as if it was a
   * single-depth array.
   * 
   * @param r Red channel byte
   * @param g Green channel byte
   * @param b Blue channel byte
   * @returns New number of the image LUT coordinate
   */
  static getImageCoord(r:number, g: number, b:number):number {
    r = Math.trunc(r / 4);
    g = Math.trunc(g / 4);
    b = Math.trunc(b / 4);

    const x = (b % 8) * 64 + r;
    const y = Math.trunc(b / 8) * 64 + g;

    return (y * 512 + x) * 4;
  }

  /**
   * Given name for this LUT
   */
  readonly name: string;

  /**
   * Bytes of color information. Represented as 3-byte groupings mapping to
   * Red, Green, and Blue.
   */
  readonly data: Uint32Array;

  constructor(name:string = 'normal') {
    this.toString = this.toString.bind(this);
    this.process = this.process.bind(this);
    this.processBuffer = this.processBuffer.bind(this);
    this.setPixel = this.setPixel.bind(this);

    this.name = name;

    // Total data is each available color in each channel
    this.data = new Uint32Array(0xFFFFFF + 1);
    for(let i=0; i < this.data.length; i++)
      this.data[i] = i;
  }

  toString():string {
    return this.name;
  }

  /**
   * Processes a given pixel using this LUT.
   * 
   * @param r Red channel byte
   * @param g Green channel byte
   * @param b Blue channel byte
   * @returns New RGB tuple of the resulting colors
   */
  process(r:number, g:number, b:number):RGB {
    if(r === 255 && g === 255 && b === 255)
      return [255, 255, 255];
    
    const int = rgbToInteger(r, g, b);
    const result = this.data[int];

    return integerToRGB(result);
  }

  /**
   * Processes a given array buffer using this LUT.
   * 
   * @param buf Given Uint8ClampedArray buffer
   * @param noAlpha If true, pixels are only 3 bytes instead of the default 4
   */
  processBuffer(buf:Uint8ClampedArray, noAlpha = false):void {
    for(let i = 0; i < buf.length; i += (noAlpha ? 3 : 4)) {
      const int = rgbToInteger(buf[i], buf[i+1], buf[i+2]);

      const result = this.data[int];

      buf[i] = (result >> 16) & 0xFF;
      buf[i + 1] = (result >> 8) & 0xFF;
      buf[i + 2] = result & 0xFF;
    }
  }

  protected setPixel(inR:number, inG:number, inB:number, outR:number, outG:number, outB:number) {
    const coord = rgbToInteger(inR, inG, inB);
    this.data[coord] = outR;
    this.data[coord + 1] = outG;
    this.data[coord + 2] = outB;

    if((coord + 2) >= this.data.length)
      throw new Error(`Coordinate ${coord} is out of range for this LUT data array`);
  }

  public static loadLUTImage(imgURL:(string|URL)):Promise<LUT> {
    return new Promise((resolve, reject) => {
      let url:URL, img:HTMLImageElement;
      try {
        url = new URL(imgURL, window.location.origin);
        img = new Image();
        img.src = url.toString();

        console.log(`Loading LUT image from "${img.src}"...`);
      } catch(err) {
        reject(err);
        return;
      }
      img.onload = () => {
        console.log(`Loaded LUT image from "${img.src}"`);

        // Make dummy canvas to steal the data
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if(!ctx)
          return reject(new Error(`cannot get context of canvas`));

        ctx.drawImage(img, 0, 0);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        // Pass on to the load from image data method
        LUT.fromImageData(url.pathname, data)
          .then(resolve)
          .catch(reject);
      };

      img.onabort = reject;
      img.onerror = reject;
    });
  }

  public static fromImageData(name:string, buf:Uint8ClampedArray):Promise<LUT> {
    return new Promise((resolve) => {
      // My figure is that LUTS are always 64x64 blocks to make them up.
      const lut = new LUT(name);

      for(let i=0; i < lut.data.length; i++) {
        const [ inR, inG, inB ] = integerToRGB(i);

        const imgCoord = LUT.getImageCoord(inR, inG, inB);
        const outR = buf[imgCoord];
        const outG = buf[imgCoord + 1];
        const outB = buf[imgCoord + 2];

        lut.data[i] = rgbToInteger(outR, outG, outB); 
      }

      resolve(lut);
    });
  }
}
