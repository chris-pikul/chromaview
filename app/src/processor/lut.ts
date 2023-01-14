import type { RGB } from './rgb';

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
   * Given a R/G/B channel info, find the indice within this LUTs data to get
   * that first resulting byte of the new color.
   * 
   * @param r Red channel byte
   * @param g Green channel byte
   * @param b Blue channel byte
   * @returns New number of the lut pixel coordinate
   */
  static getCoord(r:number, g:number, b:number):number {
    return (r * 255 * 255) + (g * 255) + b;
  }

  /**
   * Given a coordinate from {@link LUT.getCoord} get the resulting RGB that
   * would deliver that initial coordinate.
   * 
   * @param coord Integer coordinate
   * @returns RGB tuple
   */
  static rgbFromCoord(coord:number):RGB {
    return [
      coord / (255 * 255),
      (coord / 255) % 255,
      coord % 255,
    ];
  }

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
  readonly data: Uint8ClampedArray;

  constructor(name:string) {
    this.toString = this.toString.bind(this);
    this.processPixel = this.processPixel.bind(this);
    this.processBuffer = this.processBuffer.bind(this);
    this.setPixel = this.setPixel.bind(this);

    this.name = name;

    // Total data is each available color in each channel
    this.data = new Uint8ClampedArray(255 * 255 * 255);
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
  processPixel(r:number, g:number, b:number):RGB {
    const coord = LUT.getCoord(r, g, b);
    return [
      this.data[coord],
      this.data[coord] + 1,
      this.data[coord] + 2,
    ];
  }

  /**
   * Processes a given array buffer using this LUT.
   * 
   * @param buf Given Uint8ClampedArray buffer
   * @param noAlpha If true, pixels are only 3 bytes instead of the default 4
   */
  processBuffer(buf:Uint8ClampedArray, noAlpha = false):void {
    for(let i = 0; i < buf.byteLength; i += (noAlpha ? 3 : 4)) {
      const coord = LUT.getCoord(buf[i], buf[i + 1], buf[i + 2]);
      buf[i] = this.data[coord];
      buf[i + 1] = this.data[coord + 1];
      buf[i + 2] = this.data[coord + 2];
    }
  }

  protected setPixel(coord:number, r:number, g:number, b:number) {
    this.data[coord] = r;
    this.data[coord + 1] = g;
    this.data[coord + 2] = b;
  }
}
