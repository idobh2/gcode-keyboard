import { request } from "../../utils";
import { GCodeHandler, GCodeHandlerDataField } from "../GCodeHandler";

export interface OctoPrintData {
	token: string;
}

export default class OctoPrint implements GCodeHandler {
	constructor(private readonly address: string, private readonly data: OctoPrintData) {

	}
	private apiRequest<T = Record<string, unknown>>(path: string): Promise<T> {
		return request(`${this.address}/api/${path}`, { headers: { "x-api-key": this.data.token } }).then(r => JSON.parse(r)).then(response => {
			if (response.error) {
				return Promise.reject(new Error(response.error));
			}
			return response;
		});
	}
	healthcheck(): Promise<void> {
		return this.apiRequest("version");
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