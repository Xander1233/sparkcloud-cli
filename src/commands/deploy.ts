import * as clc from 'colorette';

import { Command } from '../command';
import { logger } from '../logger';
import { logWarning } from '../utils';
import { requireAuthCmd } from '../requireAuth';
import { requireConfig } from '../requireConfig';
import { deploy } from '../deploy';
import { filterTargets } from '../filterTargets';
import { PERMISSION } from '../permissions';
import { requirePermissions } from '../requirePermissions';
import { checkValidTargetFilters } from '../checkValidTargetFilters';

export const VALID_DEPLOY_TARGETS = [
	'functions'
];

export const TARGET_PERMISSIONS: { [key: string]: (pid: string) => string[] } = {
	'functions': (pid: string) => {
		return [
			PERMISSION.project(pid).cloudResources.function.create,
			PERMISSION.project(pid).cloudResources.function.get,
			PERMISSION.project(pid).cloudResources.function.update,
			PERMISSION.project(pid).cloudResources.function.delete
		]
	}
};

export const command = new Command('deploy')
	.description('deploy code and assets to your sparkcloud project')
	.withForce('delete cloud functions missing from the current working directory without confirmation')
	.option('-m, --message <message>', 'an optional message describing this deploy')
	.option(
		'--only <targets>', 'only deploy to specified, comma-separated targets (e.g. "functions,storage"). For functions ' +
		'deploys, can specify filters with colons to scope function deploys to only those functions (e.g. "--only functions:func1,functions:func2"). ' +
		''
	)
	.before(requireAuthCmd)
	.before(requireConfig)
	.before((options) => {
		options.filteredTargets = filterTargets(options, VALID_DEPLOY_TARGETS);
		const permissions: string[] = options.filteredTargets.reduce((perms: string[], target: (typeof VALID_DEPLOY_TARGETS[number])) => {
			return perms.concat(...TARGET_PERMISSIONS[target](options.projectId));
		}, []);
		return requirePermissions(options, permissions);
	})
	.before(checkValidTargetFilters)
	.action(function (options) {
		return deploy(options.filteredTargets, options);
	});