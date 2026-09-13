import type {
  InlinePatternCandidate,
  InlinePatternGovernance,
} from '../../src/types/componentCatalogue.types.ts'
import {globPattern} from './metadata.ts'

export const applyInlinePatternGovernance = (
  candidates: InlinePatternCandidate[],
  governance: InlinePatternGovernance,
  diagnostics: string[],
): InlinePatternCandidate[] => {
  const dispositions = new Map(governance.candidates.map((candidate) => [candidate.id, candidate.disposition]))
  const discoveredIds = new Set<string>()

  const governed = candidates.map((candidate) => ({
    ...candidate,
    occurrences: candidate.occurrences.map((occurrence) => {
      discoveredIds.add(occurrence.id)
      const inScope = governance.scopes.some(
        (scope) => scope.families.includes(candidate.family) && globPattern(scope.source).test(occurrence.source),
      )
      const disposition = dispositions.get(occurrence.id)
      if (inScope && !disposition) {
        diagnostics.push(
          `unexplained inline pattern candidate "${occurrence.id}" (${candidate.family}) in governed source "${occurrence.source}"`,
        )
      }
      if (!inScope && disposition) {
        diagnostics.push(`inline pattern candidate "${occurrence.id}" has a disposition but is outside every governed scope`)
      }
      return disposition ? {...occurrence, disposition} : occurrence
    }),
  }))

  for (const candidate of governance.candidates) {
    if (!discoveredIds.has(candidate.id)) {
      diagnostics.push(`inline pattern disposition "${candidate.id}" is stale and does not resolve to a candidate`)
    }
  }

  return governed
}
