import GCodeHandler from "../GCodeHandler";

export interface OctoPrintData {
	token: string;
}

export default class OctoPrint implements GCodeHandler {
	constructor(readonly address: string, readonly data: OctoPrintData) {

	}
	healthcheck(): Promise<void> {
		throw new Error("Healthcheck not implemented");
	}
}