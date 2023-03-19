export * from "./http";

export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const promisify = (fn) => {
	return (...args) => new Promise((res, rej) => {
		fn(...args, (err, value) => {
			if (null !== err) {
				rej(err);
				return;
			}
			res(value);
		});
	});
};