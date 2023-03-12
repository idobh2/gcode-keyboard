import Encoder from "./Encoder";
import Button from "./Button";
import ButtonMatrix from "./ButtonMatrix";
import { connect as connectToLCD } from "./HD44780";
import {
	ENCODER_BTN_PIN, ENCODER_PIN_A, ENCODER_PIN_B,
	LCD_D4, LCD_D5, LCD_D6, LCD_D7, LCD_EN, LCD_RS,
	BUTTON_MAT_ROW1, BUTTON_MAT_ROW2, BUTTON_MAT_ROW3, BUTTON_MAT_ROW4, BUTTON_MAT_COL1, BUTTON_MAT_COL2, BUTTON_MAT_COL3
} from "./pins";

const encoder = new Encoder(ENCODER_PIN_A, ENCODER_PIN_B);
const encoderButton = new Button(ENCODER_BTN_PIN);
const lcd = connectToLCD(LCD_RS, LCD_EN, LCD_D4, LCD_D5, LCD_D6, LCD_D7);
const buttonMatrix = new ButtonMatrix({
	cols: [BUTTON_MAT_COL1, BUTTON_MAT_COL2, BUTTON_MAT_COL3],
	rows: [BUTTON_MAT_ROW1, BUTTON_MAT_ROW2, BUTTON_MAT_ROW3, BUTTON_MAT_ROW4],
	table: [
		["1", "2", "3"],
		["4", "5", "6"],
		["7", "8", "9"],
		["a", "b", "c"],
	]
});

lcd.print("Direction:");
let counter = 0;
encoder.register((dir) => {
	console.log("dir", dir);
	counter += dir;
	lcd.setCursor(10, 0);
	lcd.print(`${counter}`.padStart(4, " "));
});
encoderButton.onClick((state) => {
	lcd.setCursor(0, 1);
	lcd.print(state);
	setTimeout(() => {
		lcd.setCursor(0, 1);
		lcd.print("           ");
	}, 500);
});

buttonMatrix.onClick((label) => {
	console.log("Button matrix click", label);
});

