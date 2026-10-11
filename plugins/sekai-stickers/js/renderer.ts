export const StickerWidth = 296
export const StickerHeight = 256

const FontBaseUrl =
	'https://raw.githubusercontent.com/TheOriginalAyaka/sekai-stickers'

const Fonts = [
	[
		'YurukaStd',
		`${FontBaseUrl}/47a2ca33b8cb35f59800e8faad48980e4ce5ea71/src/fonts/YurukaStd.woff2`,
	],
	[
		'SSFangTangTi',
		`${FontBaseUrl}/49189d2e63ed715df5de053261f3bc09d9e817f2/src/fonts/ShangShouFangTangTi.woff2`,
	],
]

export interface StickerState {
	image: string
	color: string
	text: string
	x: number
	y: number
	rotate: number
	fontSize: number
	spacing: number
	curve: boolean
}

export type RendererMessage =
	| { type: 'ready' }
	| { type: 'fonts'; failed: number }
	| { type: 'image'; url: string; loaded: boolean }
	| { type: 'export'; id: number; data?: string; error?: string }

const RendererScript = `
const width = ${StickerWidth}
const height = ${StickerHeight}
const canvas = document.querySelector("canvas")
const images = new Map()
let state
let frame = 0

const post = message => window.ReactNativeWebView.postMessage(JSON.stringify(message))

const schedule = () => {
	if (frame) return
	frame = requestAnimationFrame(() => {
		frame = 0
		draw(canvas, (canvas.clientWidth * devicePixelRatio) / width)
	})
}

const load = url => {
	const image = new Image()
	images.set(url, image)
	image.crossOrigin = "anonymous"
	image.onload = () => {
		post({ type: "image", url, loaded: true })
		schedule()
	}
	image.onerror = () => {
		images.delete(url)
		post({ type: "image", url, loaded: false })
	}
	image.src = url
}

const draw = (target, scale) => {
	target.width = Math.round(width * scale)
	target.height = Math.round(height * scale)
	const image = state && images.get(state.image)
	if (!image || !image.naturalWidth) return false

	const context = target.getContext("2d")
	context.scale(scale, scale)
	const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight)
	context.drawImage(
		image,
		(width - image.naturalWidth * ratio) / 2,
		(height - image.naturalHeight * ratio) / 2,
		image.naturalWidth * ratio,
		image.naturalHeight * ratio,
	)

	context.font = state.fontSize + "px YurukaStd, SSFangTangTi"
	context.lineWidth = 9
	context.textAlign = "center"
	context.strokeStyle = "white"
	context.fillStyle = state.color
	context.translate(state.x, state.y)
	context.rotate(state.rotate / 10)

	const lines = state.text.split("\\n")
	if (state.curve) {
		const angle = (Math.PI * state.text.length) / 7
		for (const line of lines) {
			const characters = Array.from(line)
			for (const character of characters) {
				context.rotate(angle / characters.length / 2.5)
				context.save()
				context.translate(0, -state.fontSize * 3.5)
				context.strokeText(character, 0, -state.spacing)
				context.fillText(character, 0, -state.spacing)
				context.restore()
			}
		}
	} else {
		lines.forEach((line, index) => {
			context.strokeText(line, 0, index * state.spacing)
			context.fillText(line, 0, index * state.spacing)
		})
	}

	return true
}

Promise.all(
	${JSON.stringify(Fonts)}.map(([family, url]) =>
		new FontFace(family, "url(" + url + ")").load().then(
			face => {
				document.fonts.add(face)
				return 0
			},
			() => 1,
		),
	),
).then(results => {
	post({ type: "fonts", failed: results.reduce((total, failed) => total + failed, 0) })
	schedule()
})

window.sekai = {
	update(next) {
		const changed = !state || state.image !== next.image
		state = next
		const image = images.get(next.image)
		if (!image) load(next.image)
		else if (changed && image.naturalWidth) post({ type: "image", url: next.image, loaded: true })
		schedule()
	},
	exportImage(id) {
		try {
			const output = document.createElement("canvas")
			if (!draw(output, 1)) throw new Error("The sticker image has not loaded yet")
			post({ type: "export", id, data: output.toDataURL("image/png") })
		} catch (error) {
			post({ type: "export", id, error: String(error && error.message ? error.message : error) })
		}
	},
}

addEventListener("resize", schedule)
post({ type: "ready" })
`

export const RendererSource = {
	baseUrl: 'https://localhost',
	html: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}canvas{display:block;width:100%;height:100%}</style></head><body><canvas></canvas><script>${RendererScript}</script></body></html>`,
}
