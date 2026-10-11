import { LOG_TAG } from './constants'
import patchCallIdleTimeout from './patches/callIdleTimeout'

export default plugin({
	start({ cleanup }) {
		try {
			cleanup(patchCallIdleTimeout())
		} catch (error) {
			console.error(`${LOG_TAG} patch install failed`, error)
		}
	},
})
