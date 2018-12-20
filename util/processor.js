/*
    Translated/Redone by Chris Pikul <ChrisPikul510@gmail.com>
    NOTE: Any links to the original source are dead, had to use
    archive.org to find it.

    Original License:

    The Color Blind Simulation function is
    copyright (c) 2000-2001 by Matthew Wickline and the
    Human-Computer Interaction Resource Network ( http://hcirn.com/ ).
    
    It is used with the permission of Matthew Wickline and HCIRN,
    and is freely available for non-commercial use. For commercial use, please
    contact the Human-Computer Interaction Resource Network ( http://hcirn.com/ ).
*/

/**
 * Models enumeration, just matches to the available models for static-ish typing
 */
const Models = {
    NORMAL: 'NORMAL',
    PROTANOPIA: 'PROTANOPIA',
    PROTANOMALY: 'PROTANOMALY',
    DEUTERANOPIA: 'DEUTERANOPIA',
    DEUTERANOMALY: 'DEUTERANOMALY',
    TRITANOPIA: 'TRITANOPIA',
    TRITANOMALY: 'TRITANOMALY',
    ACHROMATOPSIA: 'ACHROMATOPSIA',
    ACHROMATOMALY: 'ACHROMATOMALY',
};

/**
 * Processor class, sets up a model and matrix to start processing input
 * example: 
 * 
 * ```javascript
 *  const proc = new Processor(Models.ACHROMATOPSIA);
 *  const data = [red, green, blue, alpha];
 *  const result = proc.process(data);
 * ```
 * @param {String} model Model option from Models export object (ENUM)
 */
function Processor(model) {
    if(!model) model = Models.NORMAL;
    if(!Models.hasOwnProperty(model))
        throw TypeError("Processor must be constructed with a valid ENUM option from Models");

    this.model = model;
}

Processor.Matrixes = {
    'protan': { 'cpu': 0.735, 'cpv': 0.265, 'am': 1.273463, 'ayi': -0.073894 },
    'deutan': { 'cpu': 1.14, 'cpv': -0.14, 'am': 0.968437, 'ayi': 0.003331 },
    'tritan': { 'cpu': 0.171, 'cpv': -0.003, 'am': 0.062921, 'ayi': 0.292119 },
}

Processor._RGB2XYZ = function(rgb) {
    return {
        x: (0.430574 * rgb.r + 0.341550 * rgb.g + 0.178325 * rgb.b),
        y: (0.222015 * rgb.r + 0.706655 * rgb.g + 0.071330 * rgb.b),
        z: (0.020183 * rgb.r + 0.129553 * rgb.g + 0.939180 * rgb.b),
    };
}

Processor._XYZ2RGB = function(xyz) {
    return {
        r: (3.063218 * xyz.x - 1.393325 * xyz.y - 0.475802 * xyz.z),
        g: (-0.969243 * xyz.x + 1.875966 * xyz.y + 0.041555 * xyz.z),
        b: (0.067871 * xyz.x - 0.228834 * xyz.y + 1.069251 * xyz.z),
    };
}

Processor.Monochrome = function(rgb) {
    const g = Math.round(rgb[0]*0.299 + rgb[1]*0.587 + rgb[2]*0.114);
    return [g, g, g];
}

Processor._Anomylize = function(a, b) {
    const val = 1.75;
    const dt = val * 1 + 1;
    return [
        (val*b[0] + a[0] * 1) / dt,
        (val*b[1] + a[1] * 1) / dt,
        (val*b[2] + a[2] * 1) / dt,
    ];
}

Processor._Blind = function(inp, mat) {
    const gamma = 2.2,
        wx = 0.312713,
        wy = 0.329016,
        wz = 0.358271;

    const clr = {
        r: Math.pow(inp[0] / 255, gamma),
        g: Math.pow(inp[1] / 255, gamma),
        b: Math.pow(inp[2] / 255, gamma),
    };

    const xyz = Processor._RGB2XYZ(clr);

    const sumXYZ = xyz.x + xyz.y + xyz.z;
    xyz.u = 0.0;
    xyz.v = 0.0;

    if(sumXYZ != 0) {
        xyz.u = xyz.x / sumXYZ;
        xyz.v = xyz.y / sumXYZ;
    }

    
    const clm = xyz.u < mat.cpu ? 
        (mat.cpv - xyz.v) / (mat.cpu  - xyz.u) 
        : (xyz.v - mat.cpv) / (xyz.y - mat.cpu);

    const clyi = xyz.v - xyz.u * clm;
    const t = {x:0, y:0, z:0, u:0, v:0};
    t.u = (mat.ayi - clyi) / (clm - mat.am);
    t.v = (clm * t.u) + clyi;

    const s = {x:0, y:0, z:0, u:0, v:0};
    s.x = t.u * xyz.y / t.v;
    s.y = xyz.y;
    s.z = (1- (t.u + t.v)) * xyz.y / t.v;
    const sRGB = Processor._XYZ2RGB(s);

    
    const nx = wx * xyz.y / wy,
        nz = wz * xyz.y / wy;
    t.x = nx - s.x;
    t.z = nz - s.z;
    const tRGB = Processor._XYZ2RGB(t);
    

    const adjR = tRGB.r ? ((sRGB.r < 0 ? 0 : 1) - sRGB.r) / tRGB.r : 0,
        adjG = tRGB.r ? ((sRGB.g < 0 ? 0 : 1) - sRGB.g) / tRGB.g : 0,
        adjB = tRGB.r ? ((sRGB.b < 0 ? 0 : 1) - sRGB.b) / tRGB.b : 0;
    
    const adj = Math.max(
        ((adjR > 1 || adjR < 0) ? 0 : adjR),
        ((adjG > 1 || adjG < 0) ? 0 : adjG),
        ((adjB > 1 || adjB < 0) ? 0 : adjB)
    );

    sRGB.r = sRGB.r + (adj * tRGB.r);
    sRGB.g = sRGB.g + (adj * tRGB.g);
    sRGB.b = sRGB.b + (adj * tRGB.b);

    const invGamma = 1/gamma;
    const norm = inp => (255 * (inp <= 0 ? 0 : inp >= 1 ? 1 : Math.pow(inp, invGamma)));

    return [
        norm(sRGB.r),
        norm(sRGB.g),
        norm(sRGB.b),
    ];
}

/**
 * Takes the input array (in form of [r,g,b,a?]) and returns the same
 * length array with the values modified to the model set
 * in the object
 * 
 * @param {Array} input Input pixels [r,g,b]
 * @param returns Array of same length, modified to the current model
 */
Processor.prototype.process = function(input) {
    switch(this.model) {
        case Models.PROTANOPIA: 
            return Processor._Blind(input, Processor.Matrixes['protan']);
        case Models.PROTANOMALY: 
            return Processor._Anomylize(input, Processor._Blind(input, Processor.Matrixes['protan']));
        case Models.DEUTERANOPIA:
            return Processor._Blind(input, Processor.Matrixes['deutan']);
        case Models.DEUTERANOMALY:
            return Processor._Anomylize(input, Processor._Blind(input, Processor.Matrixes['deutan']));
        case Models.TRITANOPIA: 
            return Processor._Blind(input, Processor.Matrixes['tritan']);
        case Models.TRITANOMALY: 
            return Processor._Anomylize(input, Processor._Blind(input, Processor.Matrixes['tritan']));
        case Models.ACHROMATOPSIA: 
            return Processor.Monochrome(input);
        case Models.ACHROMATOMALY:
            return Processor._Anomylize(input, Processor.Monochrome(input));
        default:
            return input;
    }
};

module.exports = {
    Processor,
    Models,
};