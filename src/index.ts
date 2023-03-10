import Encoder from "./Encoder";
import Button from "./Button";
import { connect as connectToLCD } from "./HD44780";
import { ENCODER_BTN_PIN, ENCODER_PIN_A, ENCODER_PIN_B, LCD_D4, LCD_D5, LCD_D6, LCD_D7, LCD_EN, LCD_RS } from "./pins";

const encoder = new Encoder(ENCODER_PIN_A, ENCODER_PIN_B);

const lcd = connectToLCD(LCD_RS, LCD_EN, LCD_D4, LCD_D5, LCD_D6, LCD_D7);

lcd.print("Direction:");
let counter = 0;
encoder.register((dir) => {
	console.log("dir", dir);
	counter += dir;
	lcd.setCursor(10, 0);
	lcd.print(`${counter}`.padStart(4, " "));
});
new Button(ENCODER_BTN_PIN).onClick((state) => {
	lcd.setCursor(0, 1);
	lcd.print(state);
	setTimeout(() => {
		lcd.setCursor(0, 1);
		lcd.print("           ");
	}, 500);
});
