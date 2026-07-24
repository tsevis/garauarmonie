# Garau Transparency Studio - Color Types
"""
Type definitions for color representations and transparency configurations.
"""

from dataclasses import dataclass, field
from typing import Tuple, Optional, List
from enum import Enum


@dataclass(frozen=True)
class RGB:
    """RGB color with 0-255 integer values."""
    r: int
    g: int
    b: int
    
    def __post_init__(self):
        # Validate ranges
        object.__setattr__(self, 'r', max(0, min(255, int(self.r))))
        object.__setattr__(self, 'g', max(0, min(255, int(self.g))))
        object.__setattr__(self, 'b', max(0, min(255, int(self.b))))
    
    def to_hex(self) -> str:
        """Convert to hex string."""
        return f"#{self.r:02X}{self.g:02X}{self.b:02X}"
    
    def to_tuple(self) -> Tuple[int, int, int]:
        """Convert to tuple."""
        return (self.r, self.g, self.b)
    
    @classmethod
    def from_hex(cls, hex_str: str) -> 'RGB':
        """Create RGB from hex string."""
        hex_str = hex_str.lstrip('#')
        return cls(
            r=int(hex_str[0:2], 16),
            g=int(hex_str[2:4], 16),
            b=int(hex_str[4:6], 16)
        )
    
    @classmethod
    def from_tuple(cls, tuple_vals: Tuple[int, int, int]) -> 'RGB':
        """Create RGB from tuple."""
        return cls(r=tuple_vals[0], g=tuple_vals[1], b=tuple_vals[2])


@dataclass(frozen=True)
class NormalizedRGB:
    """RGB color with 0.0-1.0 float values for computation."""
    r: float
    g: float
    b: float
    
    def __post_init__(self):
        object.__setattr__(self, 'r', max(0.0, min(1.0, float(self.r))))
        object.__setattr__(self, 'g', max(0.0, min(1.0, float(self.g))))
        object.__setattr__(self, 'b', max(0.0, min(1.0, float(self.b))))
    
    def to_rgb(self) -> RGB:
        """Convert to 0-255 RGB."""
        return RGB(
            r=round(self.r * 255),
            g=round(self.g * 255),
            b=round(self.b * 255)
        )


@dataclass(frozen=True)
class HSL:
    """HSL color representation."""
    h: float  # Hue: 0-360 degrees
    s: float  # Saturation: 0-100 percent
    l: float  # Lightness: 0-100 percent
    
    def __post_init__(self):
        object.__setattr__(self, 'h', float(self.h) % 360)
        object.__setattr__(self, 's', max(0.0, min(100.0, float(self.s))))
        object.__setattr__(self, 'l', max(0.0, min(100.0, float(self.l))))


@dataclass(frozen=True)
class LCH:
    """
    LCH (Lightness, Chroma, Hue) color representation.
    Perceptually uniform color space crucial for Garau's visual-mixture logic.
    """
    l: float  # Lightness: 0-100
    c: float  # Chroma: 0-100+ (typically 0-70 for surface colors)
    h: float  # Hue: 0-360 degrees
    
    def __post_init__(self):
        object.__setattr__(self, 'l', max(0.0, min(100.0, float(self.l))))
        object.__setattr__(self, 'c', max(0.0, float(self.c)))
        object.__setattr__(self, 'h', float(self.h) % 360)


@dataclass
class TransparencyConfig:
    """
    Configuration for a transparency display.
    Represents the four-zone setup with transparent layer.
    """
    A: RGB  # Background 1 (opaque)
    B: RGB  # Background 2 (opaque)
    t: RGB  # Transparent layer color
    alpha: float  # Transparency coefficient (0=fully transparent, 1=fully opaque)
    
    def __post_init__(self):
        self.alpha = max(0.0, min(1.0, float(self.alpha)))


@dataclass
class MetelliResult:
    """Result of Metelli computation."""
    P: RGB  # Overlap zone 1
    Q: RGB  # Overlap zone 2
    t: RGB  # Transparent layer color (computed or given)
    alpha: float  # Transparency coefficient
    validity_valid: bool = True
    warnings: List[str] = field(default_factory=list)


class DominantPrimary(Enum):
    """Garau's three fundamental primaries."""
    RED = 'R'
    YELLOW = 'Y'
    BLUE = 'B'


