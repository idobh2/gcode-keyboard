export type EventListener = (state: string) => void;

export interface ButtonMatrixProperties {
	rows: Pin[];
	cols: Pin[];
	table: string[][];
}

export default class ButtonMatrix {
	private listeners: EventListener[] = [];

	constructor(readonly matrixProps: ButtonMatrixProperties) {
		matrixProps.cols.forEach(pin => {
			pinMode(pin, "input_pullup", false);
			setWatch(this.handleColumnTriggered, pin, { repeat: true, edge: "falling", debounce: 10, });
		});
		matrixProps.rows.forEach(pin => {
			pinMode(pin, "output", false);
			pin.write(false);
		});
	}
	private handleColumnTriggered = ({ pin: colPin }) => {
		const colIndex = this.matrixProps.cols.indexOf(colPin);
		if (-1 === colIndex) {
			console.log("Couldn't find col index");
			return;
		}
		const rowIndex = this.matrixProps.rows.findIndex((rowPin) => {
			// write HIGH and see if the triggered pin has changed
			rowPin.write(true);
			let found = false;
			if (colPin.read() && colPin.read() && colPin.read()) { // 3 consecutive read to avoid noise breadboard
				found = true;
			}
			rowPin.write(false);
			return found;
		});
		if (-1 === rowIndex) {
			console.log("Couldn't find row index");
			return;
		}
		this.reportClick(this.matrixProps.table[rowIndex][colIndex]);
	};

	get buttonLabels(): string[] {
		return this.matrixProps.table.reduce((a, b) => [...a, ...b], []);
	}

	private reportClick(state: string) {
		this.listeners.forEach(l => l(state));
	}

	onClick(l: EventListener) {
		this.listeners.push(l);
	}
}