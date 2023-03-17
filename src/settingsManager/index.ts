import * as wifi from "Wifi";
import handlers from "../handlers";
import GCodeHandler from "../handlers/GCodeHandler";
import { promisify } from "../utils";
import { startSettingsServer } from "./settingsServer";
import { readSettings, Settings } from "./storage";

function validateSettings(): Settings | null {
	const settings = readSettings();
	if (
		!settings.net
		|| !settings.net.ssid
		|| !settings.handler
		|| !settings.handler.type
		|| !settings.handler.address
	) {
		return null;
	}
	return settings;
}

export function ensureConnection() {
	return Promise.resolve()
		.then(() => {
			const settings = validateSettings();
			if (settings) {
				return settings;
			}
			console.log("Invalid connection settings!");
			return Promise.reject();
		})
		.then((settings) => {
			return promisify(wifi.connect)(settings.net?.ssid ?? "", { password: settings.net?.pass ?? "" }).then(() => settings);
		})
		.then((settings) => {
			const Handler = handlers[settings.handler?.type];
			// @ts-expect-error FIXME
			const handler: GCodeHandler = new Handler(settings.handler.address, settings.handler.data);
			return handler.healthcheck().then(() => handler);
		})
		.catch((e) => {
			console.log("Failed setting up handler", e);
			startSettingsServer();
			return Promise.reject(e);
		});



}