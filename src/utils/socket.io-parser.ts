// this is a synchronous, string-only, cut-down version of https://github.com/socketio/engine.io-parser/blob/2.1.1/lib/index.js

export const protocol = 3;

export const packets = {
	open: 0    // non-ws
	, close: 1    // non-ws
	, ping: 2
	, pong: 3
	, message: 4
	, upgrade: 5
	, noop: 6
};

export interface Packet {
	type: "error" | keyof typeof packets,
	data?: unknown;
}

const packetsList = Object.keys(packets);

const err: Packet = { type: "error", data: "parser error" };

export function encodePacket(packet) {
	if (!packet.data) {
		return String(packets[packet.type]);
	}
	// add 2 as it's the standard socket.io event type, as opposed to 5 (binary event type) which we currently don't support 
	return `${packets[packet.type]}2${"string" === typeof packet.data ? packet.data : JSON.stringify(packet.data)}`;

}

/**
 * Decodes a packet. Changes format to Blob if requested.
 *
 * @return {Object} with `type` and `data` (if any)
 * @api private
 */

export function decodePacket(data: string) {
	if (data === undefined) {
		return err;
	}
	if (data.charAt(0) === "b") {
		return err;
	}

	const type = data.charAt(0);
	// @ts-expect-error intentional eq-eq
	if (Number(type) != type || !packetsList[type]) {
		return err;
	}

	if (data.length > 1) {
		return { type: packetsList[type], data: data.substring(1) };
	} else {
		return { type: packetsList[type] };
	}
}

function setLengthHeader(message: string) {
	return `${message.length}:${message}`;
}

export function encodePayload(packets) {
	if (!packets.length) {
		return "0:";
	}

	return packets.map(p => setLengthHeader(encodePacket(p))).join("");
}

/*
 * Decodes data when a payload is maybe expected. Possible binary contents are
 * decoded from their base64 representation
 *
 * @param {String} data, callback method
 * @api public
 */

export function decodePayload(data): Packet[] {
	if (typeof data !== "string") {
		return [err];
	}

	const packets: Packet[] = [];
	if (data === "") {
		packets.push(err);
		return packets;
	}

	let length = "", n, msg;

	for (let i = 0, l = data.length; i < l; i++) {
		const chr = data.charAt(i);

		if (chr !== ":") {
			length += chr;
			continue;
		}
		// @ts-expect-error intentional comparison
		if (length === "" || (length != (n = Number(length)))) {
			// parser error - ignoring payload
			packets.push(err);
			return packets;
		}

		msg = data.substring(i + 1, i + 1 + n);

		if (length != msg.length) {
			// parser error - ignoring payload
			packets.push(err);
			return packets;
		}

		if (msg.length) {
			const packet = decodePacket(msg);

			if (err.type === packet.type && err.data === packet.data) {
				// parser error in individual packet - ignoring payload
				packets.push(err);
				return packets;
			}

			if ("message" === packet.type && packet.data && "string" === typeof packet.data && "2" === packet.data.charAt(0)) {
				try {
					const parsed = JSON.parse(packet.data.substring(1));
					packet.data = parsed;
				} catch (e) { /* */ }
			}
			packets.push(packet);
		}

		// advance cursor
		i += n;
		length = "";
	}

	if (length !== "") {
		// parser error - ignoring payload
		packets.push(err);
		return packets;
	}
	return packets;
}