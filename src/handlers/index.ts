import OctoPrint, { OctoPrintData } from "./impl/OctoPrint";
import ESP3DWebUI, { ESP3DWebUIData } from "./impl/ESP3DWebUI";

export interface HandlerDataMapping {
	OctoPrint: OctoPrintData,
	ESP3DWebUI: ESP3DWebUIData,
}

export type HandlerName = keyof HandlerDataMapping;

const handlers = {
	OctoPrint,
	ESP3DWebUI
};


export const handlerNames = Object.keys(handlers) as HandlerName[];

export default handlers;
