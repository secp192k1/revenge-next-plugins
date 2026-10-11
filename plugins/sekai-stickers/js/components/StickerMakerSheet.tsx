import { getAssetIdByName } from '@revenge-mod/assets'
import { SheetHeader } from '@revenge-mod/components'
import { ActionSheetActionCreators } from '@revenge-mod/discord/actions'
import { Tokens } from '@revenge-mod/discord/common/tokens'
import { Design } from '@revenge-mod/discord/design'
import { Stores } from '@revenge-mod/discord/flux'
import { BottomSheet as Gorhom } from '@revenge-mod/externals/gorhom'
import { ReactNativeSafeAreaContext } from '@revenge-mod/externals/react-native-safe-area-context'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Image, View } from 'react-native'
import {
	DefaultCharacterIndex,
	DefaultText,
	getCharacters,
	ImageBaseUrl,
} from '../characters'
import { StickerHeight, StickerWidth } from '../renderer'
import { getSetting, logger, storage } from '../storage'
import { lazyStyles } from '../styles'
import { describeError, showToast } from '../toasts'
import { attachSticker } from '../upload'
import { useStickerRenderer } from '../useStickerRenderer'
import { getWebView } from '../webview'
import { openCharacterPicker } from './CharacterPickerSheet'
import { getSliderRow } from './SliderRow'
import type { DiscordModules } from '@revenge-mod/discord/types'
import type { StickerCharacter } from '../characters'
import type { StickerState } from '../renderer'

const {
	BottomSheet,
	Button,
	IconButton,
	TableRow,
	TableRowGroup,
	TableSwitchRow,
	Text,
	TextArea,
} = Design

export const StickerMakerSheetKey = 'SekaiStickersMaker'

const DefaultSpacing = 36

interface TextLayout {
	x: number
	y: number
	rotate: number
	fontSize: number
}

type SelectedChannelStore = DiscordModules.Flux.Store<{
	getChannelId(): string | null | undefined
}>

let resetIcon: number | undefined

export function openStickerMaker(channelId?: string) {
	const targetChannelId =
		channelId ??
		(Stores.SelectedChannelStore as SelectedChannelStore).getChannelId()

	if (!targetChannelId) return showToast('Open a channel first', true)
	if (!getWebView())
		return showToast('This Discord version has no supported WebView', true)

	ActionSheetActionCreators.openLazy(
		Promise.resolve({ default: StickerMakerSheet }),
		StickerMakerSheetKey,
		{ channelId: targetChannelId },
	)
}

