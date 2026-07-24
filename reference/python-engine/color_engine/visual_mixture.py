# Garau Transparency Studio - Visual Mixture Analysis
"""
Visual Mixture System based on Garau's central thesis.

Garau's thesis: transparency perception depends on VISUAL chromatic mixtures,
not physical ones. A color is a "visual mixture" if it appears to contain
two or more primary components to the average observer.

The app implements a Visual Mixture Analyzer that, for any RGB color:
1. Converts to perceptual hue space (HSL/LCH)
2. Identifies the dominant primary component (R, Y, or B — Garau's three fundamentals)
3. Identifies the subordinate component(s)
4. Classifies the mixture ratio: dominant (2:1), balanced (1:1), or subordinate (1:2)
5. Labels the color in Garau's notation: e.g., "reddish Yellow (rY)"

This extends beyond the 12-color wheel by treating the hue circle as continuous
and computing mixture ratios proportionally from any hue angle.
"""

import numpy as np
from typing import Tuple, Optional
from .color_types import (
    RGB, GarauMixture, DominantPrimary,
    JuxtapositionType, JuxtapositionAnalysis
)
from .conversions import rgb_to_hsl, rgb_to_lch


# Hue sector boundaries for Garau's three-primary system
# Extended to continuous hue circle (0-360 degrees)
# 
# Red zone: 0°-60° and 300°-360° (wraps around)
# Yellow zone: 60°-180°
# Blue zone: 180°-300°
#
# Within each 60° sector, the dominant/subordinate ratio maps continuously.

PRIMARY_HUES = {
    DominantPrimary.RED: 0,      # Also 360
    DominantPrimary.YELLOW: 60,
    DominantPrimary.BLUE: 240,
}

# Secondary hues (balanced mixtures)
SECONDARY_HUES = {
    'RY': 30,   # Orange (balanced Red-Yellow)
    'YB': 150,  # Green (balanced Yellow-Blue)
    'BR': 270,  # Violet/Purple (balanced Blue-Red)
}


def _normalize_hue(h: float) -> float:
    """Normalize hue to 0-360 range."""
    return h % 360


def _hue_distance(h1: float, h2: float) -> float:
    """Calculate shortest angular distance between two hues."""
    h1 = _normalize_hue(h1)
    h2 = _normalize_hue(h2)
    diff = abs(h1 - h2)
    return min(diff, 360 - diff)


def _determine_dominant_primary(hue: float) -> Tuple[DominantPrimary, float]:
    """
    Determine the dominant primary for a given hue angle.
    
    Args:
        hue: Hue angle in degrees (0-360)
        
    Returns:
        Tuple of (DominantPrimary, distance_to_primary)
    """
    hue = _normalize_hue(hue)
    
    # Calculate distance to each primary
    distances = {}
    for primary, primary_hue in PRIMARY_HUES.items():
        distances[primary] = _hue_distance(hue, primary_hue)
    
    # Find the closest primary
    dominant = min(distances, key=distances.get)
    return dominant, distances[dominant]


def _determine_subordinate(hue: float, dominant: DominantPrimary) -> Optional[DominantPrimary]:
    """
    Determine the subordinate primary given the dominant and hue.
    
    Args:
        hue: Hue angle
        dominant: Dominant primary
        
    Returns:
        Subordinate primary or None if pure
    """
    hue = _normalize_hue(hue)
    dominant_hue = PRIMARY_HUES[dominant]
    
    # If very close to pure primary, no subordinate
    if _hue_distance(hue, dominant_hue) < 10:
        return None
    
    # Determine which secondary we're closest to
    secondaries = {
        'RY': 30,
        'YB': 150,
        'BR': 270,
    }
    
    # Find relevant secondaries (those involving the dominant)
    relevant_secondaries = {}
    for name, sec_hue in secondaries.items():
        if dominant.value in name:
            relevant_secondaries[name] = sec_hue
    
    # Find closest secondary
    if not relevant_secondaries:
        return None
    
    closest_sec = min(relevant_secondaries, key=lambda n: _hue_distance(hue, relevant_secondaries[n]))
    
    # Extract subordinate from secondary name
    for char in closest_sec:
        if char != dominant.value:
            return DominantPrimary(char)
    
    return None


