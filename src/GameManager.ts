import { WebSocket } from "ws";
import { Game } from "./Game";
import { INIT_GAME, MOVE, GAME_ABANDONED } from "./messages";

export class GameManager {
  private games: Game[];
  private pendingUser: WebSocket | null;
  private Users: WebSocket[] = [];

  constructor() {
    this.games = [];
    this.pendingUser = null;
    this.Users = [];
  }

  addUser(socket: WebSocket) {
    this.Users.push(socket);
    console.log("User connected");
    this.addHandler(socket);

    console.log("--------------------------------------------------------");
    console.log("No of users are: " + this.Users.length);
    console.log("No of current games are: " + this.games.length);
    console.log("No of pending users are: " + this.pendingUser);
    console.log("--------------------------------------------------------");
  }

  removeUser(socket: WebSocket) {
    this.Users = this.Users.filter((x) => x !== socket);

    // Handle case where the user is in a pending state
    if (this.pendingUser === socket) {
      this.pendingUser = null;
    }

    // Check if the user was part of any game
    const game = this.games.find((game) => game.player1 === socket || game.player2 === socket);
    if (game) {
      // Notify the other player
      const otherPlayer = game.player1 === socket ? game.player2 : game.player1;
      if (otherPlayer.readyState === WebSocket.OPEN) {
        otherPlayer.send(
          JSON.stringify({
            type: GAME_ABANDONED,
            payload: { message: "The game has been abandoned by your opponent." },
          })
        );
      }

      // Remove the game from the list
      this.games = this.games.filter((g) => g !== game);
      console.log("Game ended due to user disconnection");
    }
  }

  private addHandler(socket: WebSocket) {
    socket.on("message", (message) => {
      const parsedMessage = JSON.parse(message.toString());
      console.log("Request received");
      if (parsedMessage.type === INIT_GAME) {
        if (this.pendingUser) {
          const game = new Game(socket, this.pendingUser);
          this.games.push(game);
          this.pendingUser = null;
          game.player1.send(
            JSON.stringify({
              type: INIT_GAME,
              payload: { color: "white" },
            })
          );
          game.player2.send(
            JSON.stringify({
              type: INIT_GAME,
              payload: { color: "black" },
            })
          );
        } else {
          this.pendingUser = socket;
        }
      }

      if (parsedMessage.type === MOVE) {
        const game = this.games.find((game) => game.player1 === socket || game.player2 === socket);
        if (game) {
          console.log("Processing move");
          game.makeMove(socket, parsedMessage.move);
        }
      }
    });

    // Handle user disconnection
    socket.on("close", () => {
      console.log("User disconnected");
      this.removeUser(socket);
    });
  }
}
