import { getModuleWithImportedPath } from '@revenge-mod/discord/utils/modules/finders'
import { registerJSMethod } from '@revenge-mod/modules/native'

export const TAG = '[PreviewAttachments]'

interface ContentHandlers {
	onTapAttachmentTextPreview(event: {
		nativeEvent: { data: { attachmentUrl: string; fileName: string } }
	}): unknown
}

export function registerPreviewMethod(): () => void {
	let contentHandlers: ContentHandlers | undefined

	registerJSMethod(
		'dev.alphexo.preview-attachments',
		(fileName: string, url: string) => {
			if (!contentHandlers) {
				console.error(
					`${TAG} contentHandlers not loaded, cannot preview ${fileName}`,
				)
				return
			}
			contentHandlers.onTapAttachmentTextPreview({
				nativeEvent: { data: { attachmentUrl: url, fileName } },
			})
		},
	)

	return getModuleWithImportedPath<{ contentHandlers: ContentHandlers }>(
		'components_native/chat/contentHandlers.tsx',
		moduleExports => {
			contentHandlers = moduleExports.contentHandlers
			console.log(`${TAG} contentHandlers found`)
		},
	)
}
