/**
 * Minimal ambient declarations for the UXP host environment. The `photoshop`
 * and `uxp` modules are provided by Photoshop at runtime (marked external at
 * bundle time); we only need enough typing to compile.
 */
declare function require(module: string): any;
