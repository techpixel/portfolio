# glyphkit (vendored)

The framework-free geometry modules (`geometry`, `outline`, `warp`, `types`) from
[derekmeegan/glyphkit](https://github.com/derekmeegan/glyphkit) at commit 0ec8229,
copied unmodified. The package isn't published to npm and its components are React, so
`src/components/StretchWord.svelte` draws the outlines instead of `<Word>`.

`fonts/familjen-grotesk-700.json` is Familjen Grotesk Bold (A–Z, a–z), extracted with the
package's own script:

```sh
pnpm --filter glyphkit extract --chars "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" \
  --out fonts/familjen-grotesk-700.json --name "Familjen Grotesk Bold"
```

The extractor at that commit drops the last vertex of any outline it simplifies (its
`simplifyLoop` never closes the second chain back to the first point, so H loses the
inner corner of its left stem). The font here was extracted with that one-line fix:

```diff
-  const b = simplify(points.slice(half), tolerance);
+  const b = simplify([...points.slice(half), points[0]], tolerance);
```

Code: MIT (`LICENSE`). Font: SIL Open Font License (`fonts/familjen-grotesk-OFL.txt`).
