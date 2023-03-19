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