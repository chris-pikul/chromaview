export type VisionMode = {
  name: string;
  url: string;
  acuityDegrade?: number;
};

export const VisionModes:Record<string, VisionMode> = {
  achromatomaly: {
    name: 'Achromatomaly',
    url: '/LUTs/achromatomaly.lut.png'
  },
  achromatopsia: {
    name: 'Achromatopsia',
    url: '/LUTs/achromatopsia.lut.png'
  },
  deuteranomaly: {
    name: 'Deuteranomaly',
    url: '/LUTs/deuteranomaly.lut.png'
  },
  deuteranopia: {
    name: 'Deuteranopia',
    url: '/LUTs/deuteranopia.lut.png'
  },
  protanomaly: {
    name: 'Protanomaly',
    url: '/LUTs/protanomaly.lut.png'
  },
  protanopia: {
    name: 'Protanopia',
    url: '/LUTs/protanopia.lut.png'
  },
  tritanomaly: {
    name: 'Tritanomaly',
    url: '/LUTs/tritanomaly.lut.png'
  },
  tritanopia: {
    name: 'Tritanopia',
    url: '/LUTs/tritanopia.lut.png'
  },

  canine: {
    name: 'Canine (Dog)',
    url: '/LUTs/animals/canine.lut.png',
    acuityDegrade: 3,
  },
  feline: {
    name: 'Feline (Cat)',
    url: '/LUTs/animals/feline.lut.png',
    acuityDegrade: 2,
  },
};
export type EVisionMode = keyof typeof VisionModes;
