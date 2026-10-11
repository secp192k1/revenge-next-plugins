import type { DiscordModules } from '@revenge-mod/discord/types'
import type { JsonStorage } from '@revenge-mod/json-storage'

export interface Settings {
	autoCloseModal: boolean
	chatBarButton: boolean
	stickerPickerButton: boolean
	lastCharacter?: number
	lastText?: string
}

export const DefaultSettings: Settings = {
	autoCloseModal: true,
	chatBarButton: true,
	stickerPickerButton: true,
}

export let storage: JsonStorage<Settings>
export let logger: DiscordModules.Logger

export function bindPluginApi(
	pluginStorage: JsonStorage<Settings>,
	pluginLogger: DiscordModules.Logger,
) {
	storage = pluginStorage
	logger = pluginLogger
}

export function getSettings(): Settings {
	return {
		...DefaultSettings,
		...(storage?.cache as Partial<Settings> | undefined),
	}
}

export function getSetting<Key extends keyof Settings>(
	key: Key,
): Settings[Key] {
	return (
		(storage?.cache as Partial<Settings> | undefined)?.[key] ??
		DefaultSettings[key]
	)
}
