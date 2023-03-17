import { buttonMatrix, encoder, encoderButton, lcd } from "./devices";
import * as wifi from "Wifi";
import { request } from "./httpUtils";
import { ensureConnection } from "./settingsManager";

lcd.clear();
ensureConnection()
	.then(handler => {
		console.log("Got handler!");
	})
	.catch(e => console.log("Failed getting gcode handler. Waiting for settings to reset", e));
