import { memo } from 'react'
import type { FunctionComponent, NamedExoticComponent } from 'react'

export function lazyMemo<Props extends object>(
	component: FunctionComponent<Props>,
) {
	let memoized: NamedExoticComponent<Props> | undefined

	return () => (memoized ??= memo(component))
}
