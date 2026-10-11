import { Design } from '@revenge-mod/discord/design'
import { View } from 'react-native'
import { lazyMemo } from '../memo'
import { lazyStyles } from '../styles'

const { Slider, Text } = Design

interface SliderRowProps {
	label: string
	value: number
	minimumValue: number
	maximumValue: number
	step: number
	format?(value: number): string
	onChange(value: number): void
}

export const getSliderRow = lazyMemo(SliderRow)

function SliderRow({
	label,
	value,
	minimumValue,
	maximumValue,
	step,
	format = formatWholeNumber,
	onChange,
}: SliderRowProps) {
	const styles = useStyles()

	return (
		<View style={styles.row}>
			<View style={styles.header}>
				<Text variant="text-md/semibold" color="mobile-text-heading-primary">
					{label}
				</Text>
				<Text variant="text-md/medium" color="text-muted" tabularNumbers>
					{format(value)}
				</Text>
			</View>
			<Slider
				value={value}
				minimumValue={minimumValue}
				maximumValue={maximumValue}
				step={step}
				onValueChange={onChange}
			/>
		</View>
	)
}

function formatWholeNumber(value: number) {
	return String(Math.round(value))
}

const useStyles = lazyStyles(() => ({
	row: {
		gap: 4,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
}))
