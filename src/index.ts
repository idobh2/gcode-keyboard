import Encoder from "./Encoder";
import { connect as connectToLCD } from "./HD44780";
import { ENCODER_PIN_A, ENCODER_PIN_B, LCD_D4, LCD_D5, LCD_D6, LCD_D7, LCD_EN, LCD_RS } from "./pins";

const encoder = new Encoder(ENCODER_PIN_A, ENCODER_PIN_B);

const lcd = connectToLCD(LCD_RS, LCD_EN, LCD_D4, LCD_D5, LCD_D6, LCD_D7);

lcd.print("Direction:");
encoder.register((dir) => {
	lcd.setCursor(10, 0);
	lcd.print(1 === dir ? "U" : "D");
});
