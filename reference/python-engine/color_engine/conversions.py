# Garau Transparency Studio - Color Conversions
"""
Color space conversion functions.

Optimized for M1 Ultra using numpy vectorization where possible.
Uses perceptually uniform spaces (LCH/Lab) for Garau's visual mixture logic.
"""

import numpy as np
from typing import Tuple
from .color_types import RGB, HSL, LCH, NormalizedRGB


def rgb_to_normalized(rgb: RGB) -> NormalizedRGB:
    """Convert 0-255 RGB to 0-1 normalized RGB."""
    return NormalizedRGB(
        r=rgb.r / 255.0,
        g=rgb.g / 255.0,
        b=rgb.b / 255.0
    )


def normalized_to_rgb(normalized: NormalizedRGB) -> RGB:
    """Convert 0-1 normalized RGB to 0-255 RGB."""
    return RGB(
        r=round(normalized.r * 255),
        g=round(normalized.g * 255),
        b=round(normalized.b * 255)
    )


def rgb_to_hsl(rgb: RGB) -> HSL:
    """
    Convert RGB to HSL color space.
    
    Args:
        rgb: RGB color with 0-255 values
        
    Returns:
        HSL with h: 0-360, s: 0-100, l: 0-100
    """
    r, g, b = rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0
    
    max_c = max(r, g, b)
    min_c = min(r, g, b)
    l = (max_c + min_c) / 2.0
    
    if max_c == min_c:
        h = s = 0.0
    else:
        d = max_c - min_c
        s = d / (2.0 - max_c - min_c) if l > 0.5 else d / (max_c + min_c)
        
        if max_c == r:
            h = (g - b) / d + (6.0 if g < b else 0.0)
        elif max_c == g:
            h = (b - r) / d + 2.0
        else:
            h = (r - g) / d + 4.0
        
        h /= 6.0
    
    return HSL(h=h * 360.0, s=s * 100.0, l=l * 100.0)


def hsl_to_rgb(hsl: HSL) -> RGB:
    """
    Convert HSL to RGB color space.
    
    Args:
        hsl: HSL with h: 0-360, s: 0-100, l: 0-100
        
    Returns:
        RGB with 0-255 values
    """
    h, s, l = hsl.h / 360.0, hsl.s / 100.0, hsl.l / 100.0
    
    if s == 0:
        r = g = b = l
    else:
        def hue_to_rgb(p, q, t):
            if t < 0: t += 1
            if t > 1: t -= 1
            if t < 1/6: return p + (q - p) * 6 * t
            if t < 1/2: return q
            if t < 2/3: return p + (q - p) * (2/3 - t) * 6
            return p
        
        q = l * (1 + s) if l < 0.5 else l + s - l * s
        p = 2 * l - q
        r = hue_to_rgb(p, q, h + 1/3)
        g = hue_to_rgb(p, q, h)
        b = hue_to_rgb(p, q, h - 1/3)
    
    return RGB(
        r=round(r * 255),
        g=round(g * 255),
        b=round(b * 255)
    )


