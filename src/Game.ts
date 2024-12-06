import { WebSocket } from "ws";
import { Chess } from "chess.js";
import { GAME_OVER, MOVE } from "./messages";

export class Game {
  public player1: WebSocket;
  public player2: WebSocket;
  private board: Chess;
  private startTime: Date;

  constructor(player1: WebSocket, player2: WebSocket) {
    this.player1 = player1;
    this.player2 = player2;
    this.board = new Chess();
    this.startTime = new Date();
  }

  makeMove(socket: WebSocket, move: { from: string; to: string }) {
    try {
      console.log(`Current turn: ${this.board.turn()}`);

      // Check if the correct player is making the move
      if (this.board.turn() === "w" && socket !== this.player1) {
        console.log("Invalid move: It's white's turn, but this is not player1.");
        return; // Return early if it's not the player's turn
      }
      if (this.board.turn() === "b" && socket !== this.player2) {
        console.log("Invalid move: It's black's turn, but this is not player2.");
        return; // Return early if it's not the player's turn
      }

      // Attempt the move
      const moveResult = this.board.move(move);
      if (!moveResult) {
        console.log("Invalid move: Move is not legal.", move);
        return; // Return early if the move is not legal
      }

      console.log("Move made successfully:", move);

      // Check if the game is over
      if (this.board.isGameOver()) {
        const winner = this.board.turn() === "w" ? "black" : "white";

        console.log("Game over. Winner:", winner);

        const gameOverMessage = JSON.stringify({
          type: GAME_OVER,
          payload: {
            winner,
          },
        });

        this.player1.send(gameOverMessage);
        this.player2.send(gameOverMessage);

        return;
      }

      // Broadcast the move to both players
      const moveMessage = JSON.stringify({
        type: MOVE,
        move,
      });

      this.player1.send(moveMessage);
      this.player2.send(moveMessage);

    } catch (error) {
      // Log any error that occurs during move handling
    //   console.error("Error while processing move:", error);
    return;
      // You may send a generic error message to players if needed, but we're returning silently for now.
    }
  }
}
