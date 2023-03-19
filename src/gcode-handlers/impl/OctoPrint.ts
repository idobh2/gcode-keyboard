import { GCodeHandler, GCodeHandlerDataField } from "../GCodeHandler";

export interface OctoPrintData {
	token: string;
}

export default class OctoPrint implements GCodeHandler {
	constructor(readonly address: string, readonly data: OctoPrintData) {

	}
	healthcheck(): Promise<void> {
		throw new Error("Healthcheck not implemented");
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