import { broadcastMessage } from '..'
import { WebSocket } from 'ws'
import { GAME_STATE, Game, SERVER_ACTIONS } from '../stateManager/stateManager'

export default function guessHandler(
    games: { [userId: string]: Game },
    ws: WebSocket,
    username: string,
    word: string
) {
    if (!Object.keys(games).length || !games[username]) {
        return
    }
    const activeGame = games[username]
    if (activeGame.state !== GAME_STATE.ongoing) {
        return
    }
    if (activeGame.getCurrentPlayer().id !== username) {
        ws.send(JSON.stringify({ msg: { error: 'It is not your turn' } }))
        return
    }

    // Update the game state
    activeGame.guess(word)

    // Check if the latest move wins the game, if so we reveal the words of both players
    if (activeGame.checkWinner()) {
        activeGame.state = GAME_STATE.gameover
        broadcastMessage({
            msg: {
                action: SERVER_ACTIONS.guess,
                ids: [activeGame.players[0].id, activeGame.players[1].id],
                next_player: activeGame.getCurrentPlayer().id,
                data: [
                    {
                        matches: activeGame.players[0].matches,
                        guesses: activeGame.players[0].guesses,
                    },
                    {
                        matches: activeGame.players[1].matches,
                        guesses: activeGame.players[1].guesses,
                    },
                ],
                game_state: GAME_STATE.gameover,
                words: [activeGame.players[0].wordList, activeGame.players[1].wordList],
            },
        })
    } else {
        // Push game state to both clients
        broadcastMessage({
            msg: {
                action: SERVER_ACTIONS.guess,
                ids: [activeGame.players[0].id, activeGame.players[1].id],
                next_player: activeGame.getOpponentPlayer().id,
                data: [
                    {
                        matches: activeGame.players[0].matches,
                        guesses: activeGame.players[0].guesses,
                    },
                    {
                        matches: activeGame.players[1].matches,
                        guesses: activeGame.players[1].guesses,
                    },
                ],
            },
        })
        activeGame.isPlayerOneTurn = !activeGame.isPlayerOneTurn
    }
}
