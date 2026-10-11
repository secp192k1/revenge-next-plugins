export interface StickerText {
	text: string
	x: number
	y: number
	rotate: number
	fontSize: number
}

export interface StickerCharacter {
	index: number
	id: string
	name: string
	character: string
	image: string
	color: string
	defaultText: StickerText
}

export const ImageBaseUrl = 'https://st.ayaka.one/img/'
export const DefaultCharacterIndex = 49
export const DefaultText = '读如果可爱'

const CharacterTable: [character: string, color: string, ids: string][] = [
	['airi', '#FB8AAC', '3-6 8-11 13-16 18'],
	['akito', '#FF7722', '19-22 24-27 29-33'],
	['an', '#00BADC', '34-37 39-42 44-47 49'],
	['emu', '#FF66BB', '50-53 55-58 60-63 65'],
	['ena', '#B18F6C', '66-69 71-74 76-79 81'],
	['Haruka', '#6495F0', '81-93'],
	['Honami', '#F86666', '94-108'],
	['Ichika', '#33AAEE', '109-123'],
	['KAITO', '#3366CC', '124-136'],
	['Kanade', '#BB6688', '137-150'],
	['Kohane', '#FF6699', '151-164'],
	['Len', '#D3BD00', '165-178'],
	['Luka', '#F88CA7', '179-191'],
	['Mafuyu', '#7171AF', '192-205'],
	['Meiko', '#E4485F', '206-218'],
	['Miku', '#33CCBB', '219-231'],
	['Minori', '#F39E7D', '232-245'],
	['Mizuki', '#CA8DB6', '246-259'],
	['Nene', '#19CD94', '260-272'],
	['Rin', '#E8A505', '273-285'],
	['Rui', '#BB88EE', '286-301'],
	['Saki', '#F5B303', '302-316'],
	['Shiho', '#A0C10B', '317-331'],
	['Shizuku', '#5CD0B9', '332-344'],
	['Touya', '#0077DD', '345-359'],
	['Tsukasa', '#F09A04', '360-374'],
]

const DefaultStickerText: StickerText = {
	text: 'something',
	x: 148,
	y: 58,
	rotate: -2,
	fontSize: 47,
}

const StickerTextOverrides: Record<string, StickerText> = {
	'Airi 01': { text: 'keep up', x: 148, y: 58, rotate: -2, fontSize: 47 },
	'Airi 02': {
		text: 'nice to meet ya',
		x: 148,
		y: 58,
		rotate: 0,
		fontSize: 28,
	},
	'Airi 03': { text: 'keep at it!', x: 140, y: 79, rotate: 2, fontSize: 47 },
	'Emu 13': { text: 'Wonderhoy!', x: 148, y: 70, rotate: -2, fontSize: 38 },
}

let characters: StickerCharacter[] | undefined

export function getCharacters() {
	return (characters ??= expandCharacterTable())
}

export function searchCharacters(query: string) {
	const search = query.trim().toLowerCase()
	if (!search) return getCharacters()

	return getCharacters().filter(
		character =>
			search === character.id ||
			character.name.toLowerCase().includes(search) ||
			character.character.toLowerCase().includes(search),
	)
}

function expandCharacterTable() {
	const expanded: StickerCharacter[] = []

	for (const [character, color, ids] of CharacterTable) {
		const displayName = character[0]!.toUpperCase() + character.slice(1)
		let number = 0

		for (const range of ids.split(' ')) {
			const [first, last = first] = range.split('-').map(Number) as [
				number,
				number?,
			]

			for (let id = first; id <= last; id++) {
				if (++number % 5 === 0) number++

				const name = `${displayName} ${String(number).padStart(2, '0')}`
				expanded.push({
					index: expanded.length,
					id: String(id),
					name,
					character,
					image: `${character}/${name.replace(' ', '_')}.png`,
					color,
					defaultText: StickerTextOverrides[name] ?? DefaultStickerText,
				})
			}
		}
	}

	return expanded
}
