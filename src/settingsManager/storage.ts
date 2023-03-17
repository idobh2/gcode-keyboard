// @ts-expect-error Storage exists
import * as storage from "Storage";
import { HandlerDataMapping, HandlerName } from "../handlers";

const STORAGE_KEY = "gcodekeyboard";

export interface Settings<T extends HandlerName = HandlerName> {
	net: {
		ssid: string;
		pass: string;
	},
	handler: {
		type: T;
		address: string;
		data: HandlerDataMapping[T]
	}
}


export function readSettings(): Settings {
	let settings = storage.readJSON(STORAGE_KEY, true) as (Settings | undefined);
	if (!settings) {
		storage.erase(STORAGE_KEY); // settings may be undefined because of an illegal JSON
		settings = {} as Settings;
		storage.writeJSON(STORAGE_KEY, settings);
	}
	return settings;
}

export function writeSettings(settings: Settings) {
	storage.writeJSON(STORAGE_KEY, settings);
}