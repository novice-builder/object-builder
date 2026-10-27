import http from "node:http";
import { readFile } from "node:fs/promises";
const game = await readFile(
  new URL("../BlockWorld_Neighborhood_03.html", import.meta.url),
);
http
  .createServer((req, res) => {
    if (req.url === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.url.split("?")[0] !== "/") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(game);
  })
  .listen(8080, "0.0.0.0", () =>
    console.log(
      "Little Block Lane: http://localhost:8080 (LAN: http://YOUR-COMPUTER-IP:8080)",
    ),
  );
