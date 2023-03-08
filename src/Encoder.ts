// heavily based on the espruino Encoder module by Gordon Williams
// http://www.espruino.com/modules/Encoder.js 

export type ChangeListener = (direction: number) => void;

export default class Encoder {
	private last: number;

	private listeners: ChangeListener[] = [];

	constructor(private readonly pinA: Pin, private readonly pinB: Pin) {
		pinMode(this.pinA, "input_pulldown", false);
		pinMode(this.pinB, "input_pulldown", false);

		setWatch(this.handleChange, this.pinA, { repeat: true });
		setWatch(this.handleChange, this.pinB, { repeat: true });
	}
	private handleChange = () => {
		// @ts-expect-error read() actually returns a number
		const a: number = this.pinA.read();
		// @ts-expect-error read() actually returns a number
		const b: number = this.pinB.read();
		let s = 0;
		switch (this.last) {
			case 0b00: {
				if (a) {
					s++;
				}
				if (b) {
					s--;
				}
				break;
			}
			case 0b01: {
				if (!a) {
					s--;
				}
				if (b) {
					s++;
				} break;
			}
			case 0b10: {
				if (a) {
					s--;
				}
				if (!b) {
					s++;
				} break;
			}
			case 0b11: {
				if (!a) {
					s++;
				}
				if (!b) {
					s--;
				}
				break;
			}
		}
		this.last = a | (b << 1);
		if (s !== 0) {
			this.reportChange(s);
		}
	};
	private reportChange(dir: number) {
		this.listeners.forEach(l => l(dir));
	}
	register(listener: ChangeListener) {
		this.listeners.push(listener);
	}
}
