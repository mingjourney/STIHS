
import { _decorator, Component, Node, director, Scene, Animation } from 'cc';
import { Chapter, Stihs } from './Stihs';
const { ccclass, property } = _decorator;

@ccclass('ChapterSelector')
export class ChapterSelector extends Component {
    @property({ type: Node })
    loadingNode: Node | null = null;

    block() {
        this.nextScene(Chapter.Block);
    }

    shoot() {
        this.nextScene(Chapter.Shoot);
    }

    total() {
        this.nextScene(Chapter.Total);
    }

    nextScene(chapter: Chapter) {
        if (this.loadingNode) {
            this.loadingNode.active = true;
            const anim = this.loadingNode.getComponent(Animation) as Animation;
            anim.play('loading');
        }
        director.loadScene("stihsScene", (error: null | Error, scene?: Scene) => {
            if (error) {
                throw error;
            }
            if (scene) {
                if (this.loadingNode) {
                    this.loadingNode.active = false;
                }
                const stihs = scene.getComponentInChildren('Stihs') as Stihs;
                stihs.init(chapter);
            }
        });
    }
}
