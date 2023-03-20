window.addEventListener("load", async () => {
	const q = document.querySelector.bind(document);
	const lastErrorDiv = q("#lastError");
	const ssid = q("#ssid");
	const pass = q("#pass");
	const handlerType = q("#handlerType");
	const handlerAddr = q("#handlerAddress");
	const handlerData = q("#handlerData");
	const command = q("#command");
	const gcode = q("#gcode");

	function deployHandlerDataFields(handlerOptions, values = {}) {
		handlerData.innerHTML = "";
		for (const option of handlerOptions) {
			handlerData.innerHTML += `<div class="field"><label for="${option.name}">${option.label}</label> <input type=${option.type} id="${option.name}" value="${values[option.name] ?? ""}" />`;
		}
	}

	const settings = await fetch("/settings").then(r => r.json());
	const handlerOptions = await fetch("/handlerOptions").then(r => r.json());
	const lastError = await fetch("/lastError").then(r => r.text());
	const originalSettings = JSON.parse(JSON.stringify(settings));

	if (lastError) {
		lastErrorDiv.innerText = `Last error: ${lastError}`;
	}
	handlerType.innerHTML = Object.keys(handlerOptions).map(o => `<option value="${o}">${o}</option>`).join("");

	if (settings) {
		if (settings.net) {
			ssid.value = settings.net.ssid ?? "";
			pass.value = settings.net.pass ?? "";
		}
		if (settings.handler && settings.handler.type) {
			handlerType.value = settings.handler.type;
			handlerAddr.value = settings.handler.address ?? "";
			deployHandlerDataFields(handlerOptions[settings.handler.type], settings.handler.data);
		}

		if (settings.keymap) {
			const keys = Object.keys(settings.keymap);
			command.innerHTML = keys.map(k => `<option value=${k}>${k}</option>`).join("");
			command.value = keys[0];
			gcode.value = settings.keymap[keys[0]];
		}
	}

	window.handlerSelectionChange = (e) => {
		const selectedHandler = e.target.value;
		deployHandlerDataFields(handlerOptions[selectedHandler], selectedHandler === settings.handler?.type ? settings.handler.data : {});
	};

	window.commandSelectionChange = (e) => {
		const selectedCommand = e.target.value;
		gcode.value = settings.keymap[selectedCommand];
	};

	window.gcodeChanged = (e) => {
		const gcodeValue = e.target.value;
		const editedCommand = command.value;
		settings.keymap[editedCommand] = gcodeValue;
		for (const opt of command.querySelectorAll("option")) {
			if (editedCommand === opt.value) {
				const changed = gcodeValue !== originalSettings.keymap[editedCommand];
				opt.innerHTML = opt.innerHTML.replace(/\*?$/, changed ? "*" : "");
				opt.style.fontWeight = changed ? "bold" : "normal";
			}
		}

	};

	window.saveChanges = async () => {
		if (!confirm("Save changes and reboot?")) {
			return;
		}
		const newSettings = {
			net: {
				ssid: ssid.value,
				pass: pass.value,
			},
			handler: {
				type: handlerType.value,
				address: handlerAddr.value,
				data: [...handlerData.querySelectorAll("input")].reduce((a, b) => ({ ...a, [b.id]: b.value }), {})
			},
			keymap: settings.keymap,
		};
		await fetch("/settings", { method: "POST", body: JSON.stringify(newSettings) });
	};
});