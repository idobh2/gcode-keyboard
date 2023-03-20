import { GCodeHandler, GCodeHandlerDataField } from "../GCodeHandler";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ESP3DWebUIData { }

export default class ESP3DWebUI implements GCodeHandler {
	constructor(private readonly address: string, private readonly data: ESP3DWebUIData) {

	}
	healthcheck(): Promise<void> {
		throw new Error("Healthcheck not implemented");
	}
	sendGCode(commands: string[]): Promise<void> {
		throw new Error(`Can't send commands:${commands.join(", ")}`);
	}
	static describeDataFields(): GCodeHandlerDataField<ESP3DWebUIData>[] {
		return [];
	}
}