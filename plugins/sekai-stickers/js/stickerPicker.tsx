import { Tokens } from '@revenge-mod/discord/common/tokens'
import { getModuleWithImportedPath } from '@revenge-mod/discord/utils/modules/finders'
import { after } from '@revenge-mod/patcher'
import { cloneElement, isValidElement } from 'react'
import { Image, View } from 'react-native'
import KanadeIconUri from './assets/kanade.png'
import { openStickerMaker } from './components/StickerMakerSheet'
import { getSetting } from './storage'
import { lazyStyles } from './styles'
import type { PluginCleanupApi } from '@revenge-mod/plugins/types'
import type { ComponentType, ReactElement, ReactNode } from 'react'
import type { PressableProps, StyleProp, ViewStyle } from 'react-native'

const StickerPickerCategoriesPath =
	'modules/stickers/native/StickerPickerCategories.tsx'
const PressablesPath = 'design/void/Pressables/native/Pressables.tsx'
const CategoryButtonKey = 'sekai-stickers'
const KanadeIconSource = { uri: KanadeIconUri }
const AndroidRippleConfig = { radius: 16 }

interface PressableOpacityProps extends PressableProps {
	androidRippleConfig?: { radius: number }
	style?: StyleProp<ViewStyle>
}

type StickerPickerCategories = (props: object) => ReactNode

let PressableOpacity: ComponentType<PressableOpacityProps> | undefined
let categoryButton: ReactElement | undefined

export function patchStickerPickerCategories(cleanup: PluginCleanupApi) {
	cleanup(
		getModuleWithImportedPath<{
			PressableOpacity?: ComponentType<PressableOpacityProps>
		}>(PressablesPath, exports => {
			PressableOpacity = exports.PressableOpacity
		}),
	)

	return getModuleWithImportedPath<{ default: StickerPickerCategories }>(
		StickerPickerCategoriesPath,
		exports => {
			if (typeof exports.default !== 'function') return

			cleanup(after(exports, 'default', prependCategoryButton))
		},
	)
}

function prependCategoryButton(tree: ReactNode) {
	if (
		!PressableOpacity ||
		!getSetting('stickerPickerButton') ||
		!isValidElement<{ children?: ReactNode }>(tree)
	)
		return tree

	const { children } = tree.props
	categoryButton ??= <SekaiStickersCategory key={CategoryButtonKey} />

	return cloneElement(
		tree,
		undefined,
		categoryButton,
		...(Array.isArray(children) ? children : [children]),
	)
}

function openFromStickerPicker() {
	openStickerMaker()
}

function SekaiStickersCategory() {
	const styles = useStyles()
	if (!PressableOpacity) return null

	return (
		<PressableOpacity
			accessibilityRole="button"
			accessibilityLabel="Sekai Stickers"
			androidRippleConfig={AndroidRippleConfig}
			style={styles.item}
			onPress={openFromStickerPicker}
		>
			<View style={styles.itemInner}>
				<Image source={KanadeIconSource} style={styles.icon} />
			</View>
		</PressableOpacity>
	)
}

const useStyles = lazyStyles(() => ({
	item: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	itemInner: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
		opacity: 0.5,
	},
	icon: {
		width: 24,
		height: 24,
		tintColor: Tokens.default.colors.INTERACTIVE_TEXT_DEFAULT,
	},
}))
