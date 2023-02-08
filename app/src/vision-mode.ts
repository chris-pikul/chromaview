export type VisionMode = {
  id: string;
  name: string;
  classification: string;
  url: string;
  acuityDegrade?: number;
  summary: string;
  rates: [number, number];
  animal?: boolean;
};

export const VisionModes:Record<string, VisionMode> = {
  achromatomaly: {
    id: 'achromatomaly',
    name: 'Achromatomaly',
    classification: 'Monochromatic',
    summary: 'Weak to all colors',
    url: './LUTs/achromatomaly.lut.png',
    rates: [ 0, 0 ],
  },
  achromatopsia: {
    id: 'achromatopsia',
    name: 'Achromatopsia',
    classification: 'Monochromatic',
    summary: 'Monochromatic vision, devoid of working cone cells',
    url: './LUTs/achromatopsia.lut.png',
    rates: [ 0, 0 ],
  },
  deuteranomaly: {
    id: 'deuteranomaly',
    name: 'Deuteranomaly',
    classification: 'Red/Green',
    summary: 'Weakness in M-opsins resulting in limited greens with some affect on reds',
    url: './LUTs/deuteranomaly.lut.png',
    rates: [ 5, 0.035 ],
  },
  deuteranopia: {
    id: 'deuteranopia',
    name: 'Deuteranopia',
    classification: 'Red/Green',
    summary: 'Devoid of M-opsins resulting in loss of greens with an affect on reds',
    url: './LUTs/deuteranopia.lut.png',
    rates: [ 1.2, 0.01 ],
  },
  protanomaly: {
    id: 'protanomaly',
    name: 'Protanomaly',
    classification: 'Red/Green',
    summary: 'Weakness in L-opsins resulting in limited reds with an affect on greens',
    url: './LUTs/protanomaly.lut.png',
    rates: [ 1.3, 0.02 ],
  },
  protanopia: {
    id: 'protanopia',
    name: 'Protanopia',
    classification: 'Red/Green',
    summary: 'Devoid of L-opsins resulting in loss of reds with severe limit on greens',
    url: './LUTs/protanopia.lut.png',
    rates: [ 1.3, 0.02 ],
  },
  tritanomaly: {
    id: 'tritanomaly',
    name: 'Tritanomaly',
    classification: 'Blue/Yellow',
    summary: 'Weakness in S-opsins resulting in limited blue recognition and affected yellows',
    url: './LUTs/tritanomaly.lut.png',
    rates: [ 0.0001, 0.0001 ],
  },
  tritanopia: {
    id: 'tritanopia',
    name: 'Tritanopia',
    classification: 'Blue/Yellow',
    summary: 'Devoid of S-opsins resulting in no blues with limited yellows',
    url: './LUTs/tritanopia.lut.png',
    rates: [ 0.001, 0.03 ],
  },

  canine: {
    id: 'canine',
    name: 'Canine (Dog)',
    classification: 'Monochromatic',
    summary: '',
    url: './LUTs/animals/canine.lut.png',
    acuityDegrade: 3,
    rates: [ 100, 100 ],
    animal: true,
  },
  feline: {
    id: 'feline',
    name: 'Feline (Cat)',
    classification: 'Monochromatic',
    summary: '',
    url: './LUTs/animals/feline.lut.png',
    acuityDegrade: 2,
    rates: [ 100, 100 ],
    animal: true,
  },
};
export type EVisionMode = keyof typeof VisionModes;
