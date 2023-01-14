import LUT from './lut';

export default class NormalLUT extends LUT {
  constructor() {
    super('Normal');

    // Pre-calculate the entries for this lut
    for(let r=0; r < 256; r++)
      for(let g=0; g < 256; g++)
        for(let b=0; b < 256; b++)
          this.setPixel(LUT.getCoord(r, g, b), r, g, b);
  }
}
