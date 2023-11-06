#!/usr/bin/env node
import * as semver from 'semver';
const pkg = require('../../package.json');
const nodeVersion = process.version;
if (!semver.satisfies(nodeVersion, pkg.engines.node)) {
	console.error(`SparkCloud CLI v${pkg.version} is incompatible with Node.js ${nodeVersion}. Please upgrade Node.js to version ${pkg.engines.node} or higher.`);
	process.exit(1);
}

import updateNotifierPkg from 'update-notifier-cjs';
import TerminalRenderer from 'marked-terminal';
const updateNotifier = updateNotifierPkg({ pkg });
import { marked } from 'marked';
marked.setOptions({
	renderer: new TerminalRenderer()
});

import { SPLAT } from 'triple-beam';
import stripAnsi from 'strip-ansi';
import { join } from 'node:path';
import * as fs from 'node:fs';

import { logger } from '../logger';
import * as utils from '../utils';
import { errorOut } from '../errorOut';
import * as winston from 'winston';

import * as client from '..';

let args = process.argv.slice(2);

function findLogFileName() {
	const candidates = ["sparkcloud-debug.log"];
	for (let i = 1; i < 10; i++) {
		candidates.push(`sparkcloud-debug.${i}.log`);
	}

	for (const c of candidates) {
		const logFilename = join(process.cwd(), c);

		try {
			const fd = fs.openSync(logFilename, "r+");
			fs.closeSync(fd);
			continue;
		} catch (e: any) {
			if (e.code === "ENOENT") {
				// File does not exist, which is fine
				return logFilename;
			}

			// Any other error (EPERM, etc) means we won't be able to log to
			// this file so we skip it.
		}
	}

	throw new Error("Unable to obtain permissions for sparkcloud-debug.log");
}

const logFilename = findLogFileName();

if (!process.env.DEBUG && args.includes("--debug")) {
	process.env.DEBUG = "true";
}

process.env.IS_SPARKCLOUD_CLI = "true";

const command = args[0];

if (!command) {
	console.log("No command specified.");
	process.exit(1);
}

logger.add(
	new winston.transports.File({
		level: 'debug',
		filename: logFilename,
		format: winston.format.printf((info) => {
			const segments = [ info.message, ...(info[SPLAT] || []) ].map(utils.tryStringify);
			return `[${info.level}] ${stripAnsi(segments.join(" "))}`;
		})
	})
);

logger.debug('-'.repeat(70));
logger.debug("Command:      ", process.argv.join(" "));
logger.debug("CLI Version:  ", pkg.version);
logger.debug("Platform:     ", process.platform);
logger.debug("Node Version: ", process.version);
logger.debug("Time:         ", new Date().toString());
logger.debug('-'.repeat(70));
logger.debug();

process.on('exit', (code) => {

	code = process.exitCode || code;

	if (!process.env.DEBUG && code < 2 && utils.fileExistsSync(logFilename)) {
		fs.unlinkSync(logFilename);
	}

	try {
		updateNotifier.notify({ isGlobal: true, defer: false });
	} catch(e) {
		logger.debug(`Error while notifiying about updates:`);
		if (e instanceof Error) {
			logger.debug(e);
		} else {
			logger.debug(`${e}`);
		}
	}
});

process.on('uncaughtException', (err) => {
	errorOut(err);
});

client.cli.parse(process.argv);