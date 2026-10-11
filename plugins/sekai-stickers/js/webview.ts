import { lookupModule } from '@revenge-mod/modules/finders'
import {
	withDependencies,
	withProps,
} from '@revenge-mod/modules/finders/filters'
import type { ComponentType, Ref } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

export interface WebViewMessageEvent {
	nativeEvent: { data: string }
}

export interface WebViewHandle {
	injectJavaScript(script: string): void
}

export interface WebViewProps {
	ref?: Ref<WebViewHandle>
	source: { html: string; baseUrl?: string }
	originWhitelist?: string[]
	onMessage?(event: WebViewMessageEvent): void
	javaScriptEnabled?: boolean
	scrollEnabled?: boolean
	overScrollMode?: 'always' | 'content' | 'never'
	setSupportMultipleWindows?: boolean
	style?: StyleProp<ViewStyle>
}

type WebViewComponent = ComponentType<WebViewProps> & {
	isFileUploadSupported(): Promise<boolean>
}

const { relative } = withDependencies

let WebView: WebViewComponent | undefined

export function getWebView() {
	if (WebView) return WebView

	const webViewFilter = withProps<WebViewComponent>('isFileUploadSupported')
	const [initialized] = lookupModule(webViewFilter)
	if (initialized) return (WebView = initialized)

	const [initializedByLayout] = lookupModule(
		withDependencies([
			null,
			null,
			null,
			null,
			relative(1),
			null,
			null,
			relative(3),
			relative(4),
		]).and(webViewFilter),
	)

	return (WebView = initializedByLayout as WebViewComponent | undefined)
}
