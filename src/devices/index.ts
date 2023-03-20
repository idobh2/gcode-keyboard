import Encoder from "../components/Encoder";
import Button from "../components/Button";
import ButtonMatrix from "../components/ButtonMatrix";
import { connect as connectToLCD } from "../components/HD44780";
import {
	ENCODER_BTN_PIN, ENCODER_PIN_A, ENCODER_PIN_B,
	LCD_D4, LCD_D5, LCD_D6, LCD_D7, LCD_EN, LCD_RS,
	BUTTON_MAT_ROW1, BUTTON_MAT_ROW2, BUTTON_MAT_ROW3, BUTTON_MAT_ROW4, BUTTON_MAT_COL1, BUTTON_MAT_COL2, BUTTON_MAT_COL3
} from "./pins";

export const encoder = new Encoder(ENCODER_PIN_A, ENCODER_PIN_B);
export const encoderButton = new Button(ENCODER_BTN_PIN);
export const lcd = connectToLCD(LCD_RS, LCD_EN, LCD_D4, LCD_D5, LCD_D6, LCD_D7);

export enum ButtonMatrixKeys {
	Left = "left",
	Right = "right",
	Forward = "forward",
	Backward = "backward",
	Down = "down",
	Up = "up",
	Macro1 = "macro1",
	Macro2 = "macro2",
	Macro3 = "macro3",
	Macro4 = "macro4",
	Macro5 = "macro5",
	Macro6 = "macro6"
}

export const buttonMatrix = new ButtonMatrix<ButtonMatrixKeys>({
	cols: [BUTTON_MAT_COL1, BUTTON_MAT_COL2, BUTTON_MAT_COL3],
	rows: [BUTTON_MAT_ROW1, BUTTON_MAT_ROW2, BUTTON_MAT_ROW3, BUTTON_MAT_ROW4],
	table: [
		[ButtonMatrixKeys.Left, ButtonMatrixKeys.Right, ButtonMatrixKeys.Forward],
		[ButtonMatrixKeys.Backward, ButtonMatrixKeys.Down, ButtonMatrixKeys.Up],
		[ButtonMatrixKeys.Macro1, ButtonMatrixKeys.Macro2, ButtonMatrixKeys.Macro3],
		[ButtonMatrixKeys.Macro4, ButtonMatrixKeys.Macro5, ButtonMatrixKeys.Macro6],
	]
});