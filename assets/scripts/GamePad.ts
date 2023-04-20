
import { _decorator, Component, Node, Vec3, EventTouch, UITransform, Vec2, systemEvent, SystemEventType, EventKeyboard, macro } from 'cc';
import { Chapter, Stihs } from './Stihs';
const { ccclass, property } = _decorator;

@ccclass('GamePad')
export class GamePad extends Component {
    private startPos: Vec3 = new Vec3(0, 0, 0);
    public dir: Vec2 = new Vec2(0, 0);
    private maxR: number = 65;
    private timer: number = 0;

    @property({ type: Node })
    gamePadCircle: Node | null = null;
    @property({ type: Stihs })
    stihs: Stihs | null = null;

    start () {
        if (this.gamePadCircle) {
            this.gamePadCircle.setPosition(this.startPos);
            this.gamePadCircle.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            this.gamePadCircle.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
            this.gamePadCircle.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        }
        systemEvent.on(SystemEventType.KEY_DOWN, this.onKeyDown, this);
        systemEvent.on(SystemEventType.KEY_UP, this.onKeyUp, this);
    }

    onTouchMove(event: EventTouch) {
        if (!this.stihs) {
            return;
        }
        const loc = event.getLocation();
        const startLoc = event.getStartLocation();
        const delta = loc.subtract(startLoc);
        if (delta.equals(Vec2.ZERO)) {
            return;
        }
        const pos = new Vec3(delta.x, delta.y, 0);
        const len = pos.length();
        this.dir.x = pos.x / len;
        this.dir.y = pos.y / len;
        if (len > this.maxR) {
            pos.x = this.dir.x * this.maxR;
            pos.y = this.dir.y * this.maxR;
        }
        if (this.stihs.camera === this.stihs.cameras[3]) {
            [this.dir.x, this.dir.y] = [this.dir.y, -this.dir.x];
        }
        this.gamePadCircle?.setPosition(pos);
    }

    onTouchEnd(event: EventTouch) {
        this.dir = new Vec2(0, 0);
        this.gamePadCircle?.setPosition(this.startPos);
    }

    onTouchCancel(event: EventTouch) {
        this.dir = new Vec2(0, 0);
        this.gamePadCircle?.setPosition(this.startPos);
    }

    onKeyDown(event: EventKeyboard) {
        if (!this.stihs) {
            return;
        }
        let pos: Vec3 | null = null;
        switch(event.keyCode) {
            case macro.KEY.w:
                pos = new Vec3(0, this.maxR, 0);
                break;
            case macro.KEY.s:
                pos = new Vec3(0, -this.maxR, 0);
                break;
            case macro.KEY.a:
                pos = new Vec3(-this.maxR, 0, 0);
                break;
            case macro.KEY.d:
                pos = new Vec3(this.maxR, 0, 0);
                break;
        }
        if (!pos) {
            return;
        }
        const len = pos.length();
        this.dir.x = pos.x / len;
        this.dir.y = pos.y / len;
        if (this.stihs.camera === this.stihs.cameras[3]) {
            [this.dir.x, this.dir.y] = [this.dir.y, -this.dir.x];
        }
        this.gamePadCircle?.setPosition(pos);
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = 0;
        }
    }

    onKeyUp(event: EventKeyboard) {
        if (this.timer) {
            return;
        }
        this.timer = setTimeout(() => {
            this.dir = new Vec2(0, 0);
            this.gamePadCircle?.setPosition(this.startPos);
        }, 500);
    }

    // update (deltaTime: number) {
    //     // [4]
    // }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.0/manual/en/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.0/manual/en/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.0/manual/en/scripting/life-cycle-callbacks.html
 */
