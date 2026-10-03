/*
 * Film-rate motion. The silly flowers' animations play at FPS rather than at the display's
 * refresh rate: each holds its pose for a whole frame and snaps to the next, so it reads as
 * animated by hand. The timing is still the designed curve; only the sampling changes.
 */

export const FPS = 48;

/** A CSS cubic-bezier easing's control points. */
export type Bezier = readonly [number, number, number, number];

/** How many whole frames a duration (in ms) spans, at least one. */
export function frames(durationMs: number, fps = FPS) {
	return Math.max(1, Math.round((durationMs * fps) / 1000));
}

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

/** `ease`, holding the pose at each frame's start until the next frame. For JS tweens. */
export function stepped(ease: (t: number) => number, durationMs: number, fps = FPS) {
	const n = frames(durationMs, fps);
	return (t: number) => ease(Math.floor(Math.min(1, Math.max(0, t)) * n) / n);
}

/** The same frame-held curve as a CSS `linear()` easing, for transitions and keyframes. */
export function steppedCss(bezier: Bezier, durationMs: number, fps = FPS) {
	const ease = cubicBezier(bezier);
	const n = frames(durationMs, fps);
	const stops: string[] = [];
	for (let k = 0; k < n; k++) {
		const pose = ease(k / n).toFixed(4);
		stops.push(`${pose} ${((100 * k) / n).toFixed(3)}%`, `${pose} ${((100 * (k + 1)) / n).toFixed(3)}%`);
	}
	stops.push('1 100%');
	return `linear(${stops.join(', ')})`;
}

/** The curve played backwards: the natural ease for undoing a transition. */
export const reversed = ([x1, y1, x2, y2]: Bezier): Bezier => [1 - x2, 1 - y2, 1 - x1, 1 - y1];
