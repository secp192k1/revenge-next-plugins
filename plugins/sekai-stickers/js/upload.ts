import { Dispatcher } from '@revenge-mod/discord/common/flux'
import { Stores } from '@revenge-mod/discord/flux'
import { FileModule } from '@revenge-mod/discord/native'
import { StickerHeight, StickerWidth } from './renderer'
import type { DiscordModules } from '@revenge-mod/discord/types'

const CacheFolder = 'sekai-stickers'

const ChannelMessageDraftType = 0
const ReactNativeUploadPlatform = 0

type UploadAttachmentStore = DiscordModules.Flux.Store<{
	getUploads(channelId: string, draftType: number): unknown[]
}>

export async function attachSticker(
	channelId: string,
	base64: string,
	filename: string,
) {
	const path = await FileModule.writeFile(
		'cache',
		`${CacheFolder}/${Date.now()}.png`,
		base64,
		'base64',
	)
	const uri = path.startsWith('file://') ? path : `file://${path}`

	const uploadStore = Stores.UploadAttachmentStore as
		| UploadAttachmentStore
		| undefined
	const countUploads = () =>
		uploadStore?.getUploads(channelId, ChannelMessageDraftType)?.length ?? 0
	const previousCount = countUploads()

	await Dispatcher.dispatch({
		type: 'UPLOAD_ATTACHMENT_ADD_FILES',
		channelId,
		draftType: ChannelMessageDraftType,
		files: [
			{
				id: uri,
				uri,
				originalUri: uri,
				filename,
				mimeType: 'image/png',
				width: StickerWidth,
				height: StickerHeight,
				platform: ReactNativeUploadPlatform,
			},
		],
	})

	return !uploadStore || countUploads() > previousCount
}

export async function clearStickerCache() {
	await FileModule.clearFolder('cache', CacheFolder)
}
