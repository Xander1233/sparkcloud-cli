import _fetch, { Response } from "node-fetch";
import * as clc from "colorette";

import { logger } from "./logger";
import { SparkCloudError } from "./error";

export async function fetch(requestUrl: string, requestOptions: {
	method: string,
	headers?: any,
	body?: any
}, otherOptions?: { bodyOptions?: { omitRequest?: boolean, omitResponse?: boolean } }): Promise<{ body: any, rawResponse: Response }> {

	logger.debug(`>>> [query] ${requestOptions.method} ${requestUrl} ${requestOptions.body !== '' ? otherOptions?.bodyOptions?.omitRequest ? "[omitted]" : requestOptions.body ?? '' : '[no body]'}`);

	const response = await _fetch(requestUrl, {
		method: requestOptions.method,
		headers: requestOptions.headers,
		body: requestOptions.body
	});

	const body = await response.json();

	logger.debug(`<<< [status] ${requestOptions.method} ${requestUrl} ${response.status}`);
	logger.debug(`<<< [body] ${requestOptions.method} ${requestUrl} ${otherOptions?.bodyOptions?.omitResponse ? "[omitted]" : JSON.stringify(body)}`);

	return { body, rawResponse: response };
}