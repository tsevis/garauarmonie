# Garau Transparency Studio - Metelli Equations
"""
Implementation of Metelli's equations for perceptual transparency.

Extended from achromatic to full RGB space, following the path laid by
Da Pos and refined by Garau's visual-mixture thesis.

The Four-Zone Configuration:
┌─────────────────────────────────────┐
│                                     │
│    Zone A              Zone B       │   ← BACKGROUND (opaque)
│  (background 1)    (background 2)   │
│         ┌───────────────┐           │
│         │               │           │
│    Zone P    │    Zone Q │           │   ← P and Q are the OVERLAP zones
│  (overlap 1) │ (overlap 2)          │     where the transparent figure
│         │               │           │     crosses each background
│         └───────────────┘           │
│                                     │
└─────────────────────────────────────┘

Metelli's Equations (Extended to RGB):
For each channel (R, G, B) independently:
    P_c = α · A_c + (1 − α) · t_c     (left overlap)
    Q_c = α · B_c + (1 − α) · t_c     (right overlap)

Where c ∈ {R, G, B} and values are normalized [0, 1].
"""

import numpy as np
from typing import Tuple, Optional, List
from .color_types import RGB, NormalizedRGB, MetelliResult
from .conversions import rgb_to_normalized, normalized_to_rgb, get_luminance


