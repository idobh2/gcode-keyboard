// @ts-expect-error Storage exists
import * as storage from "Storage";
import defaultSettings from "./defaultSettings";
import { Settings } from "./types";

const STORAGE_KEY = "gcodekeyboard";

export function readSettings(): Settings {
	let settings = storage.readJSON(STORAGE_KEY, true) as (Settings | undefined);
	if (!settings) {
		storage.erase(STORAGE_KEY); // settings may be undefined because of an illegal JSON
		settings = {} as Settings;
		storage.writeJSON(STORAGE_KEY, defaultSettings);
	}
	return settings;
}

export function writeSettings(settings: Settings) {
	storage.writeJSON(STORAGE_KEY, settings);
}

export function wipeSettings() {
	storage.writeJSON(STORAGE_KEY, {});
	reset(false);
}