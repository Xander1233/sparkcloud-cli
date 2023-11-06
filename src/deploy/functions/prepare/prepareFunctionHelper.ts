import { DEFAULT_CODEBASE, ValidatedConfig } from "../../../functions/projectConfig";

export interface EndpointFilter {
	codebase?: string;
	functions?: string[];
}

export function parseFunctionSelector(selector: string): EndpointFilter[] {

	const fragments = selector.split(":");

	if (fragments.length < 2) {
		return [
			{ codebase: fragments[0] },
			{ codebase: DEFAULT_CODEBASE, functions: fragments[0].split(/[-.]/) }
		];
	}

	return [
		{
			codebase: fragments[0],
			functions: fragments[1].split(/[-.]/)
		}
	];
}

export function getEndpointFilters(options: { only?: string }): EndpointFilter[] | undefined {

	if (!options.only) {
		return undefined;
	}

	const selectors = options.only.split(",");
	const filters: EndpointFilter[] = [];

	for (let selector of selectors) {
		if (selector.startsWith("functions:")) {
			selector = selector.replace("functions:", "");
			if (selector.length > 0) {
				filters.push(...parseFunctionSelector(selector));
			}
		}
	}

	if (filters.length === 0) {
		return undefined;
	}

	return filters;
}

export function targetCodebases(config: ValidatedConfig, filters?: EndpointFilter[]): string[] {
	const codebasesFromConfig = [...new Set(Object.values(config).map((c) => c.codebase))];
	if (!filters) {
	  return [...codebasesFromConfig];
	}
  
	const codebasesFromFilters = [
	  ...new Set(filters.map((f) => f.codebase).filter((c) => c !== undefined)),
	];
  
	if (codebasesFromFilters.length === 0) {
	  return [...codebasesFromConfig];
	}
  
	const intersections: string[] = [];
	for (const codebase of codebasesFromConfig) {
	  if (codebasesFromFilters.includes(codebase)) {
		intersections.push(codebase);
	  }
	}
	return intersections;
  }