import { defaultTo } from "lodash";

interface SparkCloudErrorOptions {
  children?: unknown[];
  context?: unknown;
  exit?: number;
  original?: Error;
  status?: number;
}

const DEFAULT_CHILDREN: NonNullable<SparkCloudErrorOptions["children"]> = [];
const DEFAULT_EXIT: NonNullable<SparkCloudErrorOptions["exit"]> = 1;
const DEFAULT_STATUS: NonNullable<SparkCloudErrorOptions["status"]> = 500;

export class SparkCloudError extends Error {
	readonly children: unknown[];
	readonly context: unknown | undefined;
	readonly exit: number;
	readonly message: string;
	readonly name = "SparkCloudError";
	readonly original: Error | undefined;
	readonly status: number;

	constructor(message: string, options: SparkCloudErrorOptions = {}) {
		super();

		this.children = defaultTo(options.children, DEFAULT_CHILDREN);
		this.context = options.context;
		this.exit = defaultTo(options.exit, DEFAULT_EXIT);
		this.message = message;
		this.original = options.original;
		this.status = defaultTo(options.status, DEFAULT_STATUS);
	}
}