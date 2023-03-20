import { minify, bundle, transform } from "@swc/core";
import minifyHtml from "@minify-html/node";
import path from "path";
import fs from "fs/promises";
import { init, sendCode } from "espruino";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildSettingsEditor() {
	const writeSettingsEditorFile = async (basename, targetBaseName, preProcess) => {
		const fullPath = path.resolve(__dirname, "src/settingsManager/settingsEditor", basename);
		const fullTargetPath = path.resolve(__dirname, "src/settingsManager/settingsEditor", targetBaseName);
		const content = await fs.readFile(fullPath, "utf-8");
		const processedContent = await preProcess(content);
		const replacedContent = processedContent.toString("utf-8").replace(/(`|\${|\\)/g, "\\$1");
		await fs.writeFile(fullTargetPath, `export default \`${replacedContent}\`;`);
	};

	await writeSettingsEditorFile("settings.html", "settings.html.js", async (content) => {
		return minifyHtml.minify(
			Buffer.from(content),
			{
				minify_css: true,
				minify_js: true,
			}
		);
	});
	await writeSettingsEditorFile("settings.css", "settings.css.js", async (content) => {
		return minifyHtml.minify(
			Buffer.from(content),
			{
				minify_css: true,
				minify_js: true,
			}
		);
	});

	await writeSettingsEditorFile("settings.js", "settings.min.js", async (content) => {
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

}

try {
	await buildSettingsEditor();

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