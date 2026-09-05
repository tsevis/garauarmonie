# `garau` — the command line

A thin client of [`@garau/engine`](../engine), the same math the web studio and
the Photoshop panel run on. Everything the Composer, the Analyzer and the
validity readouts do is available from a shell, and every command speaks
`--json` so the engine can be scripted.

```bash
npm install
npm run build:engine      # the CLI imports the engine's dist/
npm run build:cli
npx garau --help
```

`npm install` links the binary into `node_modules/.bin/garau`, so `npx garau`
works anywhere in the repo.

## Commands

| Command | What it does |
| --- | --- |
| `garau compose <A> <B> <t> <alpha>` | Forward Metelli — compute the overlaps **P** and **Q** |
| `garau inverse <A> <B> <P> <Q>` | Recover the veil **t** and **α** from an existing display |
| `garau designer <A> <B> <t>` | Sweep α over a range and read every step |
| `garau validate <A> <B> <P> <Q> <t> <alpha>` | Check a complete display against every condition |
| `garau suggest <A> <B>` | Propose veil colours for two backgrounds, ranked |
| `garau analyze <color> [color2]` | Garau's visual-mixture reading, or a pair's juxtaposition |
| `garau convert <color> [color2]` | HSL, Lab, LCH, OKLab, OKLCH, luminance, WCAG contrast |

### Arguments

Colours are `#RRGGBB`, `#RGB`, `"r,g,b"` or `"rgb(r, g, b)"`. Unlike the engine —
which clamps quietly — the CLI rejects anything malformed and names the argument
it came from. `alpha` is `0`–`1` or a percentage (`55%`).

### Options

Every command accepts:

- `--json` — the full result as JSON, including the whole `ValidationReport`
- `--no-color` — no ANSI escapes (also honoured: a non-TTY stdout, and `NO_COLOR`)
- `-h`, `--help` — that command's usage
- `-V`, `--version`

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | The command ran |
| `1` | `compose`, `inverse` or `validate` ran, and the display is **not** a valid transparency |
| `2` | The arguments were wrong |
| `70` | An unexpected internal error |

So a display can be gated in a script:

```bash
garau validate "$A" "$B" "$P" "$Q" "$T" 0.55 >/dev/null || echo "not a transparency"
```

## Examples

```bash
# Forward: two backgrounds and a veil at 55%
garau compose "#3A6EA5" "#C8B560" "#B0452A" 0.55

# Inverse: recover the veil from the four zones
garau inverse "#3A6EA5" "#C8B560" "#6F5C6E" "#BD8348"

# Pick an α by eye
garau designer "#3A6EA5" "#C8B560" "#B0452A" --range 0.3,0.9 -s 5

# Garau's reading of a colour, and of a pair
garau analyze "#B0452A"
garau analyze "#B0452A" "#3A6EA5"

# Script it: the best-scoring veil for two backgrounds
garau suggest "#3A6EA5" "#C8B560" --json | jq -r '.candidates[0].hex'
```

## Layout

```
src/
├── bin.ts            the executable — stream wiring and the exit code
├── cli.ts            dispatch, global flags, error → exit-code mapping
├── index.ts          programmatic entry point (`run(argv, io)`)
├── flags.ts          the option parser
├── parse.ts          colour and number parsing — the validation boundary
├── format.ts         swatches, chips, key/value lines
├── report.ts         the shared ValidationReport rendering
├── help.ts           help text, generated from the registry
├── version.ts        version, read from package.json
└── commands/         one file per command, plus the registry
```

A command never prints. It returns `{ json, text, exitCode }` and `cli.ts`
chooses the rendering, which is what makes the whole surface testable without
touching a stream.

```bash
npm run test --workspace @garau/cli
npm run test:coverage --workspace @garau/cli
```
