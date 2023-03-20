import { buttonMatrix, ButtonMatrixKeys } from "../devices";
import { Settings } from "./types";

const defaultSettings: Settings = {
	keymap: buttonMatrix.buttonLabels.reduce((a, b) => ({ ...a, [b]: "" }), {} as Record<ButtonMatrixKeys, string>),
};
defaultSettings.keymap[ButtonMatrixKeys.Forward] = "G90\nG0 Y{{increment}} F6000\nG91"; // TODO: set default gcode for Y+
defaultSettings.keymap[ButtonMatrixKeys.Backward] = "G90\nG0 Y-{{increment}} F6000\nG91";  // TODO: set default gcode for Y-
defaultSettings.keymap[ButtonMatrixKeys.Left] = "G90\nG0 X-{{increment}} F6000\nG91";  // TODO: set default gcode for X-
defaultSettings.keymap[ButtonMatrixKeys.Right] = "G90\nG0 X{{increment}} F6000\nG91";  // TODO: set default gcode for X+
defaultSettings.keymap[ButtonMatrixKeys.Up] = "G90\nG0 Z{{increment}} F6000\nG91";  // TODO: set default gcode for Z+
defaultSettings.keymap[ButtonMatrixKeys.Down] = "G90\nG0 Z-{{increment}} F6000\nG91";  // TODO: set default gcode for Z-

export default defaultSettings;