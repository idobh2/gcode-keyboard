import { GCodeHandler, GCodeHandlerDataField } from "../GCodeHandler";
import { WebSocket } from "../../utils/ws";

const CNCJS_CONNECTION_TYPES = ["Grbl", "Marlin", "Smoothie", "TinyG"] as const;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CNCjsData {
	wsPort: number;
	token: string;
	serialPort: string;
	serialBaudrate: number;
	controllerType: typeof CNCJS_CONNECTION_TYPES;
}

const SOCKET_IO_PING_INTERVAL_MS = 25000;

export default class CNCjs implements GCodeHandler {
	private ws: WebSocket;

	private connectionPromise: Promise<void>;

	constructor(private readonly address: string, private readonly data: CNCjsData) {
		this.data.serialBaudrate = this.data.serialBaudrate || 115200;
		this.data.controllerType = this.data.controllerType || "Grbl";
		this.setupWebSocket();
	}

	private setupWebSocket() {
		this.ws = new WebSocket(this.address, {
			port: this.data.wsPort ?? 8080,
			path: `/socket.io/?EIO=3&transport=websocket&token=${this.data.token}`
		});
		this.connectionPromise = new Promise((resolve) => {
			const connectionListener = (data: string) => {
				if (data.includes("startup")) {
					console.log("Connected");
					this.sendEvent("open", {
						controllerType: this.data.controllerType,
						baudrate: Number(this.data.serialBaudrate),
						rtscts: false,
						pin: {
							dtr: null,
							rts: null
						}
					});
				} else if (data.includes("serialport:open")) {
					console.log("Port opened");
					this.ws.removeListener("message", connectionListener);
					resolve();
				}
			};
			this.ws.on("message", connectionListener);
		});
		this.ws.on("open", () => {
			this.ws.send("2");
			setInterval(() => {
				this.ws.send("2");
			}, SOCKET_IO_PING_INTERVAL_MS);
			// request to open and wait for serial:open event to be received in connectionPromise
		});
	}
	private sendEvent(event: string, ...args: unknown[]) {
		if (!this.data.serialPort) {
			console.log("Can't send command without serial port");
			throw new Error("Can't send command without serial port");
		}
		const toWrite = `42${JSON.stringify([
			event,
			this.data.serialPort,
			...args

		])}`;
		console.log(`Sending event: ${toWrite}`);
		this.ws.send(toWrite);
	}
	private sendCommand(cmd: string): void {
		const cmdParts = cmd.split(";");
		let cmdType = "";
		if (1 === cmdParts.length) {
			cmdType = "gcode";
		} else {
			cmdType = cmdParts.shift() as string;
		}
		const cmdData = cmdParts[0];
		this.sendEvent("command", cmdType, cmdData);
	}
	healthcheck(): Promise<void> {
		return this.connectionPromise;
	}

	sendGCode(commands: string[]): Promise<void> {
		commands.forEach(cmd => this.sendCommand(cmd));
		return Promise.resolve();
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
			{
				name: "serialBaudrate",
				label: "Serial Baudrate",
				description: "Serial port Baudrate (default: 115200)",
				type: "text"
			},
			{
				name: "controllerType",
				label: "Controller Type",
				description: `One of: ${CNCJS_CONNECTION_TYPES.join(", ")} (default: Grbl)`,
				type: "text"
			},
		];
	}
}