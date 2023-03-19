import { buttonMatrix } from "../devices";
import { Settings } from "./types";

const defaultSettings: Settings = {
	keymap: buttonMatrix.buttonLabels.reduce((a, b) => ({ ...a, [b]: "" }), {}),
};
defaultSettings.keymap.forward = ""; // TODO: set default gcode for Y+
defaultSettings.keymap.backward = "";  // TODO: set default gcode for Y-
defaultSettings.keymap.left = "";  // TODO: set default gcode for X-
defaultSettings.keymap.right = "";  // TODO: set default gcode for X+
defaultSettings.keymap.up = "";  // TODO: set default gcode for Z+
defaultSettings.keymap.down = "";  // TODO: set default gcode for Z-

export default defaultSettings;