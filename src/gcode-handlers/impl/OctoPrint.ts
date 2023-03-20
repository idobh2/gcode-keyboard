import { HttpMethod, request } from "../../utils";
import { GCodeHandler, GCodeHandlerDataField } from "../GCodeHandler";

export interface OctoPrintData {
	token: string;
}

export default class OctoPrint implements GCodeHandler {
	constructor(private readonly address: string, private readonly data: OctoPrintData) {

	}
	private apiRequest<T = Record<string, unknown>>(path: string, method: HttpMethod = "GET", body?: Record<string, unknown>): Promise<T> {
		return request(
			`${this.address}/api/${path}`,
			{
				method,
				headers: {
					"content-type": "application/json",
					"x-api-key": this.data.token
				},
				body
			})
			.then(r => JSON.parse(r || "{}")).then(response => {
				if (response.error) {
					return Promise.reject(new Error(response.error));
				}
				return response;
			});
	}
	healthcheck(): Promise<void> {
		return this.apiRequest("version");
	}
	sendGCode(commands: string[]): Promise<void> {
		return this.apiRequest("printer/command", "POST", { commands, parameters: {} });
	}
	static describeDataFields(): GCodeHandlerDataField<OctoPrintData>[] {
		return [
			{
				name: "token",
				label: "Token",
				description: "API Token from the OctoPrint console",
				type: "password"
			}
		];
	}

}