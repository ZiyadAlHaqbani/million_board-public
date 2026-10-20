import { AUTO, Game } from 'phaser';

import { FirstPage } from './scenes/FirstPage';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.WEBGL,
    width: 768,
    height: 768,
    fps: {target: 0, forceSetTimeOut: true},
    parent: 'game-container',
    backgroundColor: '#028af8',
    scene: [
        FirstPage
    ]
};

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
