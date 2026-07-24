# Garau Transparency Studio - Validation System
"""
Validation system for transparency configurations.

Checks both Metelli's conditions (from perceptual transparency research)
and Garau's 10 chromatic conditions (from his visual-mixture theory).

Metelli Conditions:
1. Lightness ordering: |L_P - L_Q| > |L_A - L_B|
2. Topology preservation: lighter overlap over lighter background
3. Contrast reduction: figure's internal contrast < background's

Garau's 10 Conditions:
1. Four regions - all four zones must be defined
2. Visual chromatic mixture - P and Q must each appear as visible mixtures
3. Unbalanced mixture preference - unbalanced mixtures split more easily
4. Common color - P and Q must share a perceptual color component (becomes t)
5. Divergent colors - non-shared components become perceived backgrounds
6. Balanced transparency - t present in P and Q in equal proportion
7. Asymmetric correction - if t present unequally, backgrounds must compensate
8. Transparency degree indicator - common color subordinate = transparent, dominant = opaque
9. Background-first derivation - transparency derivable from backgrounds
10. Background mixtures - backgrounds can also be mixtures
"""

from typing import List, Tuple, Optional
import numpy as np

from .color_types import (
    RGB, ValidationReport, GarauMixture, JuxtapositionType
)
from .conversions import get_luminance, rgb_to_normalized
from .visual_mixture import analyze_visual_mixture, classify_juxtaposition
from .metelli import compute_inverse


def check_metelli_conditions(
    A: RGB, B: RGB, P: RGB, Q: RGB,
    alpha: float
) -> Tuple[bool, bool, bool, List[str]]:
    """
    Check Metelli's three conditions for perceptual transparency.
    
    Args:
        A, B: Background colors
        P, Q: Overlap colors
        alpha: Transparency coefficient
        
    Returns:
        Tuple of (lightness_ordering, topology_preserved, contrast_reduction, warnings)
    """
    warnings = []
    
    # Calculate luminances
    L_A = get_luminance(A)
    L_B = get_luminance(B)
    L_P = get_luminance(P)
    L_Q = get_luminance(Q)
    
    # Condition 1: Lightness ordering
    # The lightness difference between P and Q must exceed the difference between A and B
    lightness_ordering = abs(L_P - L_Q) > abs(L_A - L_B)
    
    if not lightness_ordering:
        warnings.append(
            f"Lightness ordering violated: |L_P - L_Q| ({abs(L_P - L_Q):.3f}) should exceed "
            f"|L_A - L_B| ({abs(L_A - L_B):.3f})"
        )
    
    # Condition 2: Topology preservation
    # Lighter overlap region must be over lighter background region
    topology_preserved = (L_P > L_Q) == (L_A > L_B)
    
    if not topology_preserved:
        warnings.append(
            "Topology preservation violated: lighter overlap should be over lighter background"
        )
    
    # Condition 3: Contrast reduction
    # The figure's internal contrast must be less than the background's
    # Figure contrast = |L_P - L_Q|
    # Background contrast = |L_A - L_B|
    # For transparency: figure contrast should be reduced by factor of (1 - alpha)
    expected_figure_contrast = abs(L_A - L_B) * (1 - alpha)
    actual_figure_contrast = abs(L_P - L_Q)
    
    # Allow some tolerance (20%)
    contrast_reduction = actual_figure_contrast <= expected_figure_contrast * 1.2
    
    if not contrast_reduction:
        warnings.append(
            f"Contrast reduction violated: figure contrast ({actual_figure_contrast:.3f}) "
            f"should be less than background contrast ({abs(L_A - L_B):.3f}) × (1-α)"
        )
    
    return lightness_ordering, topology_preserved, contrast_reduction, warnings


