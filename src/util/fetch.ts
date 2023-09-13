import { RequestInit, RequestInfo } from "node-fetch";
import { Debuglog } from "../debuglogs";
import * as nodeFetch from "node-fetch";

export async function fetch(url: RequestInfo, options: RequestInit) {

	await Debuglog.instance.debug(`[REQ] ${options.method ?? "N/A"} ${url}`);
	const response = await nodeFetch.default(url, options);

	const body = await response.json();

	await Debuglog.instance.debug(`[RES] [body] ${options.method} ${url} ${JSON.stringify(body)}`);
	await Debuglog.instance.debug(`[RES] [status] ${options.method} ${url} ${response.status}`);

	return { body, response };
}

export default fetch;