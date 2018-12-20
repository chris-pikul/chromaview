#![allow(unused_assignments)]

use std::mem;
use std::slice;
use std::vec::Vec;
use std::os::raw::c_void;

#[repr(u8)]
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Mode {
    Normal,
    Protanopia,
    Protanomaly,
    Deuteranopia,
    Deuteranomaly,
    Tritanopia,
    Tritanomaly,
    Achromatopsia,
    Achromatomaly,
}

#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut c_void {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    mem::forget(buf);
    return ptr as *mut c_void;
}

#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut c_void, cap: usize) {
    unsafe {
        let _buf = Vec::from_raw_parts(ptr, 0, cap);
    }
}

#[no_mangle]
pub extern "C" fn process(ptr: *mut u8, width: usize, height: usize, mode: Mode) {
    let bs = width * height * 4;
    let buf = unsafe { slice::from_raw_parts_mut(ptr, bs) };

    if mode == Mode::Normal {
        return;
    } else if mode == Mode::Achromatopsia || mode == Mode::Achromatomaly {
        let anom = mode == Mode::Achromatomaly;
        for x in 0..width {
            for y in 0..height {
                let i = coord(x,y,width);
                
                let mut pix = Pixel::new(buf[i], buf[i+1], buf[i+2]);
                process_clr_achroma(&mut pix, anom);

                buf[ i ] = pix.r as u8;
                buf[ i+1 ] = pix.g as u8;
                buf[ i+2 ] = pix.b as u8;
                buf[ i+3 ] = 255; //Alpha channel
            }
        }
        return;
    }

    let model = match mode {
        Mode::Protanopia => Box::new(PROTAN),
        Mode::Protanomaly => Box::new(PROTAN),
        Mode::Deuteranopia => Box::new(DEUTAN),
        Mode::Deuteranomaly => Box::new(DEUTAN),
        Mode::Tritanopia => Box::new(TRITAN),
        Mode::Tritanomaly => Box::new(TRITAN),
        _ => Box::new(PROTAN)
    };

    let anom = match mode {
        Mode::Protanomaly => true,
        Mode::Deuteranomaly => true,
        Mode::Tritanomaly => true,
        Mode::Achromatomaly => true,
        _ => false
    };

    for x in 0..width {
        for y in 0..height {
            let i = coord(x,y,width);
            
            let mut pix = Pixel::new(buf[i], buf[i+1], buf[i+2]);
            process_clr(&mut pix, &model, anom);

            buf[ i ] = pix.r as u8;
            buf[ i+1 ] = pix.g as u8;
            buf[ i+2 ] = pix.b as u8;
            buf[ i+3 ] = 255; //Alpha channel
        }
    }
}

fn coord(x: usize, y: usize, width: usize) -> usize {
    width * 4 * y + 4 * x
}

const GAMMA:f32 = 2.2;
const INV_GAMMA:f32 = 0.4545454545;
const WX: f32 = 0.312713;
const WY: f32 = 0.329016;
const WZ: f32 = 0.358271;

