import async from 'async';
import _ from 'lodash';

import {MOVE_OPCODE} from './data/move';

export function initScriptState() {
    return {
        life: { 
            offset: 0,
            continue: true
        },
        move: {
            offset: 0,
            continue: true,
            elapsedTime: 0,
            waitTime: 0,
            isWaiting: false
        }
    };
}

export function processLifeScript(actor) {
    const state = actor.scriptState;
    const script = actor.lifeScript;
    do {
        const opcode = script.getUint8(state.life.offset++, true);
        // RUN OPCODE
    } while(state.life.continue);
}

export function processMoveScript(actor) {
    const state = actor.scriptState;
    const script = actor.moveScript;
    do {
        const opcode = script.getUint8(state.move.offset++, true);
        // RUN OPCODE
        MOVE_OPCODE[opcode].callback();
    } while(state.move.continue);
}