def _calculate_mixture_ratio(hue: float, dominant: DominantPrimary, subordinate: Optional[DominantPrimary]) -> float:
    """
    Calculate the mixture ratio (0 = pure, 0.5 = balanced, approaches 1 = inverted).
    
    The ratio represents how much the subordinate contributes relative to dominant.
    
    Args:
        hue: Hue angle
        dominant: Dominant primary
        subordinate: Subordinate primary
        
    Returns:
        Mixture ratio 0-1
    """
    if subordinate is None:
        return 0.0
    
    hue = _normalize_hue(hue)
    dominant_hue = PRIMARY_HUES[dominant]
    subordinate_hue = PRIMARY_HUES[subordinate]
    
    # Calculate the secondary hue between dominant and subordinate
    # (the balanced mixture point)
    sec_hue = (dominant_hue + subordinate_hue) / 2
    if abs(dominant_hue - subordinate_hue) > 180:
        # Wrap around case (e.g., Red-Blue)
        sec_hue = (dominant_hue + subordinate_hue + 360) / 2 % 360
    
    # Distance from dominant
    dist_from_dominant = _hue_distance(hue, dominant_hue)
    
    # Distance to secondary (balanced point)
    dist_to_secondary = _hue_distance(hue, sec_hue)
    
    # If closer to dominant than secondary, ratio < 0.5
    # If closer to secondary, ratio >= 0.5
    if dist_from_dominant <= _hue_distance(sec_hue, dominant_hue):
        # Between dominant and secondary
        ratio = dist_from_dominant / (2 * _hue_distance(sec_hue, dominant_hue))
    else:
        # Past secondary, heading toward subordinate
        ratio = 0.5 + dist_to_secondary / (2 * _hue_distance(sec_hue, subordinate_hue))
    
    return min(1.0, max(0.0, ratio))


def _generate_garau_notation(
    dominant: DominantPrimary,
    subordinate: Optional[DominantPrimary],
    ratio: float
) -> str:
    """
    Generate Garau's notation for a color mixture.
    
    Examples:
        "R" = pure Red
        "rY" = reddish Yellow (dominant Y, subordinate R)
        "RY" = balanced Red-Yellow (orange)
        "yR" = yellowish Red (dominant R, subordinate Y)
    
    Args:
        dominant: Dominant primary
        subordinate: Subordinate primary
        ratio: Mixture ratio
        
    Returns:
        Garau notation string
    """
    if subordinate is None or ratio < 0.15:
        return dominant.value
    
    if 0.4 <= ratio <= 0.6:
        # Balanced mixture - use both capitals
        return f"{dominant.value}{subordinate.value}"
    
    # Use lowercase prefix for the subordinate
    sub_lower = subordinate.value.lower()
    
    if ratio < 0.5:
        # Closer to dominant
        return f"{sub_lower}{dominant.value}"
    else:
        # Closer to subordinate (inverted)
        return f"{dominant.value.lower()}{subordinate.value}"


def analyze_visual_mixture(color: RGB) -> GarauMixture:
    """
    Analyze a color as a visual mixture in Garau's framework.
    
    Args:
        color: RGB color to analyze
        
    Returns:
        GarauMixture with full analysis
    """
    hsl = rgb_to_hsl(color)
    lch = rgb_to_lch(color)
    
    hue = hsl.h
    saturation = hsl.s
    lightness = hsl.l
    
    # Determine dominant primary
    dominant, dist_to_primary = _determine_dominant_primary(hue)
    
    # Determine subordinate
    subordinate = _determine_subordinate(hue, dominant)
    
    # Calculate mixture ratio
    ratio = _calculate_mixture_ratio(hue, dominant, subordinate)
    
    # Adjust ratio based on saturation
    # Low saturation colors are less "pure" mixtures
    if saturation < 20:
        ratio = 0.5  # Desaturated colors approach neutral/balanced
    
    # Generate Garau notation
    notation = _generate_garau_notation(dominant, subordinate, ratio)
    
    return GarauMixture(
        dominant=dominant,
        subordinate=subordinate,
        ratio=ratio,
        notation=notation,
        hue_angle=hue,
        saturation=saturation,
        lightness=lightness
    )


