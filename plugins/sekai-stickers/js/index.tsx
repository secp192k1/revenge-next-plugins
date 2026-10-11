import { ActionSheetActionCreators } from '@revenge-mod/discord/actions'
import { CharacterPickerSheetKey } from './components/CharacterPickerSheet'
import { StickerMakerSheetKey } from './components/StickerMakerSheet'
import SettingsComponent from './settings'
import { patchStickerPickerCategories } from './stickerPicker'
import { bindPluginApi, DefaultSettings } from './storage'
import { clearStickerCache } from './upload'
import type { Settings } from './storage'

export default plugin<{ jsonStorage: Settings }>({
	jsonStorage: {
		load: true,
		default: DefaultSettings,
	},
	start({ cleanup, jsonStorage, logger, plugin }) {
		bindPluginApi(jsonStorage, logger)

		if (plugin.startedLate) {
			plugin.requireReload()
			return
		}

		clearStickerCache().catch(error =>
			logger.warn('Failed to clear cached stickers', error),
		)

		cleanup(patchStickerPickerCategories(cleanup), () => {
			ActionSheetActionCreators.hideActionSheet(CharacterPickerSheetKey)
			ActionSheetActionCreators.hideActionSheet(StickerMakerSheetKey)
		})
	},
	SettingsComponent,
})
