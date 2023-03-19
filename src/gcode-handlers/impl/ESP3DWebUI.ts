import { GCodeHandler, GCodeHandlerDataField } from "../GCodeHandler";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ESP3DWebUIData { }

export default class ESP3DWebUI implements GCodeHandler {
	constructor(readonly address: string, readonly data: ESP3DWebUIData) {

	}
	healthcheck(): Promise<void> {
		throw new Error("Healthcheck not implemented");
	}
	static describeDataFields(): GCodeHandlerDataField<ESP3DWebUIData>[] {
		return [];
	}
}