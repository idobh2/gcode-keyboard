import * as wifi from "Wifi";
import handlers, { HandlerDataMapping, HandlerName } from "../gcode-handlers";
import { GCodeHandler, GCodeHandlerClass } from "../gcode-handlers/GCodeHandler";
import { promisify, sleep } from "../utils";
import { startSettingsServer } from "./settingsServer";
import { readSettings } from "./storage";
import { Settings } from "./types";

export { startSettingsServer } from "./settingsServer";

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
			return Promise.reject(new Error("Invalid settings"));
		})
		.then((settings) => {
			return Promise.race([
				sleep(10000).then(() => Promise.reject(new Error("Network connection timeout"))),
				promisify(wifi.connect)(settings.net?.ssid ?? "", { password: settings.net?.pass ?? "" })
			]).then(() => settings);
		})
		.then((settings) => {
			if (!settings.handler) {
				return Promise.reject(new Error("Invalid settings"));
			}
			const Handler = handlers[settings.handler?.type] as GCodeHandlerClass<HandlerDataMapping[HandlerName]>;
			const handler: GCodeHandler = new Handler(settings.handler.address, settings.handler.data);
			return handler.healthcheck().then(() => handler);
		})
		.catch((e) => {
			console.log("Failed setting up handler", e);
			startSettingsServer(e);
			return Promise.reject(e);
		});
}