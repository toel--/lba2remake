import * as THREE from 'three';

import { createState } from './state';
import { createAudioManager, createMusicManager } from '../audio';
import { loadTexts } from '../text';
import { getLanguageConfig } from '../lang';
import DebugData from '../ui/editor/DebugData';
import { makePure } from '../utils/debug';
import { registerResources, preloadResources } from '../resources';

export function createGame(
    clock: any,
    setUiState: Function,
    getUiState: Function,
    params: any,
    vr: boolean = false
) {
    let isPaused = false;
    let isLoading = false;

    let state = createState();

    const audio = createAudioManager(state);
    const audioMenu = createMusicManager(state);

    const game = {
        setUiState,
        getUiState,
        controlsState: {
            controlVector: new THREE.Vector2(),
            altControlVector: new THREE.Vector2(),
            cameraSpeed: new THREE.Vector3(),
            cameraLerp: new THREE.Vector3(),
            cameraLookAtLerp: new THREE.Vector3(),
            cameraOrientation: new THREE.Quaternion(),
            cameraHeadOrientation: new THREE.Quaternion(),
            freeCamera: false,
            relativeToCam: vr,
            firstPerson: vr && getSavedVRFirstPersonMode(),
            action: 0,
            jump: 0,
            fight: 0,
            crunch: 0,
            weapon: 0,
            vrPointerTransform: new THREE.Matrix4(),
            vrTriggerButton: false
        },

        resetState() {
            state = createState();
            this.resetControlsState();
        },

        resetControlsState() {
            this.controlsState.controlVector.set(0, 0),
            this.controlsState.action = 0;
            this.controlsState.jump = 0;
            this.controlsState.fight = 0;
            this.controlsState.crunch = 0;
            this.controlsState.weapon = 0;
        },

        loading(index: number) {
            isPaused = true;
            isLoading = true;
            clock.stop();
            this.setUiState({loading: true});
            // tslint:disable-next-line:no-console
            console.log(`Loading scene #${index}...`);
        },

        loaded(what: string, wasPaused: boolean = false) {
            isPaused = wasPaused;
            if (!isPaused) {
                clock.start();
            } else {
                DebugData.firstFrame = true;
            }
            isLoading = false;
            this.setUiState({loading: false});
            // tslint:disable-next-line:no-console
            console.log(`Loaded ${what}!`);
        },

        isPaused: () => isPaused,
        isLoading: () => isLoading,
        getState: () => state,
        getAudioManager: () => audio,
        getAudioMenuManager: () => audioMenu,

        togglePause() {
            if (isPaused) {
                this.resume();
            } else {
                this.pause();
            }
        },

        getTime: () => {
            return {
                delta: Math.min(clock.getDelta(), 0.025),
                elapsed: clock.getElapsedTime(),
            };
        },

        pause: () => {
            isPaused = true;
            clock.stop();
            const sfxSource = audio.getSoundFxSource();
            sfxSource.suspend();
            const voiceSource = audio.getVoiceSource();
            voiceSource.suspend();
            const musicSource = audio.getMusicSource();
            musicSource.suspend();
            // tslint:disable-next-line:no-console
            console.log('Pause');
        },

        resume: () => {
            if (isPaused) {
                const musicSource = audio.getMusicSource();
                musicSource.resume();
                const voiceSource = audio.getVoiceSource();
                voiceSource.resume();
                const sfxSource = audio.getSoundFxSource();
                sfxSource.resume();
                isPaused = false;
                clock.start();
                // tslint:disable-next-line:no-console
                console.log('Resume');
            }
        },

        registerResources: async () => {
            const { language, languageVoice } = getLanguageConfig();
            await registerResources(params.game, language.code, languageVoice.code);
        },

        async preload() {
            await preloadResources();

            const { language } = getLanguageConfig();
            const [menuTexts, gameTexts] = await Promise.all([
                loadTexts(language, 0),
                loadTexts(language, 4)
            ]);
            this.menuTexts = menuTexts;
            this.texts = gameTexts;
        }
    };

    makePure(game.isPaused);
    makePure(game.isLoading);
    makePure(game.getState);
    makePure(game.getAudioManager);
    makePure(game.getAudioMenuManager);

    return game;
}

function getSavedVRFirstPersonMode() {
    const firstPerson = localStorage.getItem('vrFirstPerson');
    if (firstPerson !== null && firstPerson !== undefined) {
        return JSON.parse(firstPerson);
    }
    return false;
}
