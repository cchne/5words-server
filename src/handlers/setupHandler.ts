import { broadcastMessage } from '..'
import { WebSocket } from 'ws'
import { GAME_STATE, SERVER_ACTIONS, Game, Player } from '../stateManager/stateManager'

export default function setupHandler(
    games: { [userId: string]: Game },
    ws: WebSocket,
    username: string,
    words: Array<string>
) {
    if (!Object.keys(games).length || !games[username]) {
        return
    }
    // Get the current game the user has joined
    const activeGame = games[username]
    const gamePlayers: Array<Player> = Object.values(activeGame.players)

    // Add words to the current player
    // Players do not take turns to add words
    const currentPlayer = gamePlayers.filter((element) => {
        return element.clientId === username
    })[0]
    for (const word of words) {
        currentPlayer.addWord(word)
    }
    ws.send(
        JSON.stringify({
            msg: { action: SERVER_ACTIONS.player_ready, words: currentPlayer.wordList },
        })
    )
    // Tell both clients that a player is ready
    broadcastMessage({
        msg: { action: SERVER_ACTIONS.player_ready, client_id: currentPlayer.clientId },
    })
    if (activeGame.getCurrentPlayer().readyStart && activeGame.getOpponentPlayer().readyStart) {
        // Tell both clients to proceed to next phase
        broadcastMessage({
            msg: {
                game_state: GAME_STATE.ongoing,
                next_turn: activeGame.getCurrentPlayer().id,
            },
        })
        activeGame.state = GAME_STATE.ongoing
    }
}
