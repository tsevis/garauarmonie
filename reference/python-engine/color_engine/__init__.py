# Garau Transparency Studio - Color Engine Package
"""
Color Engine Module

Implements the core mathematical model for perceptual color transparency
based on Metelli's equations extended to RGB space and Garau's visual
mixture theory.
"""

from .color_types import RGB, HSL, LCH, NormalizedRGB, TransparencyConfig
from .conversions import (
    rgb_to_normalized, normalized_to_rgb,
    rgb_to_hsl, hsl_to_rgb,
    rgb_to_lch, lch_to_rgb,
    rgb_to_lab, lab_to_rgb
)
from .metelli import (
    compute_forward, compute_inverse, compute_designer,
    MetelliResult
)
from .visual_mixture import (
    analyze_visual_mixture, GarauMixture,
    classify_juxtaposition, JuxtapositionType, JuxtapositionAnalysis
)
from .validation import (
    validate_transparency, ValidationReport,
    check_metelli_conditions, check_garau_conditions
)
from .engine import GarauColorEngine, get_engine

__all__ = [
    # Types
    'RGB', 'HSL', 'LCH', 'NormalizedRGB', 'TransparencyConfig',
    
    # Conversions
    'rgb_to_normalized', 'normalized_to_rgb',
    'rgb_to_hsl', 'hsl_to_rgb',
    'rgb_to_lch', 'lch_to_rgb',
    'rgb_to_lab', 'lab_to_rgb',
    
    # Metelli computations
    'compute_forward', 'compute_inverse', 'compute_designer',
    'MetelliResult',
    
    # Visual mixture analysis
    'analyze_visual_mixture', 'GarauMixture',
    'classify_juxtaposition', 'JuxtapositionType', 'JuxtapositionAnalysis',
    
    # Validation
    'validate_transparency', 'ValidationReport',
    'check_metelli_conditions', 'check_garau_conditions',
    
    # Main engine
    'GarauColorEngine', 'get_engine',
]
