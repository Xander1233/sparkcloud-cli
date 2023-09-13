export const SUPPORTED_REGIONS = [ "eu-central", "eu-west", "eu-east", "us-central", "us-west", "us-east" ] as const;

export const VALID_MEMORY_OPTIONS = [ "128m", "256m", "512m", "1g", "2g", "4g", "8g" ] as const;

export const MAX_TIMEOUT_SECONDS = 540 as const;

export const MIN_TIMEOUT_SECONDS = 0 as const;

export const MAX_CPU_COUNTS = 4 as const;

export const MIN_CPU_COUNTS = 1 as const;

export const MIN_MINIMUM_INSTANCES = 0 as const;

export const MAX_MINIMUM_INSTANCES = 20 as const;

export type Regions = typeof SUPPORTED_REGIONS[number][];