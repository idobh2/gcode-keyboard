import Encoder from "./components/Encoder";
import Button from "./components/Button";
import ButtonMatrix from "./components/ButtonMatrix";
import { connect as connectToLCD } from "./components/HD44780";
import {
	ENCODER_BTN_PIN, ENCODER_PIN_A, ENCODER_PIN_B,
	LCD_D4, LCD_D5, LCD_D6, LCD_D7, LCD_EN, LCD_RS,
	BUTTON_MAT_ROW1, BUTTON_MAT_ROW2, BUTTON_MAT_ROW3, BUTTON_MAT_ROW4, BUTTON_MAT_COL1, BUTTON_MAT_COL2, BUTTON_MAT_COL3
} from "./pins";


export const encoder = new Encoder(ENCODER_PIN_A, ENCODER_PIN_B);
export const encoderButton = new Button(ENCODER_BTN_PIN);
export const lcd = connectToLCD(LCD_RS, LCD_EN, LCD_D4, LCD_D5, LCD_D6, LCD_D7);
export const buttonMatrix = new ButtonMatrix({
	cols: [BUTTON_MAT_COL1, BUTTON_MAT_COL2, BUTTON_MAT_COL3],
	rows: [BUTTON_MAT_ROW1, BUTTON_MAT_ROW2, BUTTON_MAT_ROW3, BUTTON_MAT_ROW4],
	table: [
		["1", "2", "3"],
		["4", "5", "6"],
		["7", "8", "9"],
		["a", "b", "c"],
	]
});