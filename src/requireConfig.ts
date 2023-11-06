import { SparkCloudError } from "./error";

/**
 * Rejects if there is no config in `options`.
 */
export async function requireConfig(options: any): Promise<void> {
  return new Promise((resolve, reject) =>
    options.config
      ? resolve()
      : reject(
          options.configError ??
            new SparkCloudError(
              "Not in a Firebase project directory (could not locate firebase.json)"
            )
        )
  );
}