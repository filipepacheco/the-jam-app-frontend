import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

export interface PixelComparison {
  status: 'pass' | 'change' | 'failure'
  diffPixels: number
  diffRatio: number
  width: number
  height: number
  diff: Buffer | undefined
  message?: string
}

export interface PixelThreshold {
  maxDiffPixels: number
  maxDiffRatio: number
}

const decode = (buffer: Buffer): PNG => PNG.sync.read(buffer)

export const comparePng = (
  expectedBuffer: Buffer,
  actualBuffer: Buffer,
  threshold: PixelThreshold,
): PixelComparison => {
  let expected: PNG
  let actual: PNG
  try {
    expected = decode(expectedBuffer)
    actual = decode(actualBuffer)
  } catch (error: unknown) {
    return {
      status: 'failure',
      diffPixels: 0,
      diffRatio: 1,
      width: 0,
      height: 0,
      diff: undefined,
      message: `Could not decode a PNG: ${error instanceof Error ? error.message : String(error)}`,
    }
  }

  if (expected.width !== actual.width || expected.height !== actual.height) {
    return {
      status: 'failure',
      diffPixels: Number.POSITIVE_INFINITY,
      diffRatio: 1,
      width: actual.width,
      height: actual.height,
      diff: undefined,
      message: `Image dimensions changed from ${expected.width}x${expected.height} to ${actual.width}x${actual.height}`,
    }
  }

  const diff = new PNG({width: actual.width, height: actual.height})
  const diffPixels = pixelmatch(
    expected.data,
    actual.data,
    diff.data,
    expected.width,
    expected.height,
    {threshold: 0.1, includeAA: false},
  )
  const pixelCount = expected.width * expected.height
  const diffRatio = pixelCount === 0 ? 0 : diffPixels / pixelCount
  const status = diffPixels <= threshold.maxDiffPixels && diffRatio <= threshold.maxDiffRatio ? 'pass' : 'change'
  return {
    status,
    diffPixels,
    diffRatio,
    width: actual.width,
    height: actual.height,
    diff: status === 'pass' ? undefined : PNG.sync.write(diff),
  }
}