def rgb_to_lab(rgb: RGB) -> Tuple[float, float, float]:
    """
    Convert RGB to CIE Lab color space.
    Uses D65 illuminant and sRGB color space.
    
    Args:
        rgb: RGB color with 0-255 values
        
    Returns:
        Lab tuple (L: 0-100, a: -128 to 127, b: -128 to 127)
    """
    # First convert to linear RGB
    r, g, b = rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0
    
    # Apply gamma correction (sRGB to linear)
    def gamma_correct(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    
    r, g, b = gamma_correct(r), gamma_correct(g), gamma_correct(b)
    
    # Convert to XYZ (D65 illuminant)
    x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
    y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750
    z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041
    
    # Reference white D65
    xn, yn, zn = 0.95047, 1.0, 1.08883
    
    def f(t):
        return t ** (1/3) if t > 0.008856 else (7.787 * t) + (16 / 116)
    
    L = (116 * f(y / yn)) - 16
    a = 500 * (f(x / xn) - f(y / yn))
    b_val = 200 * (f(y / yn) - f(z / zn))
    
    return (max(0, L), a, b_val)


def lab_to_rgb(lab: Tuple[float, float, float]) -> RGB:
    """
    Convert CIE Lab to RGB color space.
    
    Args:
        lab: Lab tuple (L: 0-100, a: -128 to 127, b: -128 to 127)
        
    Returns:
        RGB with 0-255 values
    """
    L, a, b_val = lab
    
    # Reference white D65
    yn = 1.0
    xn = 0.95047
    zn = 1.08883
    
    def f_inv(t):
        return t ** 3 if t > 0.20689303442296383 else (t - 16/116) / 7.787
    
    fy = (L + 16) / 116
    fx = fy + a / 500
    fz = fy - b_val / 200
    
    x = xn * f_inv(fx)
    y = yn * f_inv(fy)
    z = zn * f_inv(fz)
    
    # Convert to linear RGB
    r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314
    g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560
    b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252
    
    # Apply gamma correction (linear to sRGB)
    def gamma_inverse(c):
        return 12.92 * c if c <= 0.0031308 else (1.055 * (c ** (1/2.4))) - 0.055
    
    r = max(0, min(1, gamma_inverse(r)))
    g = max(0, min(1, gamma_inverse(g)))
    b = max(0, min(1, gamma_inverse(b)))
    
    return RGB(
        r=round(r * 255),
        g=round(g * 255),
        b=round(b * 255)
    )


def rgb_to_lch(rgb: RGB) -> LCH:
    """
    Convert RGB to LCH (Lightness, Chroma, Hue) color space.
    LCH is perceptually uniform - crucial for Garau's visual mixture analysis.
    
    Args:
        rgb: RGB color with 0-255 values
        
    Returns:
        LCH with l: 0-100, c: 0-100+, h: 0-360
    """
    L, a, b_val = rgb_to_lab(rgb)
    
    # Convert from Cartesian (a, b) to polar (c, h)
    c = np.sqrt(a ** 2 + b_val ** 2)
    h = np.degrees(np.arctan2(b_val, a))
    h = h % 360  # Normalize to 0-360
    
    return LCH(l=L, c=c, h=h)


def lch_to_rgb(lch: LCH) -> RGB:
    """
    Convert LCH to RGB color space.
    
    Args:
        lch: LCH with l: 0-100, c: 0-100+, h: 0-360
        
    Returns:
        RGB with 0-255 values
    """
    # Convert from polar (c, h) to Cartesian (a, b)
    h_rad = np.radians(lch.h)
    a = lch.c * np.cos(h_rad)
    b_val = lch.c * np.sin(h_rad)
    
    return lab_to_rgb((lch.l, a, b_val))


def rgb_to_hex(rgb: RGB) -> str:
    """Convert RGB to hex string."""
    return rgb.to_hex()


def hex_to_rgb(hex_str: str) -> RGB:
    """Convert hex string to RGB."""
    return RGB.from_hex(hex_str)


def interpolate_rgb(c1: RGB, c2: RGB, t: float) -> RGB:
    """
    Interpolate between two RGB colors in perceptual space (LCH).
    
    Args:
        c1: Start color
        c2: End color
        t: Interpolation factor (0-1)
        
    Returns:
        Interpolated RGB color
    """
    lch1 = rgb_to_lch(c1)
    lch2 = rgb_to_lch(c2)
    
    # Interpolate in LCH space for perceptually uniform results
    l = lch1.l + t * (lch2.l - lch1.l)
    c = lch1.c + t * (lch2.c - lch1.c)
    
    # Handle hue interpolation (take shortest path)
    h1, h2 = lch1.h, lch2.h
    dh = h2 - h1
    if dh > 180:
        dh -= 360
    elif dh < -180:
        dh += 360
    h = (h1 + t * dh) % 360
    
    return lch_to_rgb(LCH(l=l, c=c, h=h))


def get_luminance(rgb: RGB) -> float:
    """
    Calculate relative luminance (perceived brightness).
    Uses ITU-R BT.709 coefficients.
    
    Args:
        rgb: RGB color
        
    Returns:
        Luminance value 0-1
    """
    r, g, b = rgb.r / 255.0, rgb.g / 255.0, rgb.b / 255.0
    
    # Apply gamma correction
    def linearize(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    
    r, g, b = linearize(r), linearize(g), linearize(b)
    
    # ITU-R BT.709 luminance coefficients
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def get_contrast_ratio(c1: RGB, c2: RGB) -> float:
    """
    Calculate WCAG contrast ratio between two colors.
    
    Args:
        c1: First color
        c2: Second color
        
    Returns:
        Contrast ratio (1:1 to 21:1)
    """
    L1 = get_luminance(c1)
    L2 = get_luminance(c2)
    
    lighter = max(L1, L2)
    darker = min(L1, L2)
    
    return (lighter + 0.05) / (darker + 0.05)
