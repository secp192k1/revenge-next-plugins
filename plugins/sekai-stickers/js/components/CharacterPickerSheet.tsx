import { SearchInput, SheetHeader } from '@revenge-mod/components'
import { ActionSheetActionCreators } from '@revenge-mod/discord/actions'
import { Tokens } from '@revenge-mod/discord/common/tokens'
import { Design } from '@revenge-mod/discord/design'
import { BottomSheet as Gorhom } from '@revenge-mod/externals/gorhom'
import { ReactNativeSafeAreaContext } from '@revenge-mod/externals/react-native-safe-area-context'
import { useCallback, useMemo, useState } from 'react'
import { Image, Pressable, useWindowDimensions, View } from 'react-native'
import { ImageBaseUrl, searchCharacters } from '../characters'
import { lazyMemo } from '../memo'
import { StickerHeight, StickerWidth } from '../renderer'
import { lazyStyles } from '../styles'
import type { StickerCharacter } from '../characters'

const { BottomSheet, Text } = Design

export const CharacterPickerSheetKey = 'SekaiStickersCharacterPicker'

const Columns = 3
const Gap = 8
const HorizontalPadding = 16

interface CharacterPickerSheetProps {
	selected: number
	onSelect(index: number): void
}

interface CharacterCellProps {
	character: StickerCharacter
	width: number
	selected: boolean
	onSelect(index: number): void
}

const getCharacterCell = lazyMemo(CharacterCell)

export function openCharacterPicker(
	selected: number,
	onSelect: (index: number) => void,
) {
	ActionSheetActionCreators.openLazy(
		Promise.resolve({ default: CharacterPickerSheet }),
		CharacterPickerSheetKey,
		{ selected, onSelect },
		'stack',
	)
}

function CharacterPickerSheet({
	selected,
	onSelect,
}: CharacterPickerSheetProps) {
	const [query, setQuery] = useState('')
	const results = useMemo(() => searchCharacters(query), [query])
	const { width } = useWindowDimensions()
	const { bottom } = ReactNativeSafeAreaContext.useSafeAreaInsets()
	const styles = useStyles()

	const cellWidth =
		(width - HorizontalPadding * 2 - Gap * (Columns - 1)) / Columns

	const select = useCallback(
		(index: number) => {
			ActionSheetActionCreators.hideActionSheet(CharacterPickerSheetKey)
			onSelect(index)
		},
		[onSelect],
	)

	const MemoizedCharacterCell = getCharacterCell()
	const renderItem = useCallback(
		({ item }: { item: StickerCharacter }) => (
			<MemoizedCharacterCell
				character={item}
				width={cellWidth}
				selected={item.index === selected}
				onSelect={select}
			/>
		),
		[MemoizedCharacterCell, cellWidth, selected, select],
	)

	return (
		<BottomSheet
			scrollable
			startExpanded
			header={<SheetHeader title="Select character" />}
		>
			<View style={styles.body}>
				<SearchInput
					placeholder="Mafuyu"
					onChange={setQuery}
					onClear={() => setQuery('')}
					isClearable
				/>
				<Gorhom.BottomSheetFlatList
					data={results}
					numColumns={Columns}
					keyExtractor={getCharacterKey}
					columnWrapperStyle={styles.row}
					contentContainerStyle={[styles.list, { paddingBottom: bottom + 16 }]}
					keyboardShouldPersistTaps="handled"
					initialNumToRender={15}
					renderItem={renderItem}
				/>
			</View>
		</BottomSheet>
	)
}

function CharacterCell({
	character,
	width,
	selected,
	onSelect,
}: CharacterCellProps) {
	const styles = useStyles()

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={character.name}
			accessibilityState={{ selected }}
			style={[styles.cell, { width }, selected && styles.selected]}
			onPress={() => onSelect(character.index)}
		>
			<Image
				source={{ uri: ImageBaseUrl + character.image }}
				style={styles.image}
				resizeMode="contain"
			/>
			<Text variant="text-xs/medium" color="text-muted" lineClamp={1}>
				{character.name}
			</Text>
		</Pressable>
	)
}

function getCharacterKey(character: StickerCharacter) {
	return character.image
}

const useStyles = lazyStyles(() => ({
	body: {
		flex: 1,
		paddingHorizontal: HorizontalPadding,
		gap: 12,
	},
	list: {
		gap: Gap,
	},
	row: {
		gap: Gap,
	},
	cell: {
		alignItems: 'center',
		gap: 4,
		padding: 4,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: 'transparent',
	},
	selected: {
		borderColor: Tokens.default.colors.TEXT_BRAND,
	},
	image: {
		width: '100%',
		aspectRatio: StickerWidth / StickerHeight,
	},
}))
