import { buttonMatrix, ButtonMatrixKeys } from "../devices";
import { Settings } from "./types";

const defaultSettings: Settings = {
	keymap: buttonMatrix.buttonLabels.reduce((a, b) => ({ ...a, [b]: "" }), {} as Record<ButtonMatrixKeys, string>),
};
defaultSettings.keymap[ButtonMatrixKeys.Forward] = "G91\nG0 Y{{increment}} F6000\nG90";
defaultSettings.keymap[ButtonMatrixKeys.Backward] = "G91\nG0 Y-{{increment}} F6000\nG90";
defaultSettings.keymap[ButtonMatrixKeys.Left] = "G91\nG0 X-{{increment}} F6000\nG90";
defaultSettings.keymap[ButtonMatrixKeys.Right] = "G91\nG0 X{{increment}} F6000\nG90";
defaultSettings.keymap[ButtonMatrixKeys.Up] = "G91\nG0 Z{{increment}} F6000\nG90";
defaultSettings.keymap[ButtonMatrixKeys.Down] = "G91\nG0 Z-{{increment}} F6000\nG90";

export default defaultSettings;