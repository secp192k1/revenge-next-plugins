import { Design } from '@revenge-mod/discord/design'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'

export function lazyStyles<
	const Styles extends Record<string, TextStyle | ViewStyle | ImageStyle>,
>(factory: () => Styles) {
	let useStyles: (() => Styles) | undefined

	return () => (useStyles ??= Design.createStyles(factory()))()
}
