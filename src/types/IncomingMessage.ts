import { GAME_ACTIONS, GAME_STATE, SERVER_ACTIONS } from '../stateManager/stateManager'
export interface IncomingMessage {
    msg: ClientMessage
}

export interface ClientMessage {
    action: GAME_ACTIONS
    id?: string
    client_id?: string
    words?: Array<string>
    word?: string
}

export interface OutboundMessage {
    msg: ServerMessage
}

export interface ServerMessage {
    game_state?: GAME_STATE
    action?: SERVER_ACTIONS
    client_id?: string
    ids?: Array<string>
    next_turn?: string
    next_player?: string
    data?: Array<Object>
    words?: Array<Array<string>>
}
