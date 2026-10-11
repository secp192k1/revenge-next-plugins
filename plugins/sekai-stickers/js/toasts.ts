import { ToastActionCreators } from '@revenge-mod/discord/actions'
import { lookupGeneratedIconComponent } from '@revenge-mod/utils/discord'

export function showToast(text: string, failed = false) {
	const icon = failed ? 'CircleXIcon' : 'CircleCheckIcon'

	ToastActionCreators.open(
		failed ? 'SEKAI_STICKERS_FAILED' : 'SEKAI_STICKERS_DONE',
		{
			text,
			icon: lookupGeneratedIconComponent(
				icon,
				`${icon}-primary`,
				`${icon}-secondary`,
			),
		},
	)
}

export function describeError(error: unknown) {
	return error instanceof Error ? error.message : String(error)
}
