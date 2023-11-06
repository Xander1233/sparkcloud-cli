import { logger } from "../../../logger";
import { promptOnce } from "../../../prompt";
import spawn from 'cross-spawn';

export async function askInstallDependencies(setup: any, config: any) {
	setup.npm = await promptOnce({
		type: 'confirm',
		name: 'npm',
		message: 'Do you want to install npm dependencies?',
		default: true
	});

	if (setup.npm) {
		return new Promise<void>((resolve) => {
			const installer = spawn('npm', ['install'], {
				cwd: config.projectDir + `/${setup.source}`,
				stdio: 'inherit'
			});

			installer.on('error', (err: any) => {
				logger.debug(err.stack);
			});

			installer.on('close', (code: any) => {
				if (code === 0) {
					return resolve();
				}
				logger.info();
				logger.error(`NPM install failed, continuing with sparkcloud initialization...`);
				return resolve();
			});
		});
	}
}