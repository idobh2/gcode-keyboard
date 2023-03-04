import { minify, bundle, transform } from "@swc/core";
import path from "path";
import { init, sendCode } from "espruino";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
	const { ["index.ts"]: { code: bundled } } = await bundle({
		entry: path.resolve(__dirname, "src/index.ts"),
	});
	const { code: transformed } = await transform(bundled, {
		jsc: {
			target: "es5",
		}
	});
	const { code } = await minify(transformed, {
		compress: true,
	});

	await new Promise(r => init(r));
	// Espruino is globally defined in the "espruino" module
	/* eslint-disable no-undef */
	Espruino.Config.BAUD_RATE = "115200";
	Espruino.Config.RESET_BEFORE_SEND = false;
	Espruino.Config.SAVE_ON_SEND = true;
	Espruino.Config.WEB_BLUETOOTH = false;
	Espruino.Config.BLUETOOTH_LOW_ENERGY = false;
	/* eslint-enable no-undef */
	await new Promise(r => sendCode("COM5", code, r));
	console.log("Build finished successfully");
	process.exit(0);
} catch (e) {
	console.log("Build finished with errors", e);
	process.exit(1);
}