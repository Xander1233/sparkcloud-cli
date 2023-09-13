import { VALID_MEMORY_OPTIONS } from "./consts";

export interface RuntimeOptions {
	memory?: typeof VALID_MEMORY_OPTIONS[number];
	timeoutSeconds?: number;
	cpu?: number;
	minimumInstances?: number;
};