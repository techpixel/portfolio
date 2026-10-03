/** A CSS cubic-bezier easing's control points. */
export type Bezier = readonly [number, number, number, number];

/** A cubic-bezier easing as a function of time, evaluated as CSS does. */
export function cubicBezier([x1, y1, x2, y2]: Bezier) {
	const along = (a: number, b: number, t: number) =>
		3 * a * (1 - t) ** 2 * t + 3 * b * (1 - t) * t ** 2 + t ** 3;
	return (x: number) => {
		if (x <= 0) return 0;
		if (x >= 1) return 1;
		// Find the curve parameter for this time by bisection: x(t) is monotonic for x1, x2 in [0, 1].
		let lo = 0;
		let hi = 1;
		let t = x;
		for (let i = 0; i < 24; i++) {
			const cx = along(x1, x2, t);
			if (Math.abs(cx - x) < 1e-6) break;
			if (cx < x) lo = t;
			else hi = t;
			t = (lo + hi) / 2;
		}
		return along(y1, y2, t);
	};
}

/** The same curve as a CSS `cubic-bezier()`. */
export const cubicBezierCss = (b: Bezier) => `cubic-bezier(${b.join(', ')})`;

/** The curve played backwards: the natural ease for undoing a transition. */
export const reversed = ([x1, y1, x2, y2]: Bezier): Bezier => [1 - x2, 1 - y2, 1 - x1, 1 - y1];
