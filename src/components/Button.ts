const TIME_TO_REPORT = 300;

export enum State {
	Click = "Click",
	DoubleClick = "DoubleClick",
	ClickHold = "ClickHold",
	Hold = "Hold",
	Release = "Release",
}

export type EventListener = (state: State) => void;

export default class Button {
	private listeners: EventListener[] = [];
	private clickTimer: NodeJS.Timeout | null = null;
	private shouldReportRelease = false;
	private stateRecord: boolean[] = [];

	constructor(pin: Pin) {
		pinMode(pin, "input_pullup", false);
		setWatch(({ state }) => {
			this.stateRecord.push(state);
			if (!state) { // pressed
				if (!this.clickTimer) {
					this.stateRecord.splice(0);
					this.stateRecord = [false];
					this.clickTimer = setTimeout(() => {
						this.clickTimer = null;
						// @ts-expect-error works with boolean[] as well
						const recordedState = this.stateRecordToBitmask(this.stateRecord.splice(0));
						switch (recordedState) {
							case 0b1:
								this.reportState(State.Click);
								break;
							case 0b0:
								this.shouldReportRelease = true;
								this.reportState(State.Hold);
								break;
							case 0b010:
								this.shouldReportRelease = true;
								this.reportState(State.ClickHold);
								break;
							case 0b0101:
								this.reportState(State.DoubleClick);
								break;
						}
					}, TIME_TO_REPORT);
				}
			} else {
				if (this.shouldReportRelease) {
					this.stateRecord.splice(0);
					this.shouldReportRelease = false;
					this.reportState(State.Release);
				}
			}
		}, pin, { repeat: true, edge: "both", debounce: 10 });
	}

	private stateRecordToBitmask(stateRecord: number[]) {
		return stateRecord.reduce((a, b, i) => a |= (b << (stateRecord.length - 1 - i)), 0);
	}

	private reportState(state: State) {
		this.listeners.forEach(l => l(state));
	}

	onClick(l: EventListener) {
		this.listeners.push(l);
		return () => this.listeners.splice(this.listeners.indexOf(l), 1);
	}
}
