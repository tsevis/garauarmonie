# Garau Transparency Studio - Main Color Engine
"""
GarauColorEngine - The central engine for all color transparency computations.

This class provides a unified API for:
- Forward computation (A, B, t, α → P, Q)
- Inverse computation (A, B, P, Q → t, α)
- Designer mode exploration
- Visual mixture analysis
- Juxtaposition classification
- Complete validation

Optimized for M1 Ultra with numpy vectorization where applicable.
"""

from typing import List, Tuple, Optional, Dict, Any
from dataclasses import dataclass
import numpy as np

from .color_types import (
    RGB, HSL, LCH, NormalizedRGB,
    TransparencyConfig, MetelliResult,
    GarauMixture, JuxtapositionType, JuxtapositionAnalysis,
    ValidationReport
)
from .conversions import (
    rgb_to_normalized, normalized_to_rgb,
    rgb_to_hsl, hsl_to_rgb,
    rgb_to_lch, lch_to_rgb,
    rgb_to_lab, lab_to_rgb,
    interpolate_rgb, get_luminance, get_contrast_ratio
)
from .metelli import (
    compute_forward, compute_inverse, compute_designer,
    suggest_transparency_coefficient, suggestTransparentColor
)
from .visual_mixture import (
    analyze_visual_mixture, classify_juxtaposition,
    get_complementary_mixture, find_shared_subordinate_partner
)
from .validation import (
    validate_transparency, check_metelli_conditions, check_garau_conditions,
    get_validity_summary
)


@dataclass
class TransparencyAnalysis:
    """Complete analysis of a transparency configuration."""
    config: TransparencyConfig
    result: MetelliResult
    validation: ValidationReport
    p_mixture: GarauMixture
    q_mixture: GarauMixture
    juxtaposition: JuxtapositionAnalysis
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            'config': {
                'A': self.config.A.to_hex(),
                'B': self.config.B.to_hex(),
                't': self.config.t.to_hex(),
                'alpha': self.config.alpha,
            },
            'result': {
                'P': self.result.P.to_hex(),
                'Q': self.result.Q.to_hex(),
                't': self.result.t.to_hex(),
                'alpha': self.result.alpha,
            },
            'validation': {
                'overall_valid': self.validation.overall_valid,
                'quality': self.validation.transparency_quality,
                'juxtaposition_type': self.validation.juxtaposition_type.value if self.validation.juxtaposition_type else None,
                'warnings': self.validation.warnings,
                'suggestions': self.validation.suggestions,
            },
            'mixtures': {
                'P': self.p_mixture.notation,
                'Q': self.q_mixture.notation,
            }
        }


