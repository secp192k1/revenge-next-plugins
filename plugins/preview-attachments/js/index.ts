import { registerPreviewMethod } from './lib/registerPreviewMethod'
import { sendPreviewableExtensions } from './lib/sendPreviewableExtensions'

export default plugin({
	start({ cleanup }) {
		cleanup(registerPreviewMethod(), sendPreviewableExtensions())
	},
})
