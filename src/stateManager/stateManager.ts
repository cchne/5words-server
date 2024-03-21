import WebSocket from 'ws'

export enum GAME_STATE {
    //  Players are joining the game
    'joining' = 'joining',
    // Players are setting up their words
    'setup' = 'setup',
    // Players take turns guessing
    'ongoing' = 'ongoing',
    // One player has won
    'gameover' = 'gameover',
}

// Actions sent by the client
export enum GAME_ACTIONS {
    'RESET' = 'RESET',
    'join' = 'join',
    'setup' = 'setup',
    'guess' = 'guess',
    'restart' = 'restart',
}

// Actions sent by the server
export enum SERVER_ACTIONS {
    'joined' = 'joined',
    'oppo_joined' = 'oppo_joined',
    'player_ready' = 'player_ready',
    'guess' = 'guess',
    'restart' = 'restart',
}

export class Player {
    id: string
    clientId: string
    wordList: Array<string>
    matches: Array<Array<string>>
    guesses: Array<string>
    readyStart: boolean
    winCondition: Array<boolean>
    conn: WebSocket

    constructor(clientId: string, ws: WebSocket) {
        this.id = clientId
        this.clientId = clientId
        this.wordList = []
        this.matches = []
        this.guesses = []
        this.readyStart = false
        this.winCondition = new Array(5).fill(false)
        this.conn = ws
    }
    public addWord(word: string) {
        if (this.wordList.length < 5) {
            this.wordList.push(word.substring(0, 5))
        }
        if (this.wordList.length === 5) {
            this.readyStart = true
        }
    }

    public clearWords() {
        this.wordList = []
    }

    // Reset player for new game
    public resetState() {
        this.wordList = []
        this.matches = []
        this.guesses = []
        this.readyStart = false
        this.winCondition = new Array(5).fill(false)
    }
}

interface PlayersObject {
    [id: number]: Player
}

export class Game {
    state: GAME_STATE
    players: PlayersObject
    isPlayerOneTurn: boolean

    constructor() {
        this.state = GAME_STATE.joining
        this.players = {}
        this.isPlayerOneTurn = true
    }
    public getCurrentPlayer(): Player {
        return this.isPlayerOneTurn ? this.players[0] : this.players[1]
    }
    public getOpponentPlayer(): Player {
        return this.isPlayerOneTurn ? this.players[1] : this.players[0]
    }

    public guess(guessword: string) {
        const currentPlayer = this.getCurrentPlayer()
        const opponentPlayer = this.getOpponentPlayer()
        const roundMatches: Array<string> = []
        opponentPlayer.wordList.forEach((word: string, index: number) => {
            if (!currentPlayer.winCondition[index]) {
                const matchResult = matchWord(word, guessword)
                roundMatches.push(matchResult)
                if (matchResult === 'ooooo') {
                    currentPlayer.winCondition[index] = true
                }
            } else {
                roundMatches.push('MATCH')
            }
        })
        currentPlayer.matches.push(roundMatches)
        currentPlayer.guesses.push(guessword)
    }

    public checkWinner() {
        for (const i in [...Array(5).keys()]) {
            if (!this.getCurrentPlayer().winCondition[i]) {
                return false
            }
        }
        return true
    }

    public restartGame() {
        // Reset both players
        Object.values(this.players).forEach((player: Player) => {
            player.resetState()
        })
        // Reset the game state
        this.state = GAME_STATE.setup
        // Reset the player turn order
        this.isPlayerOneTurn = true
    }
}

function matchWord(word: string, guess: string): string {
    // x: Letter is wrong
    // o: Letter is correct
    // y: Letter is correct but wrong position
    let resultString = ''
    // First pass, check for correct
    word.split('').forEach((letter: string, c: number) => {
        if (letter === guess.charAt(c)) {
            resultString += 'o'
        } else {
            resultString += 'x'
        }
    })
    // 2nd pass, check for wrong position
    const used = new Array(5).fill(false)
    guess.split('').forEach((letter: string, c: number) => {
        if (resultString.charAt(c) === 'x') {
            const charOccurences = findChars(word, letter)
            if (charOccurences.length) {
                for (const i of charOccurences) {
                    if (!(resultString.charAt(i) === 'o') && !used[i]) {
                        resultString = setCharAt(resultString, c, 'y')
                        used[i] = true
                    }
                }
            }
        }
    })
    return resultString
}

function findChars(s: string, ch: string): Array<number> {
    let indices = []
    let index = 0
    while ((index = s.indexOf(ch, index)) >= 0) indices.push(index++)
    return indices
}

function setCharAt(str: string, index: number, chr: string) {
    if (index > str.length - 1) return str
    return str.substring(0, index) + chr + str.substring(index + 1)
}
