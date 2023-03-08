// heavily based on the espruino HD44780 module by Gordon Williams
// https://www.espruino.com/modules/HD44780.js

export class HD44780 {
	constructor(readonly write: (x: number, y?: number) => void) {
		write(0x33, 1);
		write(0x32, 1);
		write(0x28, 1);
		write(0x0C, 1);
		write(0x06, 1);
		write(0x01, 1);
	}
	clear() { this.write(0x01, 1); }
	// print text
	print(str: string) {
		for (let i = 0; i < str.length; i++) {
			this.write(str.charCodeAt(i));
		}
	}
	// flashing block for the current cursor, or underline
	cursor(block) {
		this.write(block ? 0x0F : 0x0E, 1);
	}
	// set cursor pos, top left = 0,0
	setCursor(x, y) {
		const l = [0x00, 0x40, 0x14, 0x54]; this.write(0x80 | (l[y] + x), 1);
	}
	// set special character 0..7, data is an array(8) of bytes, and then return to home addr
	createChar(ch, data) {
		this.write(0x40 | ((ch & 7) << 3), 1);
		for (let i = 0; i < 8; i++) {
			this.write(data[i]);
		}
		this.write(0x80, 1);
	}
}


export function connect (rs: Pin, en: Pin, d4: Pin, d5: Pin, d6: Pin, d7: Pin) {
	const data = [d7, d6, d5, d4];
	digitalWrite(rs, 1);
	// @ts-expect-error digitalWrite accepts pin parameter as array
	digitalWrite([rs, en], 0);
	return new HD44780(function (x, c) {
		digitalWrite(rs, !c);
		// @ts-expect-error digitalWrite accepts pin parameter as array
		digitalWrite(data, x >> 4);
		digitalWrite(en, 1);
		digitalWrite(en, 0);
		// @ts-expect-error digitalWrite accepts pin parameter as array
		digitalWrite(data, x);
		digitalWrite(en, 1);
		digitalWrite(en, 0);
	});
}