def classify_juxtaposition(c1: RGB, c2: RGB) -> JuxtapositionAnalysis:
    """
    Classify a pair of colors into one of Arnheim's four juxtaposition types.
    
    Given any two colors forming a pair, the engine classifies them into
    one of Arnheim's four juxtaposition types which determine the
    transparency quality.
    
    Args:
        c1: First color (e.g., P zone)
        c2: Second color (e.g., Q zone)
        
    Returns:
        JuxtapositionAnalysis with classification and details
    """
    # Analyze both colors
    m1 = analyze_visual_mixture(c1)
    m2 = analyze_visual_mixture(c2)
    
    # Determine juxtaposition type
    juxtaposition_type: JuxtapositionType
    description: str
    transparency_quality: float
    recommended_correction: Optional[str] = None
    
    # Check for shared subordinate (same subordinate, different dominants)
    if (m1.subordinate is not None and m2.subordinate is not None and
        m1.subordinate == m2.subordinate and m1.dominant != m2.dominant):
        juxtaposition_type = JuxtapositionType.SHARED_SUBORDINATE
        description = (
            f"Both colors share {m1.subordinate.value} as subordinate. "
            f"Dominants are {m1.dominant.value} and {m2.dominant.value}. "
            "This creates very transparent, balanced, complementary harmony."
        )
        transparency_quality = 85 + 15 * (1 - abs(m1.ratio - m2.ratio))
    
    # Check for shared dominant (same dominant, different subordinates)
    elif m1.dominant == m2.dominant and m1.subordinate != m2.subordinate:
        juxtaposition_type = JuxtapositionType.SHARED_DOMINANT
        description = (
            f"Both colors share {m1.dominant.value} as dominant. "
            f"Subordinates are {m1.subordinate} and {m2.subordinate}. "
            "This creates less transparent but balanced display with strong figural unity."
        )
        transparency_quality = 60 + 20 * (1 - abs(m1.ratio - m2.ratio))
    
    # Check for complete inversion (each is dominant where other is subordinate)
    elif (m1.subordinate is not None and m2.subordinate is not None and
          m1.dominant == m2.subordinate and m1.subordinate == m2.dominant):
        juxtaposition_type = JuxtapositionType.COMPLETE_INVERSION
        description = (
            f"Complete inversion: {m1.notation} and {m2.notation} swap dominant/subordinate roles. "
            "Two shared colors, convergent relationship. May need background correction."
        )
        transparency_quality = 50
        recommended_correction = (
            "Adjust background colors to compensate for the inversion. "
            "Consider using asymmetric correction (Garau condition 7)."
        )
    
    # Check for partial inversion (three colors involved, one inverts role)
    elif (m1.subordinate is not None and m2.subordinate is not None and
          (m1.dominant == m2.subordinate or m1.subordinate == m2.dominant)):
        juxtaposition_type = JuxtapositionType.PARTIAL_INVERSION
        description = (
            f"Partial inversion with three colors involved. "
            f"{m1.notation} and {m2.notation} share one inverted relationship. "
            "Strong divergence, potentially clashing. Needs careful balancing."
        )
        transparency_quality = 35
        recommended_correction = (
            "Carefully balance the background colors. "
            "Consider adjusting one color to achieve complete or shared relationship."
        )
    
    # Default case - no clear relationship
    else:
        # Check if they're close in hue space
        hue_diff = _hue_distance(m1.hue_angle, m2.hue_angle)
        
        if hue_diff < 30:
            juxtaposition_type = JuxtapositionType.SHARED_DOMINANT
            description = (
                f"Colors are close in hue space ({hue_diff:.1f}° apart). "
                "Treated as shared dominant relationship."
            )
            transparency_quality = 55
        elif hue_diff > 150:
            juxtaposition_type = JuxtapositionType.SHARED_SUBORDINATE
            description = (
                f"Colors are nearly complementary ({hue_diff:.1f}° apart). "
                "Treated as shared subordinate relationship."
            )
            transparency_quality = 70
        else:
            juxtaposition_type = JuxtapositionType.PARTIAL_INVERSION
            description = (
                f"Colors have complex relationship ({hue_diff:.1f}° apart). "
                "No clear juxtaposition pattern identified."
            )
            transparency_quality = 40
    
    return JuxtapositionAnalysis(
        type=juxtaposition_type,
        color1_mixture=m1,
        color2_mixture=m2,
        transparency_quality=min(100, max(0, transparency_quality)),
        description=description,
        recommended_correction=recommended_correction
    )


def get_complementary_mixture(color: RGB) -> RGB:
    """
    Get the complementary mixture for a given color.
    
    The complementary mixture shares the same subordinate but has
    a different dominant - ideal for creating shared-subordinate
    juxtapositions.
    
    Args:
        color: Input color
        
    Returns:
        Complementary mixture RGB color
    """
    from .conversions import lch_to_rgb
    from .color_types import LCH
    
    lch = rgb_to_lch(color)
    mixture = analyze_visual_mixture(color)
    
    # Rotate hue by 180 degrees for complement
    comp_hue = (lch.h + 180) % 360
    
    return lch_to_rgb(LCH(l=lch.l, c=lch.c, h=comp_hue))


def find_shared_subordinate_partner(color: RGB) -> RGB:
    """
    Find a color that would form a shared-subordinate juxtaposition with input.
    
    Args:
        color: Input color
        
    Returns:
        Partner color for shared-subordinate relationship
    """
    from .conversions import lch_to_rgb
    from .color_types import LCH
    
    lch = rgb_to_lch(color)
    mixture = analyze_visual_mixture(color)
    
    if mixture.subordinate is None:
        # Pure color - create a mixture with this as subordinate
        # Pick a dominant 60 degrees away
        new_hue = (lch.h + 60) % 360
        return lch_to_rgb(LCH(l=lch.l, c=lch.c * 0.8, h=new_hue))
    
    # Keep the subordinate, change the dominant
    # Find the hue that has same subordinate but different dominant
    sub_hue = PRIMARY_HUES[mixture.subordinate]
    dom_hue = PRIMARY_HUES[mixture.dominant]
    
    # The partner should be on the other side of the subordinate
    partner_hue = sub_hue + (sub_hue - dom_hue)
    partner_hue = _normalize_hue(partner_hue)
    
    return lch_to_rgb(LCH(l=lch.l, c=lch.c, h=partner_hue))
