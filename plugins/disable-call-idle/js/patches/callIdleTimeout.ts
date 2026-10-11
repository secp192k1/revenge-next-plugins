import { getModuleWithImportedPath } from '@revenge-mod/discord/utils/modules/finders'
import { getModules } from '@revenge-mod/modules/finders'
import { withProps } from '@revenge-mod/modules/finders/filters'
import { instead } from '@revenge-mod/patcher'
import { LOG_TAG } from '../constants'

interface IdleTimeout {
	start: (...args: any[]) => unknown
	stop: () => unknown
}

interface CallIdleManager {
	idleTimeout: IdleTimeout
	handleVoiceStateUpdates: (...args: any[]) => unknown
}
export default function patchCallIdleTimeout(): () => void {
	let unpatchStart: (() => void) | undefined
	const unsubscribers: (() => void)[] = []

	function patchCallIdleManager(moduleExports: any, source: string) {
		if (unpatchStart) return

		const idleTimeout: IdleTimeout | undefined =
			moduleExports?.idleTimeout ?? moduleExports?.default?.idleTimeout

		if (typeof idleTimeout?.start !== 'function') {
			console.error(`${LOG_TAG} idleTimeout.start not found via ${source}`)
			return
		}

		idleTimeout.stop()
		unpatchStart = instead(idleTimeout, 'start', () => undefined)

		for (const unsubscribe of unsubscribers) unsubscribe()

		console.log(`${LOG_TAG} call idle timeout disabled via ${source}`)
	}

	unsubscribers.push(
		getModuleWithImportedPath(
			'modules/voice_calls/CallIdleManager.tsx',
			moduleExports => patchCallIdleManager(moduleExports, 'path'),
		),
		getModules(
			withProps<CallIdleManager>('idleTimeout', 'handleVoiceStateUpdates'),
			moduleExports => patchCallIdleManager(moduleExports, 'props'),
			{ max: 1 },
		),
	)

	return () => {
		for (const unsubscribe of unsubscribers) unsubscribe()
		unpatchStart?.()
	}
}
