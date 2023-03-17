// using interface instead of class due to transpiling+espruino limitations
interface GCodeHandler {
	address: string;
	data: unknown;
	healthcheck(): Promise<void>;
}

export default GCodeHandler;
