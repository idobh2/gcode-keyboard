import { Socket } from "net";

/** Minify String.fromCharCode() call */
const strChr = String.fromCharCode;

function buildKey() {
	const randomString = btoa(Math.random().toString(36).substr(2, 8) +
		Math.random().toString(36).substr(2, 8));
	const toHash = randomString + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
	return {
		source: randomString,
		hashed: btoa(require("crypto").SHA1(toHash))
	};
}

export interface WebSocketOptions {
	port: number;
	protocolVersion: number;
	origin: string;
	keepAlive: number;
	masking: boolean;
	path: string;
	protocol: string;
	connected: boolean;
	headers: Record<string, string>;
}

export class WebSocket {
	private lastData = "";

	private key: { source: string; hashed: string; };

	private socket: Socket | null = null;

	constructor(private readonly host: string, private readonly options: WebSocketOptions) {
		this.key = buildKey();
	}

	private initializeConnection() {
		// only require net when needed
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		require("net").connect({
			host: this.host,
			port: this.port
		}, this.onConnect.bind(this));
	}

	private onConnect(socket) {
		this.socket = socket;
		const ws = this;
		socket.on("data", this.parseData.bind(this));
		socket.on("close", function () {
			if (ws.pingTimer) {
				clearInterval(ws.pingTimer);
				ws.pingTimer = undefined;
			}
			ws.emit("close");
		});

		this.handshake();
	}

	private parseData(data) {
		// see https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
		// Note, docs specify bits 0-7, etc - but BIT 0 is the MSB, 7 is the LSB
		const ws = this;
		this.emit("rawData", data);

		if (this.lastData.length) {
			data = this.lastData + data;
			this.lastData = "";
		}

		if (!this.connected) {
			// FIXME - not a good idea!
			if (data.indexOf(this.key.hashed) > -1 && data.indexOf("\r\n\r\n") > -1) {
				this.emit("handshake");
				this.pingTimer = setInterval(function () {
					ws.send("ping", 0x89);
				}, this.keepAlive);
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
					this.socket.end();
					break;
				case 0:
				case 1:
					var mask = [0, 0, 0, 0];
					if (data.charCodeAt(1) & 128 /* mask */) {
						mask = [data.charCodeAt(offset++), data.charCodeAt(offset++),
						data.charCodeAt(offset++), data.charCodeAt(offset++)];
					}
					var msg = "";
					for (let i = 0; i < dataLen; i++) { msg += String.fromCharCode(data.charCodeAt(offset++) ^ mask[i & 3]); }
					this.emit("message", msg);
					break;
				default:
					console.log("WS: Unknown opcode " + opcode);
			}
			data = data.substr(pktLen);
		}
	}

	private handshake() {
		const socketHeader = [
			"GET " + this.path + " HTTP/1.1",
			"Host: " + this.host,
			"Upgrade: websocket",
			"Connection: Upgrade",
			"Sec-WebSocket-Key: " + this.key.source,
			"Sec-WebSocket-Version: " + this.protocolVersion,
			"Origin: " + this.origin
		];
		if (this.protocol) { socketHeader.push("Sec-WebSocket-Protocol: " + this.protocol); }

		for (const key in this.headers) {
			if (this.headers.hasOwnProperty(key)) { socketHeader.push(key + ": " + this.headers[key]); }
		}

		this.socket.write(socketHeader.join("\r\n") + "\r\n\r\n");
	}
	send(msg, opcode) {
		opcode = opcode === undefined ? 0x81 : opcode;
		let size = msg.length;
		if (msg.length > 125) {
			size = 126;
		}
		this.socket.write(strChr(opcode, size + (this.masking ? 128 : 0)));

		if (size == 126) {
			// Need to write extra bytes for longer messages
			this.socket.write(strChr(msg.length >> 8));
			this.socket.write(strChr(msg.length));
		}

		if (this.masking) {
			const mask = [];
			let masked = "";
			for (var ix = 0; ix < 4; ix++) {
				const rnd = Math.floor(Math.random() * 255);
				mask[ix] = rnd;
				masked += strChr(rnd);
			}
			for (var ix = 0; ix < msg.length; ix++) { masked += strChr(msg.charCodeAt(ix) ^ mask[ix & 3]); }
			this.socket.write(masked);
		} else {
			this.socket.write(msg);
		}
	}
	close() {
		this.socket.end();
	}
}

function WebSocket2(host, options) {
	this.socket = null;
	options = options || {};
	this.host = host;
	this.port = options.port || 80;
	this.protocolVersion = options.protocolVersion || 13;
	this.origin = options.origin || "Espruino";
	this.keepAlive = options.keepAlive * 1000 || 60000;
	this.masking = options.masking !== undefined ? options.masking : true;
	this.path = options.path || "/";
	this.protocol = options.protocol;
	this.lastData = "";

	this.connected = options.connected || false;
	this.headers = options.headers || {};
}