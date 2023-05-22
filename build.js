import { minify, bundle, transform } from "@swc/core";
import minifyHtml from "@minify-html/node";
import path from "path";
import fs from "fs/promises";
import { init, sendCode } from "espruino";
import { fileURLToPath } from "url";

const SERIAL_PORT = "COM5";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sendCodeToSerialPort = code => new Promise(r => sendCode(SERIAL_PORT, code, r));

async function buildSettingsEditor() {
	const writeSettingsEditorFile = async (basename, contentType, preProcess) => {
		const fullPath = path.resolve(__dirname, "src/settingsManager/settingsEditor", basename);
		const content = await fs.readFile(fullPath, "utf-8");
		const processedContent = await preProcess(content);
		return {
			mime: contentType,
			content: processedContent.toString("utf-8")
		};
	};

	const settingsHtml = await writeSettingsEditorFile("settings.html", "text/html", async (content) => {
		return minifyHtml.minify(
			Buffer.from(content),
			{
				minify_css: true,
				minify_js: true,
			}
		);
	});

	const settingsCss = await writeSettingsEditorFile("settings.css", "text/css", async (content) => {
		return minifyHtml.minify(
			Buffer.from(content),
			{
				minify_css: true,
				minify_js: true,
			}
		);
	});

	const settingsJs = await writeSettingsEditorFile("settings.js", "text/javascript", async (content) => {
		const { code: transformed } = await transform(content, {
			jsc: {
				target: "es2019"
			}
		});
		const { code } = await minify(transformed, {
			compress: true,
		});
		return code;
	});

	return {
		"settings.html": settingsHtml,
		"settings.css": settingsCss,
		"settings.js": settingsJs
	};

}

try {
	const { ["index.ts"]: { code: bundled } } = await bundle({
		entry: path.resolve(__dirname, "src/index.ts"),
		externalModules: ["Wifi", "http", "net", "crypto", "fs", "Storage"],
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
	const settingsEditorFiles = await buildSettingsEditor();
	const seFilesStatement = `require("Storage").writeJSON("sefiles", ${JSON.stringify(settingsEditorFiles)})`;
	await sendCodeToSerialPort(seFilesStatement);
	await sendCodeToSerialPort(code);

	console.log("Build finished successfully");
	process.exit(0);
} catch (e) {
	console.log("Build finished with errors", e);
	process.exit(1);
}