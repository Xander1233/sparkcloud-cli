type CloudFunctionRuntimes =
  | "nodejs10"
  | "nodejs12"
  | "nodejs14"
  | "nodejs16"
  | "nodejs18"
  | "nodejs20";

export type Deployable = {
  predeploy?: string | string[];
  postdeploy?: string | string[];
};

export type FunctionConfig = {
  source?: string;
  ignore?: string[];
  runtime?: CloudFunctionRuntimes;
  codebase?: string;
} & Deployable;

export type FunctionsConfig = FunctionConfig | FunctionConfig[];

export type SparkCloudConfig = {
  /**
   * @TJS-format uri
   */
  $schema?: string;
  functions?: FunctionsConfig;
};