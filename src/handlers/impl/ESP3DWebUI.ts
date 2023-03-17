import GCodeHandler from "../GCodeHandler";

export interface ESP3DWebUIData {
	user: string;
	pass: string;
}


export default class ESP3DWebUI implements GCodeHandler {
	constructor(readonly address: string, readonly data: ESP3DWebUIData) {

	}
	healthcheck(): Promise<void> {
		throw new Error("Healthcheck not implemented");
	}
}