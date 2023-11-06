import { readFileSync, statSync } from 'node:fs';
import { LogLevel, logger } from './logger';
import * as clc from 'colorette';
import { SparkCloudError } from './error';
import winston from 'winston';
import { SPLAT } from 'triple-beam';
import stripAnsi from 'strip-ansi';

const IS_WINDOWS = process.platform === 'win32';
export const SUCCESS_CHAR = IS_WINDOWS ? '+' : '✔';
export const WARNING_CHAR = IS_WINDOWS ? '!' : '⚠';
export const ERROR_CHAR = IS_WINDOWS ? '!!' : '⬢';
export const THIRTY_DAYS_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;

export function logSuccess(message: string, type: LogLevel = 'info', data: any = undefined) {
	logger[type](clc.green(clc.bold(`${SUCCESS_CHAR} `)), message, data);
}

export function logLabeledSuccess(label: string, message: string, type: LogLevel = 'info', data: any = undefined): void {
	logger[type](clc.green(clc.bold(`${SUCCESS_CHAR}  ${label}:`)), message, data);
}

export function logBullet(message: string, type: LogLevel = 'info', data: any = undefined): void {
	logger[type](clc.cyan(clc.bold(`i `)), message, data);
}

export function logLabeledBullet(label: string, message: string, type: LogLevel = 'info', data: any = undefined): void {
	logger[type](clc.cyan(clc.bold(`i  ${label}:`)), message, data);
}

export function logWarning(message: string, type: LogLevel = 'warn', data: any = undefined): void {
	logger[type](clc.yellow(clc.bold(`${WARNING_CHAR} `)), message, data);
}

export function logLabeledWarning(label: string, message: string, type: LogLevel = 'warn', data: any = undefined): void {
	logger[type](clc.yellow(clc.bold(`${WARNING_CHAR}  ${label}:`)), message, data);
}

export function logError(message: string, type: LogLevel = 'error', data: any = undefined): void {
	logger[type](clc.red(clc.bold(`${ERROR_CHAR} `)), message, data);
}

export function logLabeledError(label: string, message: string, type: LogLevel = 'error', data: any = undefined): void {
	logger[type](clc.red(clc.bold(`${ERROR_CHAR}  ${label}:`)), message, data);
}

export function tryStringify(value: any) {
	if (typeof value === 'string') {
		return value;
	}

	try {
		return JSON.stringify(value);
	} catch (e) {
		return value;
	}
}

export function fileExistsSync(path: string): boolean {
	try {
		return statSync(path).isFile();
	} catch (e: any) {
		return false;
	}
}

export function dirExistsSync(path: string): boolean {
	try {
		return statSync(path).isDirectory();
	} catch (e: any) {
		return false;
	}
}

export function readFile(path: string): string {
	try {
		return readFileSync(path).toString();
	} catch (e: unknown) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
			throw new Error(`File ${path} does not exist.`);
		}
		throw e;
	}
}

export function setupLoggers() {
	if (process.env.DEBUG) {
		logger.add(
			new winston.transports.Console({
				level: 'debug',
				format: winston.format.printf((info) => {
					const segments = [info.message, ...(info[SPLAT] || [])].map(tryStringify);
					return `${stripAnsi(segments.join(' '))}`;
				}),
			})
		);
	} else if (process.env.IS_SPARKCLOUD_CLI) {
		logger.add(
			new winston.transports.Console({
				level: 'info',
				format: winston.format.printf((info) => [info.message, ...(info[SPLAT] || [])].filter((chunk) => typeof chunk === 'string').join(' ')),
			})
		);
	}
}

export function withTimeout<T>(timeoutMs: number, promise: Promise<T>): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timeout = setTimeout(() => reject(new Error('Timed out.')), timeoutMs);
		promise.then(
			(value) => {
				clearTimeout(timeout);
				resolve(value);
			},
			(err) => {
				clearTimeout(timeout);
				reject(err);
			}
		);
	});
}

export function getInheritedOption(options: any, key: string): any {
	let target = options;
	while (target) {
		if (target[key] !== undefined) {
			return target[key];
		}
		target = target.parent;
	}
}

export function envOverride(
	envname: string,
	value: string,
	coerce?: (value: string, defaultValue: string) => any
): string {
	const currentEnvValue = process.env[envname];
	if (currentEnvValue && currentEnvValue.length) {
		if (coerce) {
			try {
				return coerce(currentEnvValue, value);
			} catch (e: any) {
				return value;
			}
		}
		return currentEnvValue;
	}
	return value;
}

export function consoleUrl(projectId: string, path: string) {
	return `https://console.sparkcloud.link/projects/${projectId}${path}`;
}

export function isVSCodeExtension(): boolean {
	return !!process.env.VSCODE_CWD;
}