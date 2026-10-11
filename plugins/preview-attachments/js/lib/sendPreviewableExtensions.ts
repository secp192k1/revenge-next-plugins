import { getModuleWithImportedPath } from '@revenge-mod/discord/utils/modules/finders'
import { callNativeMethod } from '@revenge-mod/modules/native'

export const TAG = '[PreviewAttachments]'

interface PlaintextFilePreviewHelpers {
	PLAINTEXT_FILE_EXTENSIONS: Set<string>
}

type UntypedCallNativeMethod = (
	name: string,
	args: unknown[],
) => Promise<unknown>

export function sendPreviewableExtensions(): () => void {
	return getModuleWithImportedPath<PlaintextFilePreviewHelpers>(
		'modules/messages/PlaintextFilePreviewHelpers.tsx',
		helpers => {
			const extensions = [...helpers.PLAINTEXT_FILE_EXTENSIONS]

			;(callNativeMethod as UntypedCallNativeMethod)(
				'dev.alphexo.preview-attachments.setPreviewableExtensions',
				extensions,
			).then(
				() =>
					console.log(
						`${TAG} sent ${extensions.length} previewable extensions`,
					),
				error =>
					console.error(`${TAG} sending previewable extensions failed`, error),
			)
		},
	)
}
