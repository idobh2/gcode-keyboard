import OctoPrint, { OctoPrintData } from "./impl/OctoPrint";
import ESP3DWebUI, { ESP3DWebUIData } from "./impl/ESP3DWebUI";
import CNCjs, { CNCjsData } from "./impl/CNCJS";
import { GCodeHandlerClass } from "./GCodeHandler";

export interface HandlerDataMapping {
	OctoPrint: OctoPrintData,
	ESP3DWebUI: ESP3DWebUIData,
	CNCjs: CNCjsData
}

export type HandlerName = keyof HandlerDataMapping;

const handlers: { [key in HandlerName]: GCodeHandlerClass<HandlerDataMapping[key]> } = {
	OctoPrint,
	ESP3DWebUI,
	CNCjs,
};


export const handlerNames = Object.keys(handlers) as HandlerName[];

export default handlers;
