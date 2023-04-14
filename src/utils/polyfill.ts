
/* espruino takes care of adding event-emitter style interface to all objects */
declare global {
	interface Object {
		on: <T = unknown>(event: string, listener: (data: T) => void) => void;
		emit: <T = unknown>(event: string, data?: T) => void
	}
}

Promise.race = (promises) => {
	return new Promise((res, rej) => {
		let fulfilled = false;
		promises.forEach((prom) => {
			prom.then((val) => {
				if (fulfilled) {
					return;
				}
				fulfilled = true;
				res(val);
			}).catch((err) => {
				if (fulfilled) {
					return;
				}
				fulfilled = true;
				rej(err);
			});
		});
	});
};

export default {};