fn process_clr(inp: &mut Pixel, model: &Box<Matrix>, anom: bool) {
    let mut clr = Pixel::to_xyz( Pixel{
        r: (inp.r / 255.0).powf(GAMMA),
        g: (inp.g / 255.0).powf(GAMMA),
        b: (inp.b / 255.0).powf(GAMMA),
        u: 0.0,
        v: 0.0,
    });

    let clr_sum = clr.r + clr.g + clr.b;
    if clr_sum != 0.0 {
        clr.u = clr.r / clr_sum;
        clr.v = clr.g / clr_sum;
    }

    let clm = if clr.u < model.cpu { 
        (model.cpv - clr.v) / (model.cpu - clr.u) 
    } else { 
        (clr.v - model.cpv) / (clr.g - model.cpu) 
    };

    let clyi = clr.v - clr.u * clm;
    let mut t = Pixel{
        r: 0.0,
        g: 0.0,
        b: 0.0,
        u: (model.ayi - clyi) / (clm - model.am),
        v: 0.0,
    };
    t.v = (clm * t.u) + clyi;

    let s = Pixel{
        r: t.u * clr.g / t.v,
        g: clr.g,
        b: (1.0-(t.u + t.v)) * clr.g / t.v,
        u: 0.0,
        v: 0.0,
    };

    t.r = (WX * clr.g / WY) - s.r;
    t.b = (WZ * clr.g / WY) - s.b;
    let rat = Pixel::to_rgb(t);

    let mut res = Pixel::to_rgb(s);

    //Adjustments
    let mut adj_r = 0.0;
    let mut adj_g = 0.0;
    let mut adj_b = 0.0;
    
    if rat.r > 0.0 {
        adj_r = if res.r < 0.0 { 0.0 } else { 1.0 };
        adj_r = (adj_r - res.r) / rat.r;
    }

    if rat.g > 0.0 {
        adj_g = if res.g < 0.0 { 0.0 } else { 1.0 };
        adj_g = (adj_g - res.g) / rat.g;
    }

    if rat.b > 0.0 {
        adj_b = if res.r < 0.0 { 0.0 } else { 1.0 };
        adj_b = (adj_b - res.b) / rat.b;
    }

    let adj_a = if adj_r > 1.0 || adj_r < 0.0 { 0.0 } else { adj_r };
    let adj_b = if adj_g > 1.0 || adj_r < 0.0 { 0.0 } else { adj_g };
    let adj_c = if adj_b > 1.0 || adj_r < 0.0 { 0.0 } else { adj_b };

    let adj = adj_a.max(adj_b).max(adj_c);

    res.r = res.r + (adj * rat.r);
    res.g = res.g + (adj * rat.g);
    res.b = res.b + (adj * rat.b);
    res.norm();

    if anom {
        inp.r = (1.75 * res.r + inp.r) / 2.75;
        inp.g = (1.75 * res.g + inp.g) / 2.75;
        inp.b = (1.75 * res.b + inp.b) / 2.75;
    } else {
        inp.r = res.r;
        inp.g = res.g;
        inp.b = res.b;
    }
}

fn process_clr_achroma(inp: &mut Pixel, anom: bool) {
    let s = (inp.r * 0.299) + (inp.g * 0.587) + (inp.b * 0.114);
    let res = Pixel {
        r: s,
        g: s,
        b: s,
        u: 0.0,
        v: 0.0,
    };

    if anom {
        inp.r = (1.75 * res.r + inp.r) / 2.75;
        inp.g = (1.75 * res.g + inp.g) / 2.75;
        inp.b = (1.75 * res.b + inp.b) / 2.75;
    } else {
        inp.r = res.r;
        inp.g = res.g;
        inp.b = res.b;
    }
}

struct Pixel{
    r: f32,
    g: f32,
    b: f32,

    u: f32,
    v: f32,
}
impl Pixel {
    pub fn new(r: u8, g: u8, b: u8) -> Pixel {
        Pixel{
            r: r as f32, 
            g: g as f32,
            b: b as f32,
            u: 0.0,
            v: 0.0,
        }
    }

    pub fn to_xyz(rgb: Pixel) -> Pixel {
        Pixel{
            r: (0.430574 * rgb.r + 0.341550 * rgb.g + 0.178325 * rgb.b),
            g: (0.222015 * rgb.r + 0.706655 * rgb.g + 0.071330 * rgb.b),
            b: (0.020183 * rgb.r + 0.129553 * rgb.g + 0.939180 * rgb.b),
            u: 0.0,
            v: 0.0,
        }
    }

    pub fn to_rgb(xyz: Pixel) -> Pixel {
        Pixel{
            r : (3.063218 * xyz.r - 1.393325 * xyz.g - 0.475802 * xyz.b),
            g: (-0.969243 * xyz.r + 1.875966 * xyz.g + 0.041555 * xyz.b),
            b: (0.067871 * xyz.r - 0.228834 * xyz.g + 1.069251 * xyz.b),
            u: 0.0,
            v: 0.0,
        }
    }

    pub fn norm(&mut self) {
        self.r = normf(self.r);
        self.g = normf(self.g);
        self.b = normf(self.b);
    }
}

fn normf(v: f32) -> f32 {
    let a = if v <= 0.0 { 
        0.0
    } else if v >= 1.0 { 
        1.0
    } else { 
        v.powf(INV_GAMMA)
    };
    255.0 * a
}

struct Matrix {
    cpu: f32,
    cpv: f32,
    am: f32,
    ayi: f32,
}

const PROTAN: Matrix = Matrix{
    cpu: 0.735,
    cpv: 0.265,
    am: 1.273463,
    ayi: -0.073894,
};

const DEUTAN: Matrix = Matrix{
    cpu: 1.14,
    cpv: -0.14,
    am: 0.968437,
    ayi: 0.003331,
};

const TRITAN: Matrix = Matrix{
    cpu: 0.171,
    cpv: -0.003,
    am: 0.062921,
    ayi: 0.292119,
};