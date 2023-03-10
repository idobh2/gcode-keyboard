export type EventListener = () => void;

export default class Button {
	private listeners: EventListener[] = [];
	constructor(pin: Pin) {
		pinMode(pin, "input_pullup", false);
		setWatch(() => {
			this.listeners.forEach(l => l());
		}, pin, { repeat: true, edge: "falling", debounce: 10 });
	}

	onClick(l: EventListener) {
		this.listeners.push(l);
	}
}
