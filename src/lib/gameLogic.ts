import { Grade } from "./srs"

export type GameState = {
    score: number
    credit: number
    tier: number
    points: number
    multiplier: number
}
export function initialGameState(): GameState {
    return {
        score: 0,
        credit: 0,
        tier: 0,
        points: 0,
        multiplier: 1,

    }
}

export function calculateBasePoints( gameState: GameState, grade: Grade ) {
    var basePoints = 0;
    switch (grade) {
        case "easy":
            basePoints += 500;
            break;
        case "good":
            basePoints += 300;
            break;
        case "hard":
            basePoints += 200;
            break;
        case "wrong":
            basePoints += 100;
            break;
        default:
            basePoints += 300;
    }
    const result: GameState = {...gameState, points: basePoints};
    return result;   
}

export function calculateTimePoints( gameState: GameState, timeTaken: number) {
    const result: GameState = {...gameState, points: gameState.points+(Math.max(0, 60-timeTaken))}
    return result;
}

export function calculateTimeMult(gameState: GameState, timeTaken: number) {
    const result: GameState = {...gameState, multiplier: gameState.multiplier+(Math.max(0, 60-timeTaken)/500)}
    return result;
}

export function calculateMultPoints(gameState: GameState) {
    const result: GameState = {...gameState, points:gameState.points*gameState.multiplier};
    return result;
}

export function calculateMultiplierStreak(gameState: GameState, grade: Grade) {
    const result: GameState = {...gameState, multiplier:(grade !== "wrong") ? gameState.multiplier+0.1 : 1}
    return result;
}
export function savePointstoScore(gameState: GameState) {
    const result: GameState = {...gameState, score:gameState.points+gameState.score, points:0};
    return result;
}

export function calculateReturnPoints(gameState: GameState) {
    return {...gameState, points: gameState.points + 250}
}