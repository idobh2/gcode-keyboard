import "./utils/polyfill";
import { encoderButton, lcd } from "./devices";
import { ensureConnection, startSettingsServer } from "./settingsManager";
import jogger from "./jogger";
import { State } from "./components/Button";

lcd.clear();
lcd.print("Connecting...");
ensureConnection()
	.then((handler) => {
		console.log("Got handler!");
		const cleanup = jogger(handler);
		let modeChangeTimer: NodeJS.Timeout | null = null;
		let startedSettingsServer = false;
		encoderButton.onClick((state) => {
			if (state === State.ClickHold) {
				if (modeChangeTimer) {
					clearTimeout(modeChangeTimer);
				}
				modeChangeTimer = setTimeout(() => {
					if (startedSettingsServer) {
						reset(false);
						return;
					}
					startedSettingsServer = true;
					cleanup();
					startSettingsServer();
				}, 3000);
			} else {
				if (modeChangeTimer) {
					clearTimeout(modeChangeTimer);
				}
			}
		});
	})
	.catch((e) => console.log("Failed getting gcode handler. Waiting for settings to reset", e));
