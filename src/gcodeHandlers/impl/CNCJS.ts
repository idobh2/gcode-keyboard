import { GCodeHandler, GCodeHandlerDataField } from "../GCodeHandler";
import { RequestOptions, request } from "../../utils/http";
import { decodePayload, encodePayload, Packet } from "../../utils/socket.io-parser";

const CNCJS_CONNECTION_TYPES = ["Grbl", "Marlin", "Smoothie", "TinyG"] as const;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CNCjsData {
	port: number;
	token: string;
	serialPort: string;
	serialBaudrate: number;
	controllerType: typeof CNCJS_CONNECTION_TYPES;
}

export default class CNCjs implements GCodeHandler {
	private socketEventEmitter: object = {};

	private connectionPromise: Promise<void>;

	private sid = "";

	private pingInterval: NodeJS.Timer | null = null;

	constructor(private readonly address: string, private readonly data: CNCjsData) {
		this.data.serialBaudrate = this.data.serialBaudrate ? Number(this.data.serialBaudrate) : 115200;
		this.data.controllerType = this.data.controllerType || "Grbl";
		this.data.port = this.data.port ? Number(this.data.port) : 8080;
		this.connectionPromise = this.setupSocketIoClient();
	}

	private serverRequest(options?: RequestOptions) {
		return request(`http://${this.address}:${this.data.port}/socket.io/?EIO=3&transport=polling&token=${this.data.token}${this.sid ? `&sid=${this.sid}` : ""}`, options);
	}

	private postRequest(packets: Packet[]) {
		const body = encodePayload(packets);
		console.log("Sending post request", body);
		return this.serverRequest({ method: "POST", body });
	}

	private startPolling() {
		const doPoll = () => {
			this.serverRequest()
				.then((data) => {
					const packets = decodePayload(data);
					if (packets.find(p => "close" === p.type)) {
						console.log("Connection closed");
						this.resetClient();
						// dismissing all other packets for now
						return;
					}
					const messagePackets = packets.filter(p => "message" === p.type);
					messagePackets.forEach((msgPacket) => this.onMessage(msgPacket.data));

					doPoll();
				})
				.catch((e) => {
					console.log("Polling rejection", e);
					this.resetClient();
				});
		};
		doPoll();
	}

	private setupSocketIoClient() {
		return this.serverRequest()
			.then(data => {
				const packets = decodePayload(data);
				const openPacket = packets.find(p => "open" === p.type);
				if (openPacket) {
					const { sid, pingInterval } = (JSON.parse(openPacket.data as string) ?? {}) as { sid: string; pingInterval: number };
					console.log(`Got sid=${sid} pingInterval=${pingInterval}`);
					if (!sid) {
						return Promise.reject(new Error("Failed to get session ID"));
					}
					this.sid = sid;
					// setup pinger
					this.pingInterval = setInterval(() => {
						this.sendPing();
					}, pingInterval);
					this.startPolling();

					return this.openSerialPort();
				} else {
					return Promise.reject(new Error("Failed to get session ID"));
				}
			});
	}

	private resetClient() {
		console.log("Resetting client");
		this.sid = "";
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
		}
		// re-setup client
		this.setupSocketIoClient();
	}

	private buildCommand(cmd: string): string[] {
		const cmdParts = cmd.split(";");
		let cmdType = "";
		if (1 === cmdParts.length) {
			cmdType = "gcode";
		} else {
			cmdType = cmdParts.shift() as string;
		}
		const cmdData = cmdParts[0];
		return ["command", this.data.serialPort, cmdType, cmdData];
	}

	private onMessage(data?: unknown) {
		if (Array.isArray(data) && "string" === typeof data[0]) {
			this.socketEventEmitter.emit(data[0], data[1]);
		}
	}

	private sendPing() {
		return this.postRequest([{ type: "ping" }]);
	}

	private sendMessages(messagesData: unknown[]) {
		return this.postRequest(messagesData.map(d => ({ type: "message", data: d })));
	}

	private openSerialPort() {
		const portOpenedPromise = new Promise<void>((resolve, reject) => {
			const portOpenListener = (data) => {
				this.socketEventEmitter.removeListener("serialport:open", portOpenListener);
				if (data.inuse) {
					return resolve();
				}
				return reject(new Error(`Couldn't open serial port ${this.data.serialPort}`));
			};
			this.socketEventEmitter.on("serialport:open", portOpenListener);
		});
		this.sendMessages([[
			"open",
			this.data.serialPort,
			{
				controllerType: this.data.controllerType,
				baudrate: this.data.serialBaudrate,
				rtscts: false,
				pin: {
					dtr: null,
					rts: null
				}
			}
		]]);
		return portOpenedPromise;
	}

	healthcheck(): Promise<void> {
		return this.connectionPromise;
	}

	sendGCode(commands: string[]): Promise<void> {
		return this.sendMessages(commands.map(cmd => this.buildCommand(cmd))).then(() => { /* */ });
	}

	static describeDataFields(): GCodeHandlerDataField<CNCjsData>[] {
		return [
			{
				name: "port",
				label: "Port",
				description: "Socket.io port (default: 8080)",
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