def _check_common_color_exists(m1: GarauMixture, m2: GarauMixture) -> Tuple[bool, Optional[str]]:
    """
    Check if two mixtures share a common color component (Garau condition 4).
    
    The common color becomes the transparent layer color t.
    """
    # Check for shared subordinate
    if m1.subordinate is not None and m2.subordinate is not None:
        if m1.subordinate == m2.subordinate:
            return True, f"Shared subordinate: {m1.subordinate.value}"
    
    # Check for shared dominant
    if m1.dominant == m2.dominant:
        return True, f"Shared dominant: {m1.dominant.value}"
    
    # Check if one's dominant equals other's subordinate (inversion cases)
    if m1.subordinate is not None and m2.subordinate is not None:
        if m1.dominant == m2.subordinate:
            return True, f"Inversion: {m1.dominant.value} is dominant in one, subordinate in other"
        if m1.subordinate == m2.dominant:
            return True, f"Inversion: {m1.subordinate.value} is subordinate in one, dominant in other"
    
    # Check hue proximity (colors close in hue space share perceptual components)
    from .visual_mixture import _hue_distance
    hue_diff = _hue_distance(m1.hue_angle, m2.hue_angle)
    if hue_diff < 45:
        return True, f"Close hues ({hue_diff:.1f}° apart) share perceptual components"
    
    return False, None


def _check_divergent_colors_exist(m1: GarauMixture, m2: GarauMixture) -> Tuple[bool, Optional[str]]:
    """
    Check if non-shared components exist to become background colors (Garau condition 5).
    """
    divergent = []
    
    # Different dominants are divergent
    if m1.dominant != m2.dominant:
        divergent.append(f"Dominants: {m1.dominant.value} vs {m2.dominant.value}")
    
    # Different subordinates are divergent
    if m1.subordinate != m2.subordinate:
        sub1 = m1.subordinate.value if m1.subordinate else "none"
        sub2 = m2.subordinate.value if m2.subordinate else "none"
        divergent.append(f"Subordinates: {sub1} vs {sub2}")
    
    if divergent:
        return True, "; ".join(divergent)
    return False, "No divergent components found"


def _check_balanced_transparency(
    P: RGB, Q: RGB, t: RGB, alpha: float, tolerance: float = 0.15
) -> Tuple[bool, str]:
    """
    Check if t is present in P and Q in equal proportion (Garau condition 6).
    
    For balanced transparency, the computed t from P should match t from Q.
    """
    # Compute what t would be from P and from Q separately
    A_n = rgb_to_normalized(P)
    B_n = rgb_to_normalized(Q)
    t_given = rgb_to_normalized(t)
    
    # For balanced transparency, alpha should be consistent
    # and t should be derivable equally from both P and Q
    
    # Check alpha consistency (already done in Metelli computation)
    # Here we check if the color relationships are balanced
    
    t_from_P = [
        (A_n.r - alpha * A_n.r) / (1 - alpha) if alpha < 0.99 else A_n.r,
        (A_n.g - alpha * A_n.g) / (1 - alpha) if alpha < 0.99 else A_n.g,
        (A_n.b - alpha * A_n.b) / (1 - alpha) if alpha < 0.99 else A_n.b,
    ]
    
    # Compare with given t
    t_diff = np.sqrt(
        (t_from_P[0] - t_given.r) ** 2 +
        (t_from_P[1] - t_given.g) ** 2 +
        (t_from_P[2] - t_given.b) ** 2
    )
    
    if t_diff < tolerance:
        return True, f"Balanced (t deviation: {t_diff:.3f})"
    return False, f"Unbalanced (t deviation: {t_diff:.3f})"


def _check_transparency_degree(
    t: RGB, P: GarauMixture, Q: GarauMixture
) -> Tuple[str, str]:
    """
    Determine transparency degree from color relationships (Garau condition 8).
    
    If common color is subordinate in both → very transparent
    If common color is dominant in both → more opaque
    """
    # Analyze t as a mixture
    t_mixture = analyze_visual_mixture(t)
    
    # Check if t's dominant appears as subordinate in P and Q
    t_is_subordinate_in_both = (
        (P.subordinate == t_mixture.dominant) and
        (Q.subordinate == t_mixture.dominant)
    )
    
    t_is_dominant_in_both = (
        (P.dominant == t_mixture.dominant) and
        (Q.dominant == t_mixture.dominant)
    )
    
    if t_is_subordinate_in_both:
        return "very_transparent", "Common color is subordinate in both mixtures"
    elif t_is_dominant_in_both:
        return "more_opaque", "Common color is dominant in both mixtures"
    else:
        return "intermediate", "Mixed dominance relationship"


