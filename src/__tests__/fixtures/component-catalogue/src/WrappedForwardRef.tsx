import {forwardRef} from 'react'
import type {ForwardedRef, JSX} from 'react'

export default forwardRef(
  (_props: object, ref: ForwardedRef<HTMLDivElement>): JSX.Element => (
    <div ref={ref}>Forward ref wrapper</div>
  ),
)
