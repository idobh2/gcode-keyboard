import { State as ButtonState } from "./components/Button";
import { encoder, encoderButton, lcd, buttonMatrix } from "./devices";
import { GCodeHandler } from "./gcodeHandlers/GCodeHandler";
import { readSettings } from "./settingsManager/storage";

const INCREMENTS = [0.1, 1, 10, 100];

export default (handler: GCodeHandler) => {
	lcd.clear();
	lcd.print("Ready");

	let buttonHeld = false;
	let sendingCommands = false;
	let increment = INCREMENTS[0];
	const { keymap } = readSettings();

	const changeIncrement = (dir: number) => {
		const currIncIdx = INCREMENTS.indexOf(increment);
		const nextIdx = dir < 0 ? Math.max(currIncIdx - 1, 0) : Math.min(currIncIdx + 1, INCREMENTS.length - 1);
		increment = INCREMENTS[nextIdx];
		lcd.setCursor(0, 1);
		lcd.print(`Step: ${increment.toString().padStart(3, " ")}`);
	};
	changeIncrement(1);


	const removeEncListener = encoder.register((direction) => {
		if (!buttonHeld) {
			return;
		}
		changeIncrement(direction);
	});
	const removeEncBtnListener = encoderButton.onClick((state) => {
		buttonHeld = ButtonState.Hold === state;
	});
	const removeBtnMatListener = buttonMatrix.onClick((btn) => {
		if (sendingCommands) {
			console.log(`Ignoring press on "${btn}" while sending previous command set`);
			return;
		}
		const commandRaw = keymap[btn];
		if (!commandRaw) {
			console.log(`No command registered for key "${btn}"`);
			return;
		}
		const commands = commandRaw.replace(/{{increment}}/g, `${increment}`).split("\n").map(n => n.trim());

		console.log(`Sending commands: ${commands.join(";")}`);
		sendingCommands = true;
		handler.sendGCode(commands).then(() => { sendingCommands = false; });
	});

	return () => {
		removeEncListener();
		removeEncBtnListener();
		removeBtnMatListener();
	};
};