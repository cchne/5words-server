import { WebSocket, WebSocketServer, RawData } from 'ws'
import http from 'http'
import { IncomingMessage, OutboundMessage } from './types/IncomingMessage'
import { Game, GAME_ACTIONS, SERVER_ACTIONS } from './stateManager/stateManager'
import joinHandler from './handlers/joinHandler'
import setupHandler from './handlers/setupHandler'
import guessHandler from './handlers/guessHandler'
import { v4 } from 'uuid'

const server = http.createServer()
const wsServer = new WebSocketServer({ server })
const port = 8000
server.listen(port, () => {
    console.log(`WebSocket server is running on port ${port}`)
})

// Object to hold active connections
const clients: { [key: string]: WebSocket } = {}
// Map the user id to their active game
const games: { [userId: string]: Game } = {}

export function broadcastMessage(json: OutboundMessage) {
    // Send the data to all connected clients
    const data = JSON.stringify(json)
    for (let userId in clients) {
        let client = clients[userId]
        if (client.readyState === WebSocket.OPEN) {
            client.send(data)
        }
    }
}

function handleMessage(message: RawData, userId: string) {
    if (message.toString() === 'ping') {
        clients[userId].send('pong')
        return
    }
    let jsonData: IncomingMessage
    try {
        jsonData = JSON.parse(message.toString())
    } catch (error) {
        console.log(error)
        return
    }
    const clientMsg = jsonData.msg
    try {
        switch (clientMsg.action) {
            case GAME_ACTIONS.join:
                joinHandler(games, clients[userId], clientMsg.client_id)
                break
            case GAME_ACTIONS.setup:
                setupHandler(games, clients[userId], clientMsg.id, clientMsg.words)
                break
            case GAME_ACTIONS.guess:
                guessHandler(games, clients[userId], clientMsg.id, clientMsg.word)
                break
            case GAME_ACTIONS.restart:
                games[clientMsg.client_id].restartGame()
                broadcastMessage({
                    msg: { action: SERVER_ACTIONS.restart },
                })
                break
            case GAME_ACTIONS.RESET:
                for (var member in games) delete games[member]
                break
            default:
                break
        }
    } catch (error) {
        // ACTION keyword should always be present
        return
    }
}

function handleDisconnect(userId: string) {
    console.log(`${userId} disconnected.`)
    delete clients[userId]
}

wsServer.on('connection', function (connection) {
    // Generate a unique id for every user
    const userId = v4()

    // Store the new connection and handle messages
    clients[userId] = connection
    console.log(`${userId} connected.`)
    connection.on('message', (message) => handleMessage(message, userId))
    // User disconnected
    connection.on('close', () => handleDisconnect(userId))
})
