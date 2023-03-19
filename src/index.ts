import "./utils/polyfill";
import { lcd } from "./devices";
import { ensureConnection } from "./settingsManager";

lcd.clear();
lcd.print("Connecting...");
ensureConnection()
	.then(handler => {
		console.log("Got handler!");
	})
	.catch(e => console.log("Failed getting gcode handler. Waiting for settings to reset", e));
