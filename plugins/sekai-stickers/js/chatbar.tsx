import {
	getModuleWithImportedPath,
	lookupModuleWithImportedPath,
} from '@revenge-mod/discord/utils/modules/finders'
import { instead } from '@revenge-mod/patcher'
import { findInReactFiber } from '@revenge-mod/utils/react'
import { isValidElement } from 'react'
import { Image } from 'react-native'
import KanadeIconUri from './assets/kanade.png'
import { openStickerMaker } from './components/StickerMakerSheet'
import { getSettings } from './storage'
import type { PluginCleanupApi } from '@revenge-mod/plugins/types'
import type { ComponentType, ReactElement, ReactNode } from 'react'
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native'

const ChatInputActionsPath =
	'modules/chat_input/native/action_buttons/ChatInputActions.tsx'
const ChatInputActionButtonPath =
	'modules/chat_input/native/action_buttons/ChatInputActionButton.tsx'
const ChatBarButtonKey = 'sekai-stickers'
const KanadeIconSource = { uri: KanadeIconUri }
const KanadeIconSize = { width: 24, height: 24 }

interface IconProps {
	style?: StyleProp<ImageStyle>
}

interface ActionButtonProps {
	IconComponent: ComponentType<IconProps>
	accessibilityLabel: string
	accessible: boolean
	active: boolean
	disabled: boolean
	style?: StyleProp<ViewStyle>
	onPress(): void
}

interface ChatInputActions {
	render(props: { channel?: { id: string } }, reference: unknown): ReactNode
}

let ChatInputActionButton: ComponentType<ActionButtonProps> | undefined

export function patchChatInputActions(cleanup: PluginCleanupApi) {
	return getModuleWithImportedPath<{
		default?: { type?: Partial<ChatInputActions> }
	}>(ChatInputActionsPath, exports => {
		const component = exports.default?.type
		if (typeof component?.render !== 'function') return

		cleanup(
			instead(
				component as ChatInputActions,
				'render',
				function (callArguments, render) {
					const tree = Reflect.apply(render, this, callArguments)
					if (getSettings().chatBarButton)
						appendChatBarButton(tree, callArguments[0]?.channel?.id)

					return tree
				},
			),
		)
	})
}

function appendChatBarButton(tree: ReactNode, channelId?: string) {
	if (!isValidElement(tree)) return

	const row = findInReactFiber(
		tree,
		(node): node is ReactElement<{ children: ReactNode[] }> =>
			Array.isArray(node.props?.children),
	)
	if (!row) return

	const { children } = row.props
	const template = children.find(
		(child): child is ReactElement<ActionButtonProps> =>
			isValidElement<Partial<ActionButtonProps>>(child) &&
			child.props.IconComponent != null,
	)

	const ActionButton =
		(template?.type as ComponentType<ActionButtonProps> | undefined) ??
		getChatInputActionButton()
	if (!ActionButton) return

	row.props.children = [
		...children,
		<ActionButton
			key={ChatBarButtonKey}
			IconComponent={KanadeIcon}
			accessibilityLabel="Sekai Stickers"
			accessible
			active={false}
			disabled={false}
			style={template?.props.style}
			onPress={() => openStickerMaker(channelId)}
		/>,
	]
}

function getChatInputActionButton() {
	if (!ChatInputActionButton) {
		const [actionButtonModule] = lookupModuleWithImportedPath<{
			default?: ComponentType<ActionButtonProps>
		}>(ChatInputActionButtonPath)
		ChatInputActionButton = actionButtonModule?.default
	}

	return ChatInputActionButton
}

function KanadeIcon({ style }: IconProps) {
	return <Image source={KanadeIconSource} style={[KanadeIconSize, style]} />
}
