"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const trpcExpress = __importStar(require("@trpc/server/adapters/express"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const main_1 = require("./src/main");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const port = 8080;
app.use((0, helmet_1.default)());
app.use('/trpc', trpcExpress.createExpressMiddleware({
    router: main_1.appRouter,
    createContext() {
        return {};
    },
}));
app.get('/', (req, res) => {
    res.send('Hello from api-server');
});
app.listen(port, () => {
    console.log(`api-server listening at http://localhost:${port}`);
    // const queryData = setInterval(async () => {
    //     await getLocations();
    //     await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
    //     await getWeather();
    //     console.log('Updated data');
    // }, 2 * 60 * 1000 /* 2 minutes */);
});
