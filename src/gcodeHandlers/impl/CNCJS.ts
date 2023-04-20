import { GCodeHandler, GCodeHandlerDataField } from "../GCodeHandler";
import { WebSocket } from "../../utils/ws";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CNCjsData {
	wsPort: number;
	token: string;
	serialPort: string;
}

type CNCjsEvent = [string, string | Record<string, unknown>];

const SOCKET_IO_PING_INTERVAL_MS = 25000;

export default class CNCjs implements GCodeHandler {
	private ws: WebSocket;

	private connectionPromise: Promise<void>;

	constructor(private readonly address: string, private readonly data: CNCjsData) {
		this.setupWebSocket();
	}

	private setupWebSocket() {
		this.ws = new WebSocket(this.address, { 
			port: this.data.wsPort ?? 8080,
			path: `/socket.io/?EIO=3&transport=websocket&token=${this.data.token}`
		});
		this.connectionPromise = new Promise((resolve) => {
			const connectionListener = (data: string) => {
				if (data.startsWith("3")) {
					console.log("Connected");
					this.ws.removeListener("message", connectionListener);
					resolve();
				}
			};
			this.ws.on("message", connectionListener);
		});
		this.ws.on("message", (data: string) => {
			if (data.startsWith("4")) {
				const [, messageJson] = data.match(/+d+(.*)/) || [];
				if (!messageJson) {
					console.log(`Empty message ${data}`);
					return;
				}
				let message: CNCjsEvent;
				try {
					message = JSON.parse(messageJson);
				} catch (e) {
					console.log("Error while parsing message", e);
					return;
				}
				console.log("Emitting message as cncjsEvent", message);
				this.emit("cncjsEvent", message);
			} else {
				console.log(`Ignoring message ${data}`);
			}
		});
		this.ws.on("open", () => {
			this.ws.send("2");
			setInterval(() => {
				this.ws.send("2");
			}, SOCKET_IO_PING_INTERVAL_MS);
		});
	}
	private sendCommand(cmd: string): Promise<CNCjsEvent> {
		if (!this.data.serialPort) {
			console.log("Can't send command without serial port");
			return Promise.reject(new Error("Can't send command without serial port"));
		}
		const waitForNextMessagePromise = new Promise<CNCjsEvent>((resolve) => {
			this.on<CNCjsEvent>("cncjsEvent", (msg) => {
				const [type] = msg;
				if ("serial:write" === type) {
					// ignore echo;
					return;
				}
				resolve(msg);
			});
		});
		const cmdParts = cmd.split(";");
		let cmdType = "";
		if (1 === cmdParts.length) {
			cmdType = "gcode";
		} else {
			cmdType = cmdParts.shift() as string;
		}
		const cmdData = cmdParts[0];
		this.ws.send(`42${JSON.stringify(["command", this.data.serialPort, cmdType, cmdData])}`);
		return waitForNextMessagePromise;
	}
	healthcheck(): Promise<void> {
		return this.connectionPromise
			.then(() => this.sendCommand("?"))
			.then((response) => {
				console.log(`Healthcheck got response=${response}`);
				if ("string" !== response[1] || !response[1].includes("MPos:")) {
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
			return this.sendCommand(next).then(executeNextCommand);
		};
		return executeNextCommand();
	}

	static describeDataFields(): GCodeHandlerDataField<CNCjsData>[] {
		return [
			{
				name: "wsPort",
				label: "WS Port",
				description: "Websocket port (default: 8080)",
				type: "text"
			},
			{
				name: "token",
				label: "CNC JS Token",
				description: "Generated JWT using CNCjs",
				type: "text"
			},
			{
				name: "serialPort",
				label: "Serial Port",
				description: "Serial port of the machine in the host",
				type: "text"
			},
		];
	}
}