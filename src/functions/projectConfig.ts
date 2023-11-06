import { SparkCloudError } from "../error";
import { FunctionConfig, FunctionsConfig } from "../sparkCloudConfig";

export const DEFAULT_CODEBASE = "default";

export type NormalizedConfig = [FunctionConfig, ...FunctionConfig[]];
export type ValidatedSingle = FunctionConfig & { source: string, codebase: string };
export type ValidatedConfig = [ValidatedSingle, ...ValidatedSingle[]];

export function normalize(config?: FunctionsConfig): NormalizedConfig {
	if (!config) {
	  throw new SparkCloudError("No valid functions configuration detected in firebase.json");
	}

	if (Array.isArray(config)) {
	  if (config.length < 1) {
		throw new SparkCloudError("Requires at least one functions.source in firebase.json.");
	  }
	  // Unfortunately, Typescript can't figure out that config has at least one element. We assert the type manually.
	  return config as NormalizedConfig;
	}
	return [config];
}

export function validateCodebase(codebaseName: string) {
	if (codebaseName.length === 0 || codebaseName.length > 63 || !/^[a-z0-9_-]+$/.test(codebaseName)) {
		throw new SparkCloudError(`Invalid codebase name: ${codebaseName}. Codebase name must be between 1 and 63 characters long and can only contain lowercase letters, numbers, hyphens and underscores.`);
	}
}

export function assertUnique(
	config: ValidatedConfig,
	property: keyof ValidatedSingle,
	propval?: string
  ): void {
	const values = new Set();
	if (propval) {
	  values.add(propval);
	}
	for (const single of config) {
	  const value = single[property];
	  if (values.has(value)) {
		throw new SparkCloudError(
		  `functions.${property} must be unique but '${value}' was used more than once.`
		);
	  }
	  values.add(value);
	}
  }

export function configForCodebase(config: ValidatedConfig, codebase: string): ValidatedSingle {
	const codebaseCfg = config.find((c) => c.codebase === codebase);
	if (!codebaseCfg) {
		throw new SparkCloudError(`No functions config found for codebase ${codebase}`);
	}
	return codebaseCfg;
}

function validateSingle(config: any): ValidatedSingle {
	if (!config.source) {
		throw new SparkCloudError("codebase source must be specified");
	}
	if (!config.codebase) {
		config.codebase = DEFAULT_CODEBASE;
	}
	validateCodebase(config.codebase);
  
	return { ...config, source: config.source, codebase: config.codebase };
}

export function validate(config: NormalizedConfig): ValidatedConfig {
	const validated = config.map((cfg) => validateSingle(cfg)) as ValidatedConfig;
	assertUnique(validated, "source");
	assertUnique(validated, "codebase");
	return validated;
}

export function normalizeAndValidate(config?: FunctionsConfig): ValidatedConfig {
	return validate(normalize(config));
}