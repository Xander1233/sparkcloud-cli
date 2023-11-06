import program from 'commander';
import * as clc from 'colorette';
import leven from 'leven';
import { logger } from './logger';
import { errorOut } from './errorOut';
import { setupLoggers } from './utils';

const pkg = require('../package.json');

program.version(pkg.version);
program.option(
	'-P, --project <alias_or_project_id>',
	"the sparkcloud project to use for this command"
);
program.option(
	'--account <email>',
	'the sparkcloud account to use for authorization'
);
program.option(
	'-j, --json',
	'output JSON instead of text, also triggers non-interactive mode'
);
program.option(
	'--non-interactive',
	'error out of the command instead of waiting for prompts'
);
program.option(
	'-i, --interactive',
	'force prompts to be displayed'
);
program.option(
	'--debug',
	'print verbose debug output and keep a debug log file'
);

const client = {
	cli: program,
	logger,
	errorOut,
	getCommand: (name: string) => {
		for (let i = 0; i < client.cli.commands.length; i++) {
			const command = client.cli.commands[i];
			if (command._name === name) {
				return command;
			}
		}
		return;
	}
};

require('./commands').load(client);

function suggestCommands(cmd: string, cmdList: string[]): string | undefined {

	const suggestion = cmdList.find((c) => {
		return leven(c, cmd) < c.length * 0.4;
	});

	if (suggestion) {
		logger.error();
		logger.error(`Did you mean ${clc.bold(suggestion)}?`);
		return suggestion;
	}
}

const commandNames = program.commands.map((c: any) => c._name);

program.action((_, args) => {
	setupLoggers();

	const cmd = args[0];
	logger.error(clc.bold(clc.red("Error:")), clc.bold(cmd), "is not a SparkCloud command");

	if (!suggestCommands(cmd, commandNames)) {
		suggestCommands(args.join(':'), commandNames);
	}

	process.exit(1);
});

export = client;