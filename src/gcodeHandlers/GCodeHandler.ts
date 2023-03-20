export interface GCodeHandlerDataField<Data> {
	name: keyof Data;
	label: string;
	description: string;
	type: "text" | "password"
}

// using interface instead of class due to transpiling+espruino limitations
export interface GCodeHandler {
	healthcheck(): Promise<void>;
	sendGCode(commands: string[]): Promise<void>;
}

export interface GCodeHandlerClass<Data> {
	new(address: string, data: Data): GCodeHandler;
	describeDataFields(): GCodeHandlerDataField<Data>[];
}
