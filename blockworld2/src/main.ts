import { Session } from "./app/session";
import { Game } from "./app/game";
import "./ui/style.css";
import { startOffline } from "./app/offline";
try {
  const game = new Game();
  const session = new Session(game);
  if (new URLSearchParams(location.search).get("test") === "1")
    Object.assign(window, {
      bw2: {
        session,
        game,
        snapshot: () => game.snapshot(),
        setPlayer: (p: any) => Object.assign(game.player, p),
        simulate: (input: any, seconds: number) => {
          const old = game.controls.movement;
          game.controls.movement = () => input;
          for (let t = 0; t < seconds; t += 1 / 60) game.update(1 / 60);
          game.controls.movement = old;
        },
        add: (b: any) => game.commands.place(b, false),
      },
    });
  void startOffline(session);
} catch (error) {
  const node = document.createElement("p");
  node.textContent = `Could not start: ${String(error)}`;
  document.querySelector("#app")!.append(node);
  console.error(error);
}
