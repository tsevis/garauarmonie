/**
 * Photoshop integration. All document-mutating calls run inside
 * `executeAsModal`; setting a color and filling use batchPlay action
 * descriptors (stable across PS versions). Reading the foreground color uses
 * the DOM getter and needs no modal scope.
 *
 * Note: in Photoshop's action descriptors the green channel key is `grain`.
 */
import type { RGB } from '@garau/engine';

/** True when running inside the Photoshop UXP host. */
export function inPhotoshop(): boolean {
  try {
    require('photoshop');
    return true;
  } catch {
    return false;
  }
}

/** Read the current foreground color as RGB (0–255). */
export function getForegroundRGB(): RGB {
  const { app } = require('photoshop');
  const c = app.foregroundColor.rgb;
  return { r: Math.round(c.red), g: Math.round(c.green), b: Math.round(c.blue) };
}

function setColorDescriptor(rgb: RGB) {
  return {
    _obj: 'set',
    _target: [{ _ref: 'color', _property: 'foregroundColor' }],
    to: { _obj: 'RGBColor', red: rgb.r, grain: rgb.g, blue: rgb.b },
    source: 'photoshopPicker',
  };
}

/** Set the foreground color to the given RGB. */
export async function setForegroundRGB(rgb: RGB): Promise<void> {
  const { core, action } = require('photoshop');
  await core.executeAsModal(
    async () => {
      await action.batchPlay([setColorDescriptor(rgb)], {});
    },
    { commandName: 'Set foreground color' },
  );
}

/**
 * Fill the active selection (or the whole active layer if nothing is selected)
 * with the given RGB, by setting it as foreground and applying a fill.
 */
export async function fillWithRGB(rgb: RGB): Promise<void> {
  const { core, action } = require('photoshop');
  await core.executeAsModal(
    async () => {
      await action.batchPlay(
        [
          setColorDescriptor(rgb),
          {
            _obj: 'fill',
            using: { _enum: 'fillContents', _value: 'foregroundColor' },
            opacity: { _unit: 'percentUnit', _value: 100 },
            mode: { _enum: 'blendMode', _value: 'normal' },
          },
        ],
        {},
      );
    },
    { commandName: 'Fill with color' },
  );
}
