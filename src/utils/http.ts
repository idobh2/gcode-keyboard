import * as http from "http";

export type HttpMethod = "GET" | "POST" | "HEAD";

export interface RequestOptions {
	method?: HttpMethod;
	headers?: Record<string, string | number>;
	body?: string | Record<string, unknown>;
}

export function request(reqUrl: string, options: RequestOptions = {}): Promise<string> {
	return new Promise(function (resolve) {
		const { method = "GET", headers = {}, body } = options;
		let serializedBody: string | undefined;
		if ("POST" === method && body) {
			serializedBody = "string" === typeof body ? body : JSON.stringify(body);
			headers["Content-Type"] = "application/json";
			headers["Content-Length"] = serializedBody.length;
		}
		const req = http.request({
			...url.parse(reqUrl, true),
			method,
			headers,
		}, (res) => {
			let data = "";
			res.on("data", function (chunk) {
				data += chunk;
			});
			res.on("close", function () {
				resolve(data);
			});
		});
		req.end(serializedBody);
	});
}