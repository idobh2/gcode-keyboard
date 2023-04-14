import { request } from "../../utils";
import { GCodeHandler, GCodeHandlerDataField } from "../GCodeHandler";
import { WebSocket } from "../../utils/ws";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ESP3DWebUIData {
	wsPort: number;
}

export default class ESP3DWebUI implements GCodeHandler {
	private ws: WebSocket;

	private connectionId = "";

	constructor(private readonly address: string, private readonly data: ESP3DWebUIData) {
		this.ws = new WebSocket(this.address, { port: data.wsPort ?? 81 });
		this.on("data", (data: string) => {
			const [, id] = data.match(/CURRENT_ID:(\d+)/) ?? [];
			if (id) {
				console.log(`Got connection id ${id}`);
				this.connectionId = id;
			} else if (["PING:", "ACTIVE_ID:", "DHT:"].find(n => data.startsWith(n))) {
				console.log(`Ignoring internal message ${data}`);
			} else {
				console.log(`Emitting message as esp3DWebUiMessage ${data}`);
				this.emit("esp3DWebUiMessage", data);
			}
		});
	}
	private sendGRBL(cmd: string): Promise<string> {
		if (!this.connectionId) {
			console.log(`Not sending command until connectionId is retrieved: ${cmd}`);
			return Promise.resolve("");
		}
		const waitForNextMessagePromise = new Promise<string>((resolve) => {
			this.on<string>("esp3DWebUiMessage", resolve);
		});
		request(`${this.address}/command?commandText=${encodeURIComponent(cmd)}&PAGEID=${this.connectionId}`);
		return waitForNextMessagePromise;
	}
	healthcheck(): Promise<void> {
		return this.sendGRBL("?").then((response) => {
			console.log(`Healthcheck got response=${response}`);
			if (!response.includes("ok")) {
				return Promise.reject(new Error("Healthcheck failed"));
			}
		});
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
		return [
			{
				name: "wsPort",
				label: "WS Port",
				description: "Websocket port (default: 81)",
				type: "text"
			}
		];
	}
}