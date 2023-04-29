import { request } from "../../utils";
import { GCodeHandler, GCodeHandlerDataField } from "../GCodeHandler";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ESP3DWebUIData {

}

export default class ESP3DWebUI implements GCodeHandler {
	constructor(private readonly address: string, private readonly data: ESP3DWebUIData) {
	}

	private sendGRBL(cmd: string): Promise<string> {
		return request(`${this.address}/command?commandText=${encodeURIComponent(cmd)}`);
	}
	healthcheck(): Promise<void> {
		return this.sendGRBL("?").then(() => { /* */ }) as Promise<void>;
	}

	sendGCode(commands: string[]): Promise<void> {
		// avoiding async/await for now...
		const commandsLeft = [...commands.filter(n => !!n)];
		const executeNextCommand = () => {
			const next = commandsLeft.shift();
			if (!next) {
				return;
			}
			return this.sendGRBL(next).then(executeNextCommand);
		};
		return executeNextCommand();
	}

	static describeDataFields(): GCodeHandlerDataField<ESP3DWebUIData>[] {
		return [];
	}
}