@dataclass
class GarauMixture:
    """
    Analysis of a color as a visual mixture in Garau's framework.
    
    Garau's thesis: transparency perception depends on VISUAL chromatic mixtures,
    not physical ones. A color is a "visual mixture" if it appears to contain
    two or more primary components to the average observer.
    """
    dominant: DominantPrimary
    subordinate: Optional[DominantPrimary]
    ratio: float  # 0 = pure, 0.5 = balanced, approaches 1 = inverted
    notation: str  # e.g., "rB" (reddish Blue), "Y" (pure Yellow)
    hue_angle: float
    saturation: float
    lightness: float
    
    @property
    def is_pure(self) -> bool:
        """Check if color is a pure primary."""
        return self.subordinate is None or self.ratio < 0.15
    
    @property
    def is_balanced(self) -> bool:
        """Check if color is a balanced mixture."""
        return 0.4 <= self.ratio <= 0.6
    
    @property
    def splittability(self) -> float:
        """
        How easily this color can be split perceptually.
        Pure colors = 0, unbalanced mixtures = high, balanced = medium-low
        """
        if self.is_pure:
            return 0.0
        elif self.is_balanced:
            return 0.3  # Balanced mixtures resist splitting (green, orange, violet)
        else:
            # Unbalanced mixtures split more easily
            return 0.7 + 0.3 * abs(0.5 - self.ratio) * 2


class JuxtapositionType(Enum):
    """
    Arnheim's four juxtaposition types for color pairs.
    
    These determine the transparency quality when two colors form
    the overlap zones (P and Q) in a transparency display.
    """
    SHARED_SUBORDINATE = "Shared Subordinate"
    """Same subordinate in both, different dominants.
    Very transparent, balanced, complementary harmony."""
    
    SHARED_DOMINANT = "Shared Dominant"
    """Same dominant in both, different subordinates.
    Less transparent, balanced, strong figural unity."""
    
    COMPLETE_INVERSION = "Complete Inversion"
    """Two colors only, each dominant in one and subordinate in other.
    Two shared colors, convergent, needs background correction."""
    
    PARTIAL_INVERSION = "Partial Inversion"
    """Three colors, one inverts its role.
    Strong divergence, clashing, needs careful balancing."""


@dataclass
class JuxtapositionAnalysis:
    """Analysis of a color pair's juxtaposition type."""
    type: JuxtapositionType
    color1_mixture: GarauMixture
    color2_mixture: GarauMixture
    transparency_quality: float  # 0-100
    description: str
    recommended_correction: Optional[str] = None


@dataclass
class ValidationReport:
    """
    Complete validation report for a transparency configuration.
    Checks both Metelli conditions and Garau's 10 chromatic conditions.
    """
    # Metelli conditions
    lightness_ordering: bool
    topology_preserved: bool
    contrast_reduction: bool
    
    # Garau's 10 conditions
    four_regions: bool = True
    visual_mixture_p: bool = True
    visual_mixture_q: bool = True
    unbalanced_preference: Optional[bool] = None
    common_color_exists: bool = True
    divergent_colors_exist: bool = True
    balanced_transparency: bool = True
    alpha_consistency: bool = True
    
    # Overall assessment
    overall_valid: bool = True
    warnings: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    
    # Quality metrics
    transparency_quality: float = 0.0  # 0-100
    juxtaposition_type: Optional[JuxtapositionType] = None
    
    def get_metelli_summary(self) -> dict:
        """Get Metelli conditions as dict."""
        return {
            'lightnessOrdering': self.lightness_ordering,
            'topologyPreserved': self.topology_preserved,
            'contrastReduction': self.contrast_reduction,
        }
    
    def get_garau_summary(self) -> dict:
        """Get Garau conditions as dict."""
        return {
            'fourRegions': self.four_regions,
            'visualMixtureP': self.visual_mixture_p,
            'visualMixtureQ': self.visual_mixture_q,
            'unbalancedPreference': self.unbalanced_preference,
            'commonColorExists': self.common_color_exists,
            'divergentColorsExist': self.divergent_colors_exist,
            'balancedTransparency': self.balanced_transparency,
            'alphaConsistency': self.alpha_consistency,
        }
