import { Grade } from "./srs"
import { ArtifactType } from "./types"

export type GameState = {
    score: number
    credit: number
    tier: number
    points: number
    multiplier: number
    streak: number
    previouslyCorrect: boolean
    artifacts: ArtifactType[]
}
export function initialGameState(): GameState {
    return {
        score: 0,
        credit: 0,
        tier: 0,
        points: 0,
        multiplier: 1,
        streak: 0,
        previouslyCorrect: false,
        artifacts: []
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
    if (gameState.artifacts.includes(ArtifactType.WIND_BRACELET)) {
        return {...gameState, multiplier: gameState.multiplier+(Math.max(0, 60-timeTaken)/400)};
    }
    return {...gameState, multiplier: gameState.multiplier+(Math.max(0, 60-timeTaken)/500)};
}

export function calculateMultPoints(gameState: GameState) {
    const result: GameState = {...gameState, points:gameState.points*gameState.multiplier, multiplier: 1};
    return result;
}

export function calculateMultiplierStreak(gameState: GameState, grade: Grade, previouslyCorrect: boolean, cursedStacks: number) {
    if (cursedStacks > 0) {
        return {...gameState, multiplier: 1, streak: 0};
    }
    if (gameState.artifacts.includes(ArtifactType.WIND_BRACELET)) {
        return {...gameState, multiplier:(grade !== "wrong" && previouslyCorrect) ? gameState.multiplier+0.12*gameState.streak : gameState.multiplier, streak:(grade !== "wrong") ? gameState.streak+1 : 0};
    }
    return {...gameState, multiplier:(grade !== "wrong" && previouslyCorrect) ? gameState.multiplier+0.1*gameState.streak : gameState.multiplier, streak:(grade !== "wrong") ? gameState.streak+1 : 0};
}
export function savePointstoScore(gameState: GameState) {
    const result: GameState = {...gameState, score:gameState.points+gameState.score, points:0, multiplier: 1};
    return result;
}

export function calculateReturnPoints(gameState: GameState) {
    return {...gameState, points: gameState.points + 250}
}

export function calculateWetMultiplier(gameState: GameState, wetStacks: number, overchargedStacks: number) {
    let newAddMultiplier = 0.05 * wetStacks;
    
    if (overchargedStacks && overchargedStacks > 0 && gameState.artifacts.includes(ArtifactType.SUPERCHARGER)) {
        newAddMultiplier *= 2.2
    } else if (overchargedStacks && overchargedStacks > 0) {
        newAddMultiplier *= 2;
    }
    if (gameState.artifacts.includes(ArtifactType.WATER_AMULET)) {
        newAddMultiplier *= 2;
    }
    return {...gameState, multiplier: gameState.multiplier + newAddMultiplier}
}

export function calculateBurnPoints(gameState: GameState, burnStacks: number, overchargedStacks: number) {
    let newAddPoints = 50 * burnStacks;
    if (overchargedStacks && overchargedStacks > 0 && gameState.artifacts.includes(ArtifactType.SUPERCHARGER)) {
        newAddPoints *= 2.2
    } else if (overchargedStacks && overchargedStacks > 0) {
        newAddPoints *= 2;
    }
    if (gameState.artifacts.includes(ArtifactType.FIRE_RING)) {
        newAddPoints *= 2;
    }
    return {...gameState, points: gameState.points + newAddPoints}
}

export function calculatePoisonPoints(gameState: GameState, poisonStacks: number, overchargedStacks: number) {
    let newSubtractPoints = 50 * poisonStacks;
    if (overchargedStacks && overchargedStacks > 0 && gameState.artifacts.includes(ArtifactType.SUPERCHARGER)) {
        newSubtractPoints *= 2.2
    } else if (overchargedStacks && overchargedStacks > 0) {
        newSubtractPoints *= 2;
    }
    if (gameState.artifacts.includes(ArtifactType.TOXIC_CHARM)) {
        return {...gameState, points: gameState.points + 0.5*newSubtractPoints}
    }
    return {...gameState, points: gameState.points - newSubtractPoints}
}

export function calculateVaporiseMultiplier(gameState: GameState, vaporiseStacks: number) {
    if (gameState.artifacts.includes(ArtifactType.STEAM_CORE)) {
        return {...gameState, points: gameState.points + 100 * vaporiseStacks, multiplier: gameState.multiplier * (1 + 0.1 * vaporiseStacks)}
    }
    return {...gameState, multiplier: gameState.multiplier * (1 + 0.1 * vaporiseStacks)}
}

export function calculateTempoUpMultiplier(gameState: GameState, tempoUpStacks: number, overchargedStacks: number) {
    if (overchargedStacks && overchargedStacks > 0 && gameState.artifacts.includes(ArtifactType.SUPERCHARGER)) {
        return {...gameState, multiplier: gameState.multiplier * 1.5 * tempoUpStacks * 2.2}
    }
    if (overchargedStacks && overchargedStacks > 0) {
        return {...gameState, multiplier: gameState.multiplier * 1.5 * tempoUpStacks * 2}
    }
    return {...gameState, multiplier: gameState.multiplier * 1.5 * tempoUpStacks}

}

export function setPreviouslyCorrect(gameState: GameState, wasCorrect: boolean) {
    return {...gameState, previouslyCorrect: wasCorrect}
}

export function calculateLuckyPoints(gameState: GameState) {
    return {...gameState, points: gameState.points * 1.5}
}