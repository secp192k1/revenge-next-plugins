import Page from '@revenge-mod/components/Page'
import TableRowAssetIcon from '@revenge-mod/components/TableRowAssetIcon'
import { Design } from '@revenge-mod/discord/design'
import { openStickerMaker } from './components/StickerMakerSheet'
import { DefaultSettings } from './storage'
import type { PluginSettingsComponent } from '@revenge-mod/plugins/types'
import type { ComponentProps } from 'react'
import type { Settings } from './storage'

const { TableRow, TableRowGroup, TableSwitchRow } = Design

type SettingsComponentProps = ComponentProps<
	PluginSettingsComponent<{ jsonStorage: Settings }>
>

export default function SettingsComponent({
	api: { jsonStorage: storage },
}: SettingsComponentProps) {
	const settings = { ...DefaultSettings, ...storage.use() }

	return (
		<Page>
			<TableRowGroup title="Chat">
				<TableSwitchRow
					icon={<TableRowAssetIcon name="StickerIcon" />}
					label="Sticker picker button"
					subLabel="Show the Sekai Stickers button next to Favorites in the sticker picker."
					value={settings.stickerPickerButton}
					onValueChange={stickerPickerButton =>
						storage.set({ stickerPickerButton })
					}
				/>
				<TableSwitchRow
					icon={<TableRowAssetIcon name="CircleCheckIcon" />}
					label="Close after attaching"
					subLabel="Close the sticker maker once the sticker is attached."
					value={settings.autoCloseModal}
					onValueChange={autoCloseModal => storage.set({ autoCloseModal })}
				/>
			</TableRowGroup>
			<TableRowGroup title="Sticker Maker">
				<TableRow
					icon={<TableRowAssetIcon name="StickerPlusIcon" />}
					label="Open sticker maker"
					subLabel="Attaches to the last channel you opened."
					arrow
					onPress={() => openStickerMaker()}
				/>
			</TableRowGroup>
		</Page>
	)
}
