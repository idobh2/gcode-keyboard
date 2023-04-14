// heavily based on the espruino module
// http://www.espruino.com/modules/ws.js
import { Socket } from "net";

/** Minify String.fromCharCode() call */
const strChr = String.fromCharCode;

function buildKey() {
	const randomString = btoa(Math.random().toString(36).substr(2, 8) +
		Math.random().toString(36).substr(2, 8));
	const toHash = randomString + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
	return {
		source: randomString,
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		hashed: btoa(require("crypto").SHA1(toHash))
	};
}

export interface WebSocketOptions {
	port?: number;
	protocolVersion?: number;
	origin?: string;
	keepAlive?: number;
	masking?: boolean;
	path?: string;
	protocol?: string;
	headers?: Record<string, string>;
}

const defaultOptions: WebSocketOptions = {
	headers: {},
	keepAlive: 60000,
	masking: true,
	origin: "Espruino",
	path: "/",
	port: 80,
	protocolVersion: 13,
};

export class WebSocket {
	private lastData = "";

	private key: { source: string; hashed: string; };

	private socket: Socket | null = null;

	private pingTimer: NodeJS.Timer | null = null;

	private connected = false;

	constructor(private readonly host: string, private readonly options: WebSocketOptions = {}) {
		this.key = buildKey();
		this.options = { ...defaultOptions, ...options };
		this.initializeConnection();
	}

	private initializeConnection() {
		// only require net when needed
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		require("net").connect({
			host: this.host,
			port: this.options.port
		}, this.onConnect.bind(this));
	}

	private onConnect(socket) {
		this.socket = socket;
		socket.on("data", this.parseData.bind(this));
		socket.on("close", () => {
			if (this.pingTimer) {
				clearInterval(this.pingTimer);
				this.pingTimer = null;
			}
			this.emit("close");
		});

		this.handshake();
	}

	private parseData(data) {
		// see https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
		// Note, docs specify bits 0-7, etc - but BIT 0 is the MSB, 7 is the LSB
		this.emit("rawData", data);

		if (this.lastData.length) {
			data = this.lastData + data;
			this.lastData = "";
		}

		if (!this.connected) {
			// FIXME - not a good idea!
			if (data.indexOf(this.key.hashed) > -1 && data.indexOf("\r\n\r\n") > -1) {
				this.emit("handshake");
				this.pingTimer = setInterval(() => {
					this.send("ping", 0x89);
				}, this.options.keepAlive);
				data = data.substring(data.indexOf("\r\n\r\n") + 4);
				this.connected = true;
				this.emit("open");
			}
			this.lastData = data;
			return;
		}

		while (data.length) {
			let offset = 2;
			const opcode = data.charCodeAt(0) & 15;
			let dataLen = data.charCodeAt(1) & 127;
			if (dataLen == 126) {
				dataLen = data.charCodeAt(3) | (data.charCodeAt(2) << 8);
				offset += 2;
			} else if (dataLen == 127) { throw "Messages >65535 in length unsupported"; }
			const pktLen = dataLen + offset + ((data.charCodeAt(1) & 128) ? 4/*mask*/ : 0);
			if (pktLen > data.length) {
				// we received the start of a packet, but not enough of it for a full message.
				// store it for later, so when we get the next packet we can do the whole message
				this.lastData = data;
				return;
			}

			switch (opcode) {
				case 0xA:
					this.emit("pong");
					break;
				case 0x9:
					this.send("pong", 0x8A);
					this.emit("ping");
					break;
				case 0x8:
					this.socket?.end();
					break;
				case 0:
				case 1:
				case 2: {
					// TODO: Treat opcode2 (binary frame) differently
					let mask = [0, 0, 0, 0];
					let msg = "";
					if (data.charCodeAt(1) & 128 /* mask */) {
						mask = [data.charCodeAt(offset++), data.charCodeAt(offset++),
							data.charCodeAt(offset++), data.charCodeAt(offset++)];
					}

					for (let i = 0; i < dataLen; i++) {
						msg += String.fromCharCode(data.charCodeAt(offset++) ^ mask[i & 3]);
					}
					this.emit("message", msg);
					break;
				}
				default:
					console.log("WS: Unknown opcode " + opcode);
			}
			data = data.substr(pktLen);
		}
	}

	private handshake() {
		const socketHeader = [
			"GET " + this.options.path + " HTTP/1.1",
			"Host: " + this.host,
			"Upgrade: websocket",
			"Connection: Upgrade",
			"Sec-WebSocket-Key: " + this.key.source,
			"Sec-WebSocket-Version: " + this.options.protocolVersion,
			"Origin: " + this.options.origin
		];
		if (this.options.protocol) {
			socketHeader.push("Sec-WebSocket-Protocol: " + this.options.protocol);
		}

		for (const key in this.options.headers) {
			if (key in this.options.headers) {
				socketHeader.push(key + ": " + this.options.headers[key]);
			}
		}

		this.socket?.write(socketHeader.join("\r\n") + "\r\n\r\n");
	}
	send(msg, opcode) {
		opcode = opcode === undefined ? 0x81 : opcode;
		let size = msg.length;
		if (msg.length > 125) {
			size = 126;
		}
		this.socket?.write(strChr(opcode, size + (this.options.masking ? 128 : 0)));

		if (size == 126) {
			// Need to write extra bytes for longer messages
			this.socket?.write(strChr(msg.length >> 8));
			this.socket?.write(strChr(msg.length));
		}

		if (this.options.masking) {
			const mask: number[] = [];
			let masked = "";
			for (let ix = 0; ix < 4; ix++) {
				const rnd = Math.floor(Math.random() * 255);
				mask[ix] = rnd;
				masked += strChr(rnd);
			}
			for (let ix = 0; ix < msg.length; ix++) {
				masked += strChr(msg.charCodeAt(ix) ^ mask[ix & 3]);
			}
			this.socket?.write(masked);
		} else {
			this.socket?.write(msg);
		}
	}
	close() {
		this.socket?.end();
	}
}
