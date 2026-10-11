import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RendererSource } from './renderer'
import type { RendererMessage, StickerState } from './renderer'
import type { WebViewHandle, WebViewMessageEvent } from './webview'

const OriginWhitelist = ['*']
const ExportTimeout = 15000

interface PendingExport {
	resolve(base64: string): void
	reject(error: Error): void
	timeout: ReturnType<typeof setTimeout>
}

type ImageResults = Record<string, boolean | undefined>

let nextExportId = 0

export function useStickerRenderer(state: StickerState) {
	const webViewReference = useRef<WebViewHandle>(null)
	const stateReference = useRef(state)
	const pendingExports = useRef(new Map<number, PendingExport>())
	const [ready, setReady] = useState(false)
	const [failedFonts, setFailedFonts] = useState<number>()
	const [imageResults, setImageResults] = useState<ImageResults>({})

	stateReference.current = state

	const run = useCallback((script: string) => {
		webViewReference.current?.injectJavaScript(
			`window.sekai && sekai.${script};true;`,
		)
	}, [])

	const update = useCallback(() => {
		run(`update(${JSON.stringify(stateReference.current)})`)
	}, [run])

	useEffect(() => {
		if (ready) update()
	}, [ready, state, update])

	useEffect(() => {
		const pending = pendingExports.current

		return () => {
			for (const { reject, timeout } of pending.values()) {
				clearTimeout(timeout)
				reject(new Error('The sticker maker was closed'))
			}
			pending.clear()
		}
	}, [])

	const onMessage = useCallback(
		({ nativeEvent }: WebViewMessageEvent) => {
			const message = JSON.parse(nativeEvent.data) as RendererMessage

			switch (message.type) {
				case 'ready':
					setReady(true)
					setFailedFonts(undefined)
					setImageResults({})
					update()
					break
				case 'fonts':
					setFailedFonts(message.failed)
					break
				case 'image':
					setImageResults(current => ({
						...current,
						[message.url]: message.loaded,
					}))
					break
				case 'export': {
					const pending = pendingExports.current.get(message.id)
					if (!pending) break

					pendingExports.current.delete(message.id)
					clearTimeout(pending.timeout)
					if (message.data)
						pending.resolve(message.data.slice(message.data.indexOf(',') + 1))
					else
						pending.reject(
							new Error(message.error ?? 'The sticker could not be rendered'),
						)
				}
			}
		},
		[update],
	)

	const exportImage = useCallback(
		() =>
			new Promise<string>((resolve, reject) => {
				const id = nextExportId++
				pendingExports.current.set(id, {
					resolve,
					reject,
					timeout: setTimeout(() => {
						if (pendingExports.current.delete(id))
							reject(new Error('Rendering the sticker took too long'))
					}, ExportTimeout),
				})
				run(`exportImage(${id})`)
			}),
		[run],
	)

	const retry = useCallback(() => {
		setImageResults(current => ({
			...current,
			[stateReference.current.image]: undefined,
		}))
		update()
	}, [update])

	const webViewProps = useMemo(
		() => ({
			ref: webViewReference,
			source: RendererSource,
			originWhitelist: OriginWhitelist,
			onMessage,
			javaScriptEnabled: true,
			scrollEnabled: false,
			overScrollMode: 'never' as const,
			setSupportMultipleWindows: false,
		}),
		[onMessage],
	)

	const imageLoaded = imageResults[state.image] === true

	return {
		webViewProps,
		imageLoaded,
		imageFailed: imageResults[state.image] === false,
		fontsFailed: Boolean(failedFonts),
		canExport: ready && imageLoaded && failedFonts !== undefined,
		exportImage,
		retry,
	}
}
