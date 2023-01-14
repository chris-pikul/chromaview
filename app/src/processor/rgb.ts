
/**
 * RGB channel tuple
 */
export type RGB = [
  number,
  number,
  number,
];

/**
 * Packs RGB into a single integer.
 * 
 * @param r Red channel
 * @param g Green channel
 * @param b Blue channel
 */
export function rgbToInteger(r:number, g:number, b:number):number {
  return (r & 0xFF) << 16 |
    (g & 0xFF) << 8 |
    (b & 0xFF);
}

/**
 * Unpacks an integer into it's RGB components
 * 
 * @param int Color integer
 * @returns RGB tuple
 */
export function integerToRGB(int:number):RGB {
  return [
    (int >> 16) & 0xFF,
    (int >> 8) & 0xFF,
    int & 0xFF,
  ];
}
