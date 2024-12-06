import { WebSocket } from "ws";
import { Game } from "./Game";
import { INIT_GAME, MOVE } from "./messages";

export class GameManager{

    private games:Game[];
    private pendingUser:WebSocket | null;
    private Users:WebSocket[]=[]

    constructor(){
        this.games = [];
        this.pendingUser = null;
        this.Users = [];
    }


    addUser(socket:WebSocket){
        // console.log("printing 1")
        this.Users.push(socket);
        console.log("user connected");
        this.addHandler(socket)
       
    }

    removeUser(socket:WebSocket){
        this.Users = this.Users.filter(x=>x!==socket);
       
        
    }


    private addHandler(socket:WebSocket){
        socket.on("message",(message)=>{
            const parsedMessage = JSON.parse(message.toString())
            console.log("req received")
            if(parsedMessage.type==INIT_GAME){
                if(this.pendingUser){
                    const game = new Game(socket,this.pendingUser)
                    this.games.push(game);
                    this.pendingUser = null;
                    game.player1.send(JSON.stringify({
                        type:INIT_GAME,
                        payload:{
                            color:"white"
                        }
                    }))
                    game.player2.send(JSON.stringify({
                        type:INIT_GAME,
                        payload:{
                            color:"black"
                        }
                    }))

                }
                else{
                    this.pendingUser = socket;
                }
                
            }

            if(parsedMessage.type===MOVE){
                const game = this.games.find(game=>game.player1==socket || game.player2==socket)
                if(game){
                    console.log("inside move")
                    game.makeMove(socket,parsedMessage.move);

                }
            }
        })
    }
}