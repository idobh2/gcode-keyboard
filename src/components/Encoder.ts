// heavily based on the espruino tutorial
// https://www.espruino.com/Puck.js+Rotary+Encoder

export type ChangeListener = (direction: number) => void;

export default class Encoder {
	private state: {
		a: boolean;
		b: boolean;
		incr: 1 | -1 | 0;
		second: boolean;
	};

	private listeners: ChangeListener[] = [];

	constructor(private readonly pinA: Pin, private readonly pinB: Pin) {
		pinMode(this.pinA, "input_pullup", false);
		pinMode(this.pinB, "input_pullup", false);
		this.state = {
			a: this.pinA.read(),
			b: this.pinB.read(),
			incr: 0,
			second: false,
		};
		setWatch(this.handleChange, this.pinA, { repeat: true });
		setWatch(this.handleChange, this.pinB, { repeat: true });
	}
	private handleChange = () => {
		const a = this.pinA.read();
		const b = this.pinB.read();
		if (a !== this.state.a) {
			this.state.a = a;
			if (b !== this.state.b) {
				this.state.b = b;
				const incr = (a === b) ? 1 : -1;
				if (incr !== this.state.incr || !this.state.second) {
					this.reportChange(incr);
				}
				this.state.incr = incr;
				this.state.second = !this.state.second;
			}
		}
	};
	private reportChange(dir: number) {
		this.listeners.forEach(l => l(dir));
	}
	register(l: ChangeListener) {
		this.listeners.push(l);
		return () => this.listeners.splice(this.listeners.indexOf(l), 1);
	}
}