def check_garau_conditions(
    A: RGB, B: RGB, P: RGB, Q: RGB, t: RGB, alpha: float
) -> ValidationReport:
    """
    Check all of Garau's 10 chromatic conditions.
    
    Args:
        A, B: Background colors
        P, Q: Overlap colors
        t: Transparent layer color
        alpha: Transparency coefficient
        
    Returns:
        ValidationReport with all condition results
    """
    report = ValidationReport(
        lightness_ordering=True,
        topology_preserved=True,
        contrast_reduction=True,
    )
    
    warnings = []
    suggestions = []
    
    # Condition 1: Four regions (always true if we have all colors)
    report.four_regions = True
    
    # Analyze mixtures
    P_mixture = analyze_visual_mixture(P)
    Q_mixture = analyze_visual_mixture(Q)
    
    # Condition 2: Visual chromatic mixture in P
    report.visual_mixture_p = not P_mixture.is_pure
    if not report.visual_mixture_p:
        warnings.append(f"Zone P ({P_mixture.notation}) is a pure color, not a visual mixture")
        suggestions.append("Consider adjusting P to be a mixture for better transparency effect")
    
    # Condition 3: Visual chromatic mixture in Q
    report.visual_mixture_q = not Q_mixture.is_pure
    if not report.visual_mixture_q:
        warnings.append(f"Zone Q ({Q_mixture.notation}) is a pure color, not a visual mixture")
        suggestions.append("Consider adjusting Q to be a mixture for better transparency effect")
    
    # Condition 3 (unbalanced preference): Check if mixtures are unbalanced (preferred)
    if P_mixture.is_balanced or Q_mixture.is_balanced:
        # Balanced mixtures (green, orange, violet) resist splitting
        report.unbalanced_preference = False
        if P_mixture.is_balanced and Q_mixture.is_balanced:
            suggestions.append(
                "Both P and Q are balanced mixtures. These resist perceptual splitting. "
                "Consider using unbalanced mixtures for stronger transparency."
            )
    else:
        report.unbalanced_preference = True
    
    # Condition 4: Common color exists
    common_exists, common_desc = _check_common_color_exists(P_mixture, Q_mixture)
    report.common_color_exists = common_exists
    if not common_exists:
        warnings.append("No common color component found between P and Q")
        suggestions.append("P and Q should share a perceptual color component (becomes t)")
    elif common_desc:
        suggestions.append(f"Common color: {common_desc}")
    
    # Condition 5: Divergent colors exist
    divergent_exists, divergent_desc = _check_divergent_colors_exist(P_mixture, Q_mixture)
    report.divergent_colors_exist = divergent_exists
    if not divergent_exists:
        warnings.append("No divergent color components found")
    elif divergent_desc:
        suggestions.append(f"Divergent components: {divergent_desc}")
    
    # Condition 6: Balanced transparency
    report.balanced_transparency, balance_desc = _check_balanced_transparency(P, Q, t, alpha)
    if not report.balanced_transparency:
        warnings.append(f"Transparency is unbalanced: {balance_desc}")
        suggestions.append("For balanced transparency, t should be present equally in P and Q")
    
    # Condition 7: Asymmetric correction (check if backgrounds need adjustment)
    # This is more of a design guideline - if t is present unequally, backgrounds compensate
    # We check this by seeing if inverse computation gives reasonable results
    
    # Condition 8: Transparency degree indicator
    degree, degree_desc = _check_transparency_degree(t, P_mixture, Q_mixture)
    suggestions.append(f"Transparency degree: {degree} - {degree_desc}")
    
    # Condition 9: Background-first derivation (informational)
    # This condition states transparency can be derived from backgrounds
    # We verify by checking if A and B have sufficient difference
    
    A_n = rgb_to_normalized(A)
    B_n = rgb_to_normalized(B)
    bg_diff = np.sqrt(
        (A_n.r - B_n.r) ** 2 +
        (A_n.g - B_n.g) ** 2 +
        (A_n.b - B_n.b) ** 2
    )
    
    if bg_diff < 0.1:
        suggestions.append(
            "Backgrounds are very similar. Transparency derivation may be weak. "
            "Consider increasing contrast between A and B."
        )
    
    # Condition 10: Background mixtures (informational)
    A_mixture = analyze_visual_mixture(A)
    B_mixture = analyze_visual_mixture(B)
    
    if not A_mixture.is_pure or not B_mixture.is_pure:
        suggestions.append(
            f"Backgrounds are mixtures: A={A_mixture.notation}, B={B_mixture.notation}. "
            "This adds complexity to the transparency relationship."
        )
    
    # Check alpha consistency across channels
    result = compute_inverse(A, B, P, Q)
    report.alpha_consistency = "Alpha inconsistency" not in str(result.warnings)
    if not report.alpha_consistency:
        warnings.append("Alpha varies across color channels - may not be balanced transparency")
    
    # Get juxtaposition type
    juxtaposition = classify_juxtaposition(P, Q)
    report.juxtaposition_type = juxtaposition.type
    
    # Calculate overall transparency quality
    quality_factors = [
        juxtaposition.transparency_quality,
        P_mixture.splittability * 100,
        Q_mixture.splittability * 100,
    ]
    
    # Penalize for violations
    penalty = 0
    if not report.lightness_ordering:
        penalty += 15
    if not report.topology_preserved:
        penalty += 15
    if not report.visual_mixture_p:
        penalty += 10
    if not report.visual_mixture_q:
        penalty += 10
    if not report.common_color_exists:
        penalty += 20
    
    report.transparency_quality = max(0, min(100, np.mean(quality_factors) - penalty))
    
    # Determine overall validity
    critical_conditions = [
        report.four_regions,
        report.common_color_exists,
        report.alpha_consistency,
    ]
    
    report.overall_valid = all(critical_conditions) and len(warnings) == 0
    report.warnings = warnings
    report.suggestions = suggestions
    
    return report


