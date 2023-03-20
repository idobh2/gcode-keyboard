import { ButtonMatrixKeys } from "../devices";
import { HandlerDataMapping, HandlerName } from "../gcodeHandlers";

export interface Settings<T extends HandlerName = HandlerName> {
	net?: {
		ssid: string;
		pass: string;
	},
	handler?: {
		type: T;
		address: string;
		data: HandlerDataMapping[T]
	},
	keymap: Record<ButtonMatrixKeys, string>;
}