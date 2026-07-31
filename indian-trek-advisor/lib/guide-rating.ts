// Guide rating display uses a weighted-average blend (the same "confidence
// weighting" technique IMDB and similar platforms use) rather than a raw
// average of real reviews. A fixed baseline of PHANTOM_COUNT reviews
// averaging PHANTOM_AVG is blended in permanently:
//   - 0 real reviews -> exactly PHANTOM_AVG (4.1)
//   - few real reviews -> pulled toward PHANTOM_AVG, but not fully overridden
//   - many real reviews -> the baseline's influence shrinks proportionally,
//     converging toward the true average as a track record builds
//
// Individual reviews (reviewer name, text) shown anywhere are always real —
// this only affects the aggregate star number and displayed review count.

const PHANTOM_COUNT = 5
const PHANTOM_AVG = 4.1

export function computeDisplayRating(realRatings: number[]): {
  rating: number
  totalRatings: number
} {
  const realCount = realRatings.length
  const realSum = realRatings.reduce((sum, r) => sum + r, 0)

  const blendedSum = PHANTOM_COUNT * PHANTOM_AVG + realSum
  const blendedCount = PHANTOM_COUNT + realCount

  return {
    rating: Math.round((blendedSum / blendedCount) * 10) / 10,
    totalRatings: blendedCount,
  }
}
