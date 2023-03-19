import { minify, bundle, transform } from "@swc/core";
import minifyHtml from "@minify-html/node";
import path from "path";
import fs from "fs/promises";
import { init, sendCode } from "espruino";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
	const settingsHtmlPath = path.resolve(__dirname, "src/settingsManager/settings.html");
	const settingsHtmlContent = await fs.readFile(settingsHtmlPath, "utf-8");
	const minifiedHtmlContent = minifyHtml.minify(
		Buffer.from(
			settingsHtmlContent
				.replace(/(`|\$)/g, "\\$1")
		),
		{
			minify_css: true,
			minify_js: true,
		}
	);
	await fs.writeFile(`${settingsHtmlPath}.js`, `export default \`${minifiedHtmlContent}\`;`);

	const { ["index.ts"]: { code: bundled } } = await bundle({
		entry: path.resolve(__dirname, "src/index.ts"),
		externalModules: ["Wifi", "http", "Storage"],
		options: {

		}
	});
	const { code: transformed } = await transform(bundled, {
		jsc: {
			target: "es5",
		},
		module: {
			type: "commonjs",
			importInterop: "none",
		},
	});
	await fs.writeFile(path.resolve(__dirname, "out.tmp.js"), transformed);
	const { code } = await minify(transformed, {
		compress: true,
	});
	await fs.writeFile(path.resolve(__dirname, "out.tmp.min.js"), code);

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