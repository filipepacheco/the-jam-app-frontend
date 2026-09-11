import type {JSX} from 'react'

export default function DynamicDefault(): JSX.Element {
  return <div>Loaded</div>
}

export function DynamicUnused(): JSX.Element {
  return <div>Not loaded</div>
}
