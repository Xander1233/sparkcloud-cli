import { SparkCloudError } from "../../../error";
import { DEFAULT_CODEBASE, assertUnique, configForCodebase, normalizeAndValidate, validateCodebase } from "../../../functions/projectConfig";
import { logger } from "../../../logger";
import { createNewCodebase } from "../../../management/codebase";
import { promptOnce } from "../../../prompt";
import * as clc from "colorette";

const MAX_ATTEMPTS = 5;

export async function doSetup(setup: any, config: any, options?: any): Promise<void> {
	
	const projectId = setup?.rcfile?.project?.name;

	if (!projectId) {
		throw new SparkCloudError(`No project selected.`);
	}

	setup.functions = {};

	if (!config.src.functions) {
		setup.config.functions = [];
		return initNewCodebase(setup, config, options);
	}

	setup.config.functions = normalizeAndValidate(setup.config.functions);

	const codebases = setup.config.functions.map((cfg: any) => clc.bold(cfg.codebase));
	logger.info(`\nDetected existing codebase(s): ${codebases.join(", ")}\n`);

	const choices = [
		{
			name: 'Initialize',
			value: 'new'
		}, {
			name: 'Overwrite',
			value: 'overwrite'
		}
	];

	const initOp = await promptOnce({
		type: 'list',
		name: 'initOp',
		message: 'Would you like to initialize a new codebase or overwrite an existing one?',
		default: 'new',
		choices: choices,
	});

	return initOp === 'new' ? initNewCodebase(setup, config, options) : initExistingCodebase(setup, config);
}

async function initNewCodebase(setup: any, config: any, options: any) {

	let source: string;
	let codebase: string;

	if (setup.config.functions.length === 0) {
		source = "functions";
		codebase = DEFAULT_CODEBASE;
	} else {
		let attempt = 0;

		while(true) {
			if (attempt++ >= MAX_ATTEMPTS) {
				throw new SparkCloudError(`Exceeded maximum number of attempts to input a valid codebase name. Please restart`);
			}
			codebase = await promptOnce({
				type: 'input',
				name: 'codebaseName',
				message: 'What should be the name of the codebase?',
				default: DEFAULT_CODEBASE,
			});
			try {
				validateCodebase(codebase);
				assertUnique(setup.config.functions, 'codebase', codebase);
				break;
			} catch(e: any) {
				logger.error(new SparkCloudError(`Error: ${e}`));
			}
		}
		
		logger.debug(`New codebase name: ${codebase}`);

		attempt = 0;

		while(true) {
			if (attempt++ >= MAX_ATTEMPTS) {
				throw new SparkCloudError(`Exceeded maximum number of attempts to input a valid source folder. Please restart`);
			}
			source = await promptOnce({
				type: 'input',
				name: 'sourceFolder',
				message: 'What folder should be used as source?',
				default: 'functions',
			});
			try {
				assertUnique(setup.config.functions, 'source', source);
				break;
			} catch(e: any) {
				logger.error(new SparkCloudError(`Error: ${e}`));
			}
		}
	}

	setup.config.functions.push({
		source, codebase
	});

	await createNewCodebase(setup.rcfile.project.name, codebase, options.auth);

	setup.functions.source = source;
	setup.functions.codebase = codebase;
	return languageSetup(setup, config);
}

async function initExistingCodebase(setup: any, config: any) {
	let codebase: string;

	if (setup.config.functions.length > 1) {
		const choices = setup.config.functions.map((cfg: any) => ({
			name: cfg.codebase,
			value: cfg.codebase
		}));

		codebase = await promptOnce({
			type: 'list',
			message: 'Which codebase should be overwritten?',
			choices,
		});
	} else {
		codebase = setup.config.functions[0].codebase;
	}

	const cbconfig = configForCodebase(setup.config.functions, codebase);
	setup.functions.source = cbconfig.source;
	setup.functions.codebase = codebase;
	setup.overwrite = true;

	logger.info(`\nOverwriting ${clc.bold(`codebase ${codebase}`)}...\n`);
	return languageSetup(setup, config);
}

async function languageSetup(setup: any, config: any) {
	
	const choices = [
		{
			name: 'JavaScript',
			value: 'javascript'
		},
		{
			name: 'TypeScript',
			value: 'typescript'
		}
	];

	const language = await promptOnce({
		type: 'list',
		name: 'language',
		message: 'What language should be used?',
		default: 'typescript',
		choices: choices,
	});

	return require(`./${language}`).setup(setup, config);
}