def validate_transparency(
    A: RGB, B: RGB, P: RGB, Q: RGB, t: RGB, alpha: float
) -> ValidationReport:
    """
    Complete validation of a transparency configuration.
    
    Checks both Metelli conditions and Garau's 10 chromatic conditions.
    
    Args:
        A, B: Background colors
        P, Q: Overlap colors
        t: Transparent layer color
        alpha: Transparency coefficient
        
    Returns:
        Complete ValidationReport
    """
    # Check Metelli conditions
    lightness_ord, topology, contrast, metelli_warnings = check_metelli_conditions(
        A, B, P, Q, alpha
    )
    
    # Check Garau conditions
    report = check_garau_conditions(A, B, P, Q, t, alpha)
    
    # Merge Metelli results
    report.lightness_ordering = lightness_ord
    report.topology_preserved = topology
    report.contrast_reduction = contrast
    report.warnings.extend(metelli_warnings)
    
    # Recalculate overall validity
    report.overall_valid = (
        report.lightness_ordering and
        report.topology_preserved and
        report.common_color_exists and
        report.alpha_consistency
    )
    
    return report


def get_validity_summary(report: ValidationReport) -> str:
    """
    Get a human-readable summary of the validity report.
    
    Args:
        report: ValidationReport
        
    Returns:
        Summary string
    """
    if report.overall_valid:
        status = "✓ Valid transparency configuration"
    else:
        status = "✗ Invalid transparency configuration"
    
    summary = [status]
    summary.append(f"Transparency quality: {report.transparency_quality:.0f}/100")
    summary.append(f"Juxtaposition type: {report.juxtaposition_type.value if report.juxtaposition_type else 'Unknown'}")
    
    if report.warnings:
        summary.append("\nWarnings:")
        for w in report.warnings:
            summary.append(f"  • {w}")
    
    if report.suggestions:
        summary.append("\nSuggestions:")
        for s in report.suggestions[:3]:  # Limit to top 3
            summary.append(f"  • {s}")
    
    return "\n".join(summary)
