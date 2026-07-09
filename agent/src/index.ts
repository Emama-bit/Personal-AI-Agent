import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

const args = process.argv.slice(2);

if (args.includes("--http")) {
  const portIdx = args.indexOf("--port");
  const port = portIdx !== -1 && args[portIdx + 1] ? parseInt(args[portIdx + 1]) : 3001;
  const { startHTTP } = require("./http");
  startHTTP(port);
} else {
  const { startCLI } = require("./cli");
  startCLI();
}
