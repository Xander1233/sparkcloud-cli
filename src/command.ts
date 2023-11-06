import * as clc from 'colorette';
import { CommanderStatic } from 'commander';
import { first, last, get, size, head, keys, values } from 'lodash';

import { SparkCloudError } from './error';
import { getInheritedOption, setupLoggers } from './utils';
import { loadRC } from './rc';
import { Config } from './config';
import { configstore } from './configstore';
import { getSparkCloudProject } from './management/projects';
import { requireAuth } from './requireAuth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionFunction = (...args: any[]) => any;

interface BeforeFunction {
	fn: ActionFunction;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	args: any[];
}

interface CLIClient {
	cli: CommanderStatic;
	errorOut: (e: Error) => void;
}

/**
 * Command is a wrapper around commander to simplify our use of promise-based
 * actions and pre-action hooks.
 */
export class Command {
	private name = '';
	private descriptionText = '';
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private options: any[][] = [];
	private actionFn: ActionFunction = (): void => {
		// noop by default, unless overwritten by `.action(fn)`.
	};
	private befores: BeforeFunction[] = [];
	private helpText = '';
	private client?: CLIClient;
	private positionalArgs: { name: string; required: boolean }[] = [];

	/**
	 * @param cmd the command to create.
	 */
	constructor(private cmd: string) {
		this.name = first(cmd.split(' ')) || '';
	}

	/**
	 * Sets the description of the command.
	 * @param t a human readable description.
	 * @return the command, for chaining.
	 */
	description(t: string): Command {
		this.descriptionText = t;
		return this;
	}

	/**
	 * Sets any options for the command.
	 *
	 * @example
	 *   command.option("-d, --debug", "turn on debugging", false)
	 *
	 * @param args the commander-style option definition.
	 * @return the command, for chaining.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	option(...args: any[]): Command {
		this.options.push(args);
		return this;
	}

	/**
	 * Sets up --force flag for the command.
	 *
	 * @param message overrides the description for --force for this command
	 * @returns the command, for chaining
	 */
	withForce(message?: string): Command {
		this.options.push(['-f, --force', message || 'automatically accept all interactive prompts']);
		return this;
	}

	/**
	 * Attaches a function to run before the command's action function.
	 * @param fn the function to run.
	 * @param args arguments, as an array, for the function.
	 * @return the command, for chaining.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	before(fn: ActionFunction, ...args: any[]): Command {
		this.befores.push({ fn: fn, args: args });
		return this;
	}

	/**
	 * Sets the help text for the command.
	 *
	 * This text is displayed when:
	 *   - the `--help` flag is passed to the command, or
	 *   - the `help <command>` command is used.
	 *
	 * @param t the human-readable help text.
	 * @return the command, for chaining.
	 */
	help(t: string): Command {
		this.helpText = t;
		return this;
	}

	/**
	 * Sets the function to be run for the command.
	 * @param fn the function to be run.
	 * @return the command, for chaining.
	 */
	action(fn: ActionFunction): Command {
		this.actionFn = fn;
		return this;
	}

	/**
	 * Registers the command with the client. This is used to initially set up
	 * all the commands and wraps their functionality with analytics and error
	 * handling.
	 * @param client the client object (from src/index.js).
	 */
	register(client: CLIClient): void {
		this.client = client;
		const program = client.cli;
		const cmd = program.command(this.cmd);
		if (this.descriptionText) {
			cmd.description(this.descriptionText);
		}
		this.options.forEach((args) => {
			const flags = args.shift();
			cmd.option(flags, ...args);
		});

		if (this.helpText) {
			cmd.on('--help', () => {
				console.log(); // Seperates the help text from global options.
				console.log(this.helpText);
			});
		}

		// See below about using this private property
		this.positionalArgs = cmd._args;

		// args is an array of all the arguments provided for the command PLUS the
		// options object as provided by Commander (on the end).
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		cmd.action((...args: any[]) => {
			const runner = this.runner();
			const start = process.uptime();
			const options = last(args);
			
			if (args.length - 1 > cmd._args.length) {
				client.errorOut(new SparkCloudError(`Too many arguments. Run ${clc.bold('sparkcloud help ' + this.name)} for usage instructions`, { exit: 1 }));
				return;
			}

			runner(...args)
				.then(async (result) => {
					if (getInheritedOption(options, 'json')) {
						await new Promise((resolve) => {
							process.stdout.write(
								JSON.stringify(
									{
										status: 'success',
										result: result,
									},
									null,
									2
								),
								resolve
							);
						});
					}
					const duration = Math.floor((process.uptime() - start) * 1000);
					process.exit();
				})
				.catch(async (err) => {
					if (getInheritedOption(options, 'json')) {
						await new Promise((resolve) => {
							process.stdout.write(
								JSON.stringify(
									{
										status: 'error',
										error: err.message,
									},
									null,
									2
								),
								resolve
							);
						});
					}

					client.errorOut(err);
				});
		});
	}

