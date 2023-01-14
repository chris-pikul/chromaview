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

  // The number of pixels in one dimension of a LUT
  static readonly PIXEL_SIZE:number = 512;

  /**
   * Calculates the coordinate within this LUT's data for the corisponding
   * color given.
   * 
   * @param r Red channel byte
   * @param g Green channel byte
   * @param b Blue channel byte
   * @returns New number of the lut pixel coordinate
   */
  static getCoord(r:number, g: number, b:number):number {
    r = Math.trunc(r / 4);
    g = Math.trunc(g / 4);
    b = Math.trunc(b / 4);

    const x = (b % 8) * 64 + r;
    const y = Math.trunc(b / 8) * 64 + g;

    return (y * 512 + x) * 4;
  }

  data: Uint8ClampedArray;

  constructor() {
    this.processPixel = this.processPixel.bind(this);
    this.processBuffer = this.processBuffer.bind(this);

    this.data = new Uint8ClampedArray(LUT.PIXEL_SIZE * LUT.PIXEL_SIZE * LUT.NUM_BYTES);
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
}