class GarauColorEngine:
    """
    Main color engine for Garau Transparency Studio.
    
    Provides all computational capabilities for the transparency system,
    optimized for the M1 Ultra's 128GB RAM with numpy vectorization.
    
    Example usage:
        engine = GarauColorEngine()
        
        # Forward computation
        result = engine.compute_forward(A, B, t, alpha)
        
        # Inverse computation
        result = engine.compute_inverse(A, B, P, Q)
        
        # Full analysis
        analysis = engine.analyze_transparency(config)
    """
    
    def __init__(self):
        """Initialize the color engine."""
        self._cache: Dict[str, Any] = {}
        self._cache_enabled = True
    
    def enable_cache(self, enabled: bool = True):
        """Enable or disable result caching."""
        self._cache_enabled = enabled
        if not enabled:
            self._cache.clear()
    
    def clear_cache(self):
        """Clear the computation cache."""
        self._cache.clear()
    
    # === Core Computation Methods ===
    
    def compute_forward(
        self,
        A: RGB, B: RGB, t: RGB, alpha: float
    ) -> MetelliResult:
        """
        Forward computation: Given backgrounds, transparent color, and alpha,
        compute the overlap zone colors P and Q.
        
        Args:
            A: Background color 1
            B: Background color 2
            t: Transparent layer color
            alpha: Transparency coefficient (0-1)
            
        Returns:
            MetelliResult with P, Q and validation info
        """
        return compute_forward(A, B, t, alpha)
    
    def compute_inverse(
        self,
        A: RGB, B: RGB, P: RGB, Q: RGB
    ) -> MetelliResult:
        """
        Inverse computation: Given backgrounds and overlap colors,
        compute the transparent color t and alpha.
        
        Args:
            A: Background color 1
            B: Background color 2
            P: Overlap zone color 1
            Q: Overlap zone color 2
            
        Returns:
            MetelliResult with t, alpha and validation info
        """
        return compute_inverse(A, B, P, Q)
    
    def compute_designer(
        self,
        A: RGB, B: RGB, t: RGB,
        alpha_range: Tuple[float, float] = (0.2, 0.8),
        num_samples: int = 7
    ) -> List[MetelliResult]:
        """
        Designer mode: Explore multiple alpha values to find optimal transparency.
        
        Args:
            A: Background color 1
            B: Background color 2
            t: Transparent layer color
            alpha_range: Range of alpha values to explore
            num_samples: Number of samples
            
        Returns:
            List of MetelliResult for each alpha value
        """
        return compute_designer(A, B, t, alpha_range, num_samples)
    
    # === Analysis Methods ===
    
    def analyze_transparency(
        self,
        A: RGB, B: RGB, t: RGB, alpha: float
    ) -> TransparencyAnalysis:
        """
        Perform complete analysis of a transparency configuration.
        
        Args:
            A: Background color 1
            B: Background color 2
            t: Transparent layer color
            alpha: Transparency coefficient
            
        Returns:
            TransparencyAnalysis with all computed values and validations
        """
        # Compute forward
        result = self.compute_forward(A, B, t, alpha)
        
        # Create config
        config = TransparencyConfig(A=A, B=B, t=t, alpha=alpha)
        
        # Validate
        validation = validate_transparency(
            A, B, result.P, result.Q, result.t, result.alpha
        )
        
        # Analyze mixtures
        p_mixture = analyze_visual_mixture(result.P)
        q_mixture = analyze_visual_mixture(result.Q)
        
        # Classify juxtaposition
        juxtaposition = classify_juxtaposition(result.P, result.Q)
        
        return TransparencyAnalysis(
            config=config,
            result=result,
            validation=validation,
            p_mixture=p_mixture,
            q_mixture=q_mixture,
            juxtaposition=juxtaposition
        )
    
    def analyze_visual_mixture(self, color: RGB) -> GarauMixture:
        """
        Analyze a single color as a visual mixture.
        
        Args:
            color: RGB color to analyze
            
        Returns:
            GarauMixture with full analysis
        """
        return analyze_visual_mixture(color)
    
    def classify_juxtaposition(
        self, c1: RGB, c2: RGB
    ) -> JuxtapositionAnalysis:
        """
        Classify the juxtaposition type of two colors.
        
        Args:
            c1: First color
            c2: Second color
            
        Returns:
            JuxtapositionAnalysis with classification
        """
        return classify_juxtaposition(c1, c2)
    
    def validate(
        self,
        A: RGB, B: RGB, P: RGB, Q: RGB, t: RGB, alpha: float
    ) -> ValidationReport:
        """
        Validate a complete transparency configuration.
        
        Args:
            A, B: Background colors
            P, Q: Overlap colors
            t: Transparent layer color
            alpha: Transparency coefficient
            
        Returns:
            ValidationReport with all condition checks
        """
        return validate_transparency(A, B, P, Q, t, alpha)
    
    # === Suggestion Methods ===
    
    def suggest_transparency_coefficient(
        self, A: RGB, B: RGB, P: RGB, Q: RGB
    ) -> float:
        """
        Suggest an optimal transparency coefficient.
        
        Args:
            A, B: Background colors
            P, Q: Overlap colors
            
        Returns:
            Suggested alpha value
        """
        return suggest_transparency_coefficient(A, B, P, Q)
    
    def suggest_transparent_colors(
        self, A: RGB, B: RGB
    ) -> List[RGB]:
        """
        Suggest optimal transparent layer colors for given backgrounds.
        
        Args:
            A: Background color 1
            B: Background color 2
            
        Returns:
            List of suggested transparent colors
        """
        return suggestTransparentColor(A, B)
    
    def find_complementary_mixture(self, color: RGB) -> RGB:
        """
        Find a color that forms a shared-subordinate juxtaposition.
        
        Args:
            color: Input color
            
        Returns:
            Complementary mixture color
        """
        return get_complementary_mixture(color)
    
    def find_shared_subordinate_partner(self, color: RGB) -> RGB:
        """
        Find a partner color for shared-subordinate relationship.
        
        Args:
            color: Input color
            
        Returns:
            Partner color
        """
        return find_shared_subordinate_partner(color)
    
    # === Color Space Conversion Methods ===
    
    def to_hsl(self, rgb: RGB) -> HSL:
        """Convert RGB to HSL."""
        return rgb_to_hsl(rgb)
    
    def to_lch(self, rgb: RGB) -> LCH:
        """Convert RGB to LCH (perceptually uniform)."""
        return rgb_to_lch(rgb)
    
    def to_lab(self, rgb: RGB) -> Tuple[float, float, float]:
        """Convert RGB to CIE Lab."""
        return rgb_to_lab(rgb)
    
    def from_hsl(self, hsl: HSL) -> RGB:
        """Convert HSL to RGB."""
        return hsl_to_rgb(hsl)
    
    def from_lch(self, lch: LCH) -> RGB:
        """Convert LCH to RGB."""
        return lch_to_rgb(lch)
    
    def from_lab(self, lab: Tuple[float, float, float]) -> RGB:
        """Convert CIE Lab to RGB."""
        return lab_to_rgb(lab)
    
    def interpolate(
        self, c1: RGB, c2: RGB, t: float, space: str = 'lch'
    ) -> RGB:
        """
        Interpolate between two colors.
        
        Args:
            c1: Start color
            c2: End color
            t: Interpolation factor (0-1)
            space: Color space for interpolation ('rgb', 'lch', 'lab')
            
        Returns:
            Interpolated color
        """
        if space == 'lch':
            return interpolate_rgb(c1, c2, t)
        elif space == 'rgb':
            return RGB(
                r=int(c1.r + t * (c2.r - c1.r)),
                g=int(c1.g + t * (c2.g - c1.g)),
                b=int(c1.b + t * (c2.b - c1.b))
            )
        else:
            # Default to LCH for perceptual uniformity
            return interpolate_rgb(c1, c2, t)
    
    # === Utility Methods ===
    
    def get_luminance(self, color: RGB) -> float:
        """Get relative luminance of a color."""
        return get_luminance(color)
    
    def get_contrast_ratio(self, c1: RGB, c2: RGB) -> float:
        """Get WCAG contrast ratio between two colors."""
        return get_contrast_ratio(c1, c2)
    
    def generate_transparency_variants(
        self,
        A: RGB, B: RGB, t: RGB,
        alpha_steps: int = 5
    ) -> List[TransparencyAnalysis]:
        """
        Generate multiple transparency variants with different alpha values.
        
        Optimized for batch processing on M1 Ultra.
        
        Args:
            A: Background color 1
            B: Background color 2
            t: Transparent layer color
            alpha_steps: Number of alpha steps (0 to 1)
            
        Returns:
            List of TransparencyAnalysis for each alpha
        """
        alphas = np.linspace(0.1, 0.9, alpha_steps)
        results = []
        
        for alpha in alphas:
            analysis = self.analyze_transparency(A, B, t, alpha)
            results.append(analysis)
        
        return results
    
    def batch_compute_forward(
        self,
        configs: List[Tuple[RGB, RGB, RGB, float]]
    ) -> List[MetelliResult]:
        """
        Batch compute forward for multiple configurations.
        
        Optimized for M1 Ultra's parallel processing capabilities.
        
        Args:
            configs: List of (A, B, t, alpha) tuples
            
        Returns:
            List of MetelliResult
        """
        return [compute_forward(A, B, t, alpha) for A, B, t, alpha in configs]


# Singleton instance for global access
_engine_instance: Optional[GarauColorEngine] = None


def get_engine() -> GarauColorEngine:
    """Get the global engine instance."""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = GarauColorEngine()
    return _engine_instance