	/**
	 * Extends the options with various properties for use in commands.
	 * @param options the command options object.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public async prepare(options: any): Promise<void> {
		options = options || {};
		options.project = getInheritedOption(options, 'project');

		if (!process.stdin.isTTY || getInheritedOption(options, 'nonInteractive')) {
			options.nonInteractive = true;
		}
		// allow override of detected non-interactive with --interactive flag
		if (getInheritedOption(options, 'interactive')) {
			options.interactive = true;
			options.nonInteractive = false;
		}

		if (getInheritedOption(options, 'debug')) {
			options.debug = true;
		}

		if (getInheritedOption(options, 'json')) {
			options.nonInteractive = true;
		} else {
			setupLoggers();
		}

		if (getInheritedOption(options, 'config')) {
			options.configPath = getInheritedOption(options, 'config');
		}

		try {
			options.config = Config.load(options);
		} catch (e: any) {
			options.configError = e;
		}

		this.applyRC(options);
		if (options.project) {
			await this.resolveProjectIdentifiers(options);
			validateProjectId(options.projectId);
		}
	}

	/**
	 * Apply configuration from .sparkcloudrc files in the working directory tree.
	 * @param options the command options object.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private applyRC(options: any): void {
		const rc = loadRC(options);
		options.rc = rc;

		options.project = options.project || (configstore.get('activeProjects') || {})[options.projectRoot];
		// support deprecated "firebase" key in firebase.json
		if (options.config && !options.project) {
			options.project = options.rc.data.project.name;
		}
	}

	private async resolveProjectIdentifiers(options: { project?: string; projectId?: string; projectNumber?: string }): Promise<void> {
		if (options.project?.match(/^\d+$/)) {
			await requireAuth();
			const { pid } = await getSparkCloudProject(options.project);
			options.projectId = pid;
		} else {
			options.projectId = options.project;
		}
	}

	/**
	 * Returns an async function that calls the pre-action hooks and then the
	 * command's action function.
	 * @return an async function that executes the command.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	runner(): (...a: any[]) => Promise<any> {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return async (...args: any[]) => {
			// Make sure the last argument is an object for options, add {} if none
			if (typeof last(args) !== 'object' || last(args) === null) {
				args.push({});
			}

			// Args should have one entry for each positional arg (even the optional
			// ones) and end with options.
			while (args.length < this.positionalArgs.length + 1) {
				// Add "" for missing args while keeping options at the end
				args.splice(args.length - 1, 0, '');
			}

			const options = last(args);
			await this.prepare(options);

			for (const before of this.befores) {
				await before.fn(options, ...before.args);
			}
			return this.actionFn(...args);
		};
	}
}

const PROJECT_ID_REGEX = /^[a-zA-Z0-9-]{5,20}-\d{5,10}$/;

export function validateProjectId(projectId: string) {
	
	if (PROJECT_ID_REGEX.test(projectId)) {
		return;
	}

	const invalidMessage = `Invalid project id: ${clc.bold(projectId)}.`;
	if (projectId.toLowerCase() !== projectId) {
		throw new SparkCloudError(`${invalidMessage}\nNote: Project id must be all lowercase.`);
	}
	throw new SparkCloudError(`${invalidMessage}`);
}