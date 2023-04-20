
import { _decorator, Component, Node, director, Scene } from 'cc';
import { Chapter, Stihs } from './Stihs';
const { ccclass, property } = _decorator;

@ccclass('Start')
export class Start extends Component {
    nextScene() {
        director.loadScene("chapterScene");
    }
}