function StickerMakerSheet({ channelId }: { channelId: string }) {
	const characters = getCharacters()
	const [characterIndex, setCharacterIndex] = useState(getInitialCharacterIndex)
	const character = characters[characterIndex]!
	const [text, setText] = useState(getInitialText)
	const [layout, setLayout] = useState(() => getDefaultLayout(character))
	const [spacing, setSpacing] = useState(DefaultSpacing)
	const [curve, setCurve] = useState(false)
	const [busy, setBusy] = useState(false)

	const imageUrl = ImageBaseUrl + character.image
	const state = useMemo<StickerState>(
		() => ({
			image: imageUrl,
			color: character.color,
			text,
			...layout,
			spacing,
			curve,
		}),
		[imageUrl, character.color, text, layout, spacing, curve],
	)

	const renderer = useStickerRenderer(state)
	const WebView = getWebView()!
	const SliderRow = getSliderRow()
	const styles = useStyles()
	const { bottom } = ReactNativeSafeAreaContext.useSafeAreaInsets()
	resetIcon ??= getAssetIdByName('RefreshIcon')

	const preview = useMemo(
		() => <WebView {...renderer.webViewProps} style={styles.webView} />,
		[WebView, renderer.webViewProps, styles.webView],
	)
	const characterIconSource = useMemo(() => ({ uri: imageUrl }), [imageUrl])

	const sliderHandlers = useMemo(
		() => ({
			rotate: (rotate: number) =>
				setLayout(current => ({ ...current, rotate })),
			fontSize: (fontSize: number) =>
				setLayout(current => ({ ...current, fontSize: Math.round(fontSize) })),
			spacing: (value: number) => setSpacing(Math.round(value)),
			x: (x: number) =>
				setLayout(current => ({ ...current, x: Math.round(x) })),
		}),
		[],
	)

	const changeVerticalPosition = useCallback(
		(value: number) =>
			setLayout(current => ({
				...current,
				y: getVerticalOrigin(current.fontSize, curve) - Math.round(value),
			})),
		[curve],
	)

	const lastChoice = useRef({ characterIndex, text })
	lastChoice.current = { characterIndex, text }

	useEffect(
		() => () => {
			storage
				.set({
					lastCharacter: lastChoice.current.characterIndex,
					lastText: lastChoice.current.text,
				})
				.catch(error =>
					logger.error('Failed to save sticker maker state', error),
				)
		},
		[],
	)

	const selectCharacter = (index: number) => {
		setCharacterIndex(index)
		setLayout(getDefaultLayout(characters[index]!))
	}

	const reset = () => {
		setLayout(getDefaultLayout(character))
		setSpacing(DefaultSpacing)
		setCurve(false)
	}

	const attach = async () => {
		if (busy) return
		setBusy(true)

		try {
			const base64 = await renderer.exportImage()
			const attached = await attachSticker(
				channelId,
				base64,
				`${character.character}-sekai_cards.png`,
			)
			if (!attached) return

			showToast('Sticker attached')
			if (getSetting('autoCloseModal'))
				ActionSheetActionCreators.hideActionSheet(StickerMakerSheetKey)
		} catch (error) {
			logger.error('Failed to attach sticker', error)
			showToast(`Could not attach the sticker: ${describeError(error)}`, true)
		} finally {
			setBusy(false)
		}
	}

	return (
		<BottomSheet
			scrollable
			startExpanded
			header={
				<SheetHeader
					title="Sekai Stickers"
					action={
						resetIcon !== undefined && (
							<IconButton
								icon={resetIcon}
								label="Reset"
								variant="secondary"
								size="sm"
								onPress={reset}
							/>
						)
					}
				/>
			}
		>
			<Gorhom.BottomSheetScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={[styles.body, { paddingBottom: bottom + 16 }]}
			>
				<View style={styles.preview}>
					<View pointerEvents="none" style={styles.fill}>
						{preview}
					</View>
					{!renderer.imageLoaded && (
						<View style={[styles.fill, styles.overlay]}>
							{renderer.imageFailed ? (
								<Text
									variant="text-sm/medium"
									color="text-feedback-critical"
									style={styles.centered}
									onPress={renderer.retry}
								>
									Could not load the sticker image. Tap to retry.
								</Text>
							) : (
								<ActivityIndicator />
							)}
						</View>
					)}
				</View>
				<TableRowGroup>
					<TableRow
						label="Character"
						subLabel={character.name}
						icon={
							<Image
								source={characterIconSource}
								style={styles.characterIcon}
							/>
						}
						arrow
						onPress={() => openCharacterPicker(characterIndex, selectCharacter)}
					/>
				</TableRowGroup>
				<TextArea
					label="Text"
					placeholder={DefaultText}
					defaultValue={text}
					onChange={setText}
				/>
				<SliderRow
					label="Rotation"
					value={layout.rotate}
					minimumValue={-10}
					maximumValue={10}
					step={0.1}
					format={formatRotation}
					onChange={sliderHandlers.rotate}
				/>
				<SliderRow
					label="Font Size"
					value={layout.fontSize}
					minimumValue={10}
					maximumValue={100}
					step={1}
					onChange={sliderHandlers.fontSize}
				/>
				<SliderRow
					label="Spacing"
					value={spacing}
					minimumValue={18}
					maximumValue={100}
					step={1}
					onChange={sliderHandlers.spacing}
				/>
				<SliderRow
					label="Horizontal Position"
					value={layout.x}
					minimumValue={0}
					maximumValue={StickerWidth}
					step={1}
					onChange={sliderHandlers.x}
				/>
				<SliderRow
					label="Vertical Position"
					value={clamp(
						getVerticalOrigin(layout.fontSize, curve) - layout.y,
						0,
						StickerHeight,
					)}
					minimumValue={0}
					maximumValue={StickerHeight}
					step={1}
					onChange={changeVerticalPosition}
				/>
				<TableRowGroup>
					<TableSwitchRow
						label="Curve"
						subLabel="Bend the text into an arc."
						value={curve}
						onValueChange={setCurve}
					/>
				</TableRowGroup>
				{renderer.fontsFailed && (
					<Text variant="text-sm/medium" color="text-feedback-warning">
						Some sticker fonts could not be loaded, so the text uses a fallback
						font.
					</Text>
				)}
				<Button
					text="Attach to Message"
					size="lg"
					loading={busy}
					disabled={!renderer.canExport}
					onPress={attach}
				/>
			</Gorhom.BottomSheetScrollView>
		</BottomSheet>
	)
}

function getInitialCharacterIndex() {
	const lastCharacter = getSetting('lastCharacter')
	return lastCharacter !== undefined && getCharacters()[lastCharacter]
		? lastCharacter
		: DefaultCharacterIndex
}

function getInitialText() {
	return getSetting('lastText') ?? DefaultText
}

function getDefaultLayout({ defaultText }: StickerCharacter): TextLayout {
	return {
		x: defaultText.x,
		y: defaultText.y,
		rotate: defaultText.rotate,
		fontSize: defaultText.fontSize,
	}
}

function getVerticalOrigin(fontSize: number, curve: boolean) {
	return curve ? StickerHeight + fontSize * 3 : StickerHeight
}

function formatRotation(value: number) {
	return value.toFixed(1)
}

function clamp(value: number, minimum: number, maximum: number) {
	return Math.min(Math.max(value, minimum), maximum)
}

const useStyles = lazyStyles(() => ({
	body: {
		paddingHorizontal: 16,
		gap: 16,
	},
	preview: {
		width: '100%',
		aspectRatio: StickerWidth / StickerHeight,
		borderRadius: 12,
		overflow: 'hidden',
		backgroundColor: Tokens.default.colors.BACKGROUND_MOD_SUBTLE,
	},
	fill: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	webView: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	overlay: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 16,
	},
	centered: {
		textAlign: 'center',
	},
	characterIcon: {
		width: 32,
		height: 32,
		borderRadius: 6,
	},
}))