def _clamp(val: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    """Clamp value to range."""
    return max(min_val, min(max_val, val))


def _compute_alpha_channel(P: float, Q: float, A: float, B: float) -> Optional[float]:
    """
    Compute alpha for a single channel.
    
    α = (P − Q) / (A − B)
    
    Returns None if division by zero (A == B).
    """
    denominator = A - B
    if abs(denominator) < 1e-10:
        return None
    alpha = (P - Q) / denominator
    return _clamp(alpha)


def _compute_t_channel(P: float, A: float, alpha: float) -> float:
    """
    Compute transparent layer color for a single channel.
    
    t_c = (P_c − α · A_c) / (1 − α)
    """
    if abs(1 - alpha) < 1e-10:
        # Fully opaque - t is irrelevant, return P
        return P
    t = (P - alpha * A) / (1 - alpha)
    return _clamp(t)


def _compute_overlap_channel(A: float, t: float, alpha: float) -> float:
    """
    Compute overlap zone color for a single channel.
    
    P_c = α · A_c + (1 − α) · t_c
    """
    return _clamp(alpha * A + (1 - alpha) * t)


def compute_forward(
    A: RGB, B: RGB, t: RGB, alpha: float,
    tolerance: float = 0.1
) -> MetelliResult:
    """
    Forward computation mode.
    
    Given: A, B (backgrounds) + t (transparent color) + α (transparency)
    Compute: P and Q (overlap colors)
    
    This is the primary creative mode: "I have a background and I want to
    paint a transparent shape with this color at this transparency —
    what colors do I need for the overlap zones?"
    
    Args:
        A: Background color 1 (opaque)
        B: Background color 2 (opaque)
        t: Transparent layer color
        alpha: Transparency coefficient (0=fully transparent, 1=fully opaque)
        tolerance: Tolerance for alpha consistency check across channels
        
    Returns:
        MetelliResult with computed P, Q and validation info
    """
    # Normalize to 0-1 range for computation
    A_n = rgb_to_normalized(A)
    B_n = rgb_to_normalized(B)
    t_n = rgb_to_normalized(t)
    
    # Compute P and Q per channel using Metelli's equations
    P_channels = []
    Q_channels = []
    
    for A_c, B_c, t_c in zip(
        [A_n.r, A_n.g, A_n.b],
        [B_n.r, B_n.g, B_n.b],
        [t_n.r, t_n.g, t_n.b]
    ):
        P_c = _compute_overlap_channel(A_c, t_c, alpha)
        Q_c = _compute_overlap_channel(B_c, t_c, alpha)
        P_channels.append(P_c)
        Q_channels.append(Q_c)
    
    # Convert back to RGB
    P = normalized_to_rgb(NormalizedRGB(
        r=P_channels[0],
        g=P_channels[1],
        b=P_channels[2]
    ))
    Q = normalized_to_rgb(NormalizedRGB(
        r=Q_channels[0],
        g=Q_channels[1],
        b=Q_channels[2]
    ))
    
    # Check validity
    warnings = []
    validity_valid = True
    
    # Check alpha is in valid range
    if alpha < 0 or alpha > 1:
        warnings.append(f"Alpha {alpha} is outside valid range [0, 1]")
        validity_valid = False
    
    # Check for extreme values that might cause perceptual issues
    if alpha < 0.05:
        warnings.append("Very low alpha - transparency effect may be imperceptible")
    elif alpha > 0.95:
        warnings.append("Very high alpha - figure may appear opaque")
    
    # Check luminance relationships (Metelli conditions preview)
    L_A = get_luminance(A)
    L_B = get_luminance(B)
    L_P = get_luminance(P)
    L_Q = get_luminance(Q)
    
    # Lightness ordering: |L_P - L_Q| should exceed |L_A - L_B|
    if abs(L_P - L_Q) <= abs(L_A - L_B):
        warnings.append("Lightness ordering condition may be violated")
    
    return MetelliResult(
        P=P,
        Q=Q,
        t=t,
        alpha=alpha,
        validity_valid=validity_valid and len(warnings) == 0,
        warnings=warnings
    )


def compute_inverse(
    A: RGB, B: RGB, P: RGB, Q: RGB,
    tolerance: float = 0.1
) -> MetelliResult:
    """
    Inverse computation mode.
    
    Given: A, B (backgrounds) + P, Q (overlap colors)
    Compute: t and α
    
    This mode analyzes an existing transparency display to determine
    what transparent color and transparency coefficient would produce it.
    
    Args:
        A: Background color 1 (opaque)
        B: Background color 2 (opaque)
        P: Overlap zone color 1
        Q: Overlap zone color 2
        tolerance: Tolerance for alpha consistency check across channels
        
    Returns:
        MetelliResult with computed t, alpha and validation info
    """
    # Normalize to 0-1 range for computation
    A_n = rgb_to_normalized(A)
    B_n = rgb_to_normalized(B)
    P_n = rgb_to_normalized(P)
    Q_n = rgb_to_normalized(Q)
    
    # Compute alpha for each channel
    alphas = []
    for A_c, B_c, P_c, Q_c in zip(
        [A_n.r, A_n.g, A_n.b],
        [B_n.r, B_n.g, B_n.b],
        [P_n.r, P_n.g, P_n.b],
        [Q_n.r, Q_n.g, Q_n.b]
    ):
        alpha = _compute_alpha_channel(P_c, Q_c, A_c, B_c)
        if alpha is not None:
            alphas.append(alpha)
    
    warnings = []
    validity_valid = True
    
    # Check alpha consistency across channels
    if len(alphas) == 0:
        # A == B for all channels - cannot compute alpha
        warnings.append("Cannot compute alpha: backgrounds are identical")
        alpha = 0.5  # Default fallback
        validity_valid = False
    else:
        alpha = np.mean(alphas)
        
        # Check consistency
        alpha_variance = np.var(alphas)
        if alpha_variance > tolerance ** 2:
            warnings.append(
                f"Alpha inconsistency across channels (variance={alpha_variance:.4f}). "
                "This may not be a valid balanced transparency."
            )
            validity_valid = False
    
    # Compute t for each channel
    t_channels = []
    for A_c, P_c in zip(
        [A_n.r, A_n.g, A_n.b],
        [P_n.r, P_n.g, P_n.b]
    ):
        t_c = _compute_t_channel(P_c, A_c, alpha)
        t_channels.append(t_c)
    
    # Convert back to RGB
    t = normalized_to_rgb(NormalizedRGB(
        r=t_channels[0],
        g=t_channels[1],
        b=t_channels[2]
    ))
    
    # Additional validation
    if alpha < 0 or alpha > 1:
        warnings.append(f"Computed alpha {alpha:.3f} is outside valid range [0, 1]")
        validity_valid = False
    
    # Check if computed values make perceptual sense
    L_A = get_luminance(A)
    L_B = get_luminance(B)
    L_P = get_luminance(P)
    L_Q = get_luminance(Q)
    
    # Metelli's lightness ordering condition
    if abs(L_P - L_Q) <= abs(L_A - L_B):
        warnings.append(
            "Metelli condition violated: |L_P - L_Q| should exceed |L_A - L_B| "
            "for compelling transparency"
        )
    
    # Topology preservation
    if (L_P > L_Q) != (L_A > L_B):
        warnings.append(
            "Metelli condition violated: lighter overlap should be over lighter background"
        )
    
    return MetelliResult(
        P=P,
        Q=Q,
        t=t,
        alpha=alpha,
        validity_valid=validity_valid and len(warnings) == 0,
        warnings=warnings
    )


def compute_designer(
    A: RGB, B: RGB, t: RGB,
    alpha_range: Tuple[float, float] = (0.2, 0.8),
    num_samples: int = 7
) -> List[MetelliResult]:
    """
    Designer mode computation.
    
    Given: A, B (backgrounds) + desired t + desired α range
    Compute: Best P, Q pairs across the alpha range
    
    This mode helps designers explore how different transparency levels
    affect the overlap colors, allowing them to choose the optimal α.
    
    Args:
        A: Background color 1 (opaque)
        B: Background color 2 (opaque)
        t: Desired transparent layer color
        alpha_range: Tuple of (min_alpha, max_alpha) to explore
        num_samples: Number of alpha values to sample
        
    Returns:
        List of MetelliResult for each alpha value
    """
    results = []
    
    alpha_min, alpha_max = alpha_range
    alpha_min = max(0.0, min(1.0, alpha_min))
    alpha_max = max(0.0, min(1.0, alpha_max))
    
    if alpha_min >= alpha_max:
        alpha_min, alpha_max = 0.2, 0.8
    
    # Generate alpha values
    alphas = np.linspace(alpha_min, alpha_max, num_samples)
    
    for alpha in alphas:
        result = compute_forward(A, B, t, alpha)
        results.append(result)
    
    return results


def suggest_transparency_coefficient(
    A: RGB, B: RGB, P: RGB, Q: RGB
) -> float:
    """
    Suggest an optimal transparency coefficient given a four-zone configuration.
    
    Uses a weighted average of per-channel alpha values, with weights
    based on the channel's contribution to perceived luminance.
    
    Args:
        A, B: Background colors
        P, Q: Overlap colors
        
    Returns:
        Suggested alpha value (0-1)
    """
    A_n = rgb_to_normalized(A)
    B_n = rgb_to_normalized(B)
    P_n = rgb_to_normalized(P)
    Q_n = rgb_to_normalized(Q)
    
    # Luminance weights (ITU-R BT.709)
    weights = [0.2126, 0.7152, 0.0722]
    
    weighted_alphas = []
    total_weight = 0
    
    for i, (A_c, B_c, P_c, Q_c) in enumerate(zip(
        [A_n.r, A_n.g, A_n.b],
        [B_n.r, B_n.g, B_n.b],
        [P_n.r, P_n.g, P_n.b],
        [Q_n.r, Q_n.g, Q_n.b]
    )):
        alpha = _compute_alpha_channel(P_c, Q_c, A_c, B_c)
        if alpha is not None:
            # Weight by how much this channel differs between backgrounds
            channel_diff = abs(A_c - B_c)
            if channel_diff > 0.01:  # Only consider if there's meaningful difference
                weighted_alphas.append((alpha, weights[i] * channel_diff))
                total_weight += weights[i] * channel_diff
    
    if not weighted_alphas or total_weight == 0:
        return 0.5  # Default
    
    # Weighted average
    alpha = sum(a * w for a, w in weighted_alphas) / total_weight
    return _clamp(alpha)


def suggestTransparentColor(A: RGB, B: RGB) -> List[RGB]:
    """
    Suggest optimal transparent layer colors given two backgrounds.
    
    Based on Garau's theory, the best transparent colors are those that:
    1. Share a perceptual component with both P and Q mixtures
    2. Create unbalanced mixtures (which split more easily than balanced ones)
    3. Maintain proper luminance relationships
    
    Args:
        A: Background color 1
        B: Background color 2
        
    Returns:
        List of suggested transparent colors
    """
    from .conversions import rgb_to_lch, lch_to_rgb, rgb_to_hsl
    from .color_types import LCH
    
    suggestions = []
    
    A_lch = rgb_to_lch(A)
    B_lch = rgb_to_lch(B)
    
    # Strategy 1: Use average lightness, intermediate hue
    avg_l = (A_lch.l + B_lch.l) / 2
    avg_c = (A_lch.c + B_lch.c) / 2
    
    # Hue averaging (taking shortest path)
    h_diff = B_lch.h - A_lch.h
    if h_diff > 180:
        h_diff -= 360
    elif h_diff < -180:
        h_diff += 360
    avg_h = (A_lch.h + h_diff / 2) % 360
    
    suggestions.append(lch_to_rgb(LCH(l=avg_l, c=avg_c, h=avg_h)))
    
    # Strategy 2: Complementary to the average
    comp_h = (avg_h + 180) % 360
    suggestions.append(lch_to_rgb(LCH(l=avg_l, c=avg_c * 0.7, h=comp_h)))
    
    # Strategy 3: Lower chroma version (more subtle transparency)
    suggestions.append(lch_to_rgb(LCH(l=avg_l, c=avg_c * 0.4, h=avg_h)))
    
    # Strategy 4: Higher chroma (more vivid transparency)
    suggestions.append(lch_to_rgb(LCH(l=avg_l, c=min(avg_c * 1.5, 80), h=avg_h)))
    
    # Strategy 5-6: Lighter and darker variants
    suggestions.append(lch_to_rgb(LCH(l=min(avg_l + 20, 90), c=avg_c * 0.6, h=avg_h)))
    suggestions.append(lch_to_rgb(LCH(l=max(avg_l - 20, 10), c=avg_c * 0.6, h=avg_h)))
    
    return suggestions
