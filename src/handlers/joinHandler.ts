import { broadcastMessage } from '..'
import { WebSocket } from 'ws'
import { GAME_STATE, SERVER_ACTIONS, Game, Player } from '../stateManager/stateManager'

export default function joinHandler(
    games: { [userId: string]: Game },
    ws: WebSocket,
    username: string
    // Join Game Key TODO
) {
    if (Object.keys(games).length) {
        if (!games[username]) {
            // If active game already present and is 2nd player
            // Create the new player
            const player2 = new Player(username, ws)
            const activeGame = games[Object.keys(games)[0]]
            activeGame.players[1] = player2
            games[player2.id] = activeGame
            ws.send(
                JSON.stringify({
                    msg: {
                        player_id: player2.id,
                        action: SERVER_ACTIONS.joined,
                    },
                })
            )
            // Tell both players their opponent's name
            ws.send(
                JSON.stringify({
                    msg: {
                        player_id: activeGame.players[0].id,
                        action: SERVER_ACTIONS.oppo_joined,
                    },
                })
            )
            activeGame.players[0].conn.send(
                JSON.stringify({
                    msg: {
                        player_id: player2.id,
                        action: SERVER_ACTIONS.oppo_joined,
                    },
                })
            )
            // Tell clients to proceed to next phase
            broadcastMessage({
                msg: {
                    game_state: GAME_STATE.setup,
                },
            })
            // Proceed to the next phase
            activeGame.state = GAME_STATE.setup
        } else {
            // Game full
        }
    } else {
        // Make a new game and add player1
        const game = new Game()
        const player1 = new Player(username, ws)
        game.players[0] = player1
        games[player1.id] = game
        ws.send(
            JSON.stringify({
                msg: {
                    player_id: player1.id,
                    action: SERVER_ACTIONS.joined,
                },
            })
        )
    }
}
