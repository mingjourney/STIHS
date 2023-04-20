import { _decorator, Component, Node, SkeletalAnimation, Vec3 } from "cc";
const { ccclass, property } = _decorator;

@ccclass("Character")
export class Character extends Component {
    private _dir: Vec3 = new Vec3(0, 0, 0);
    public locked: boolean = true;
    public color: "red" | "blue" = "red";
    private _facedTarget: Character | null = null;

    public set dir(dir: Vec3) {
        this._dir = dir;
        const angle = Math.atan2(dir.x, -dir.z);
        const degree = (angle * 180) / Math.PI;
        this.node.setRotationFromEuler(new Vec3(90, 0, 270 - degree));
    }

    public get dir(): Vec3 {
        return this._dir;
    }

    public set facedTarget(facedTarget: Character | null) {
        this._facedTarget = facedTarget;
    }

    public get facedTarget(): Character | null {
        return this._facedTarget;
    }

    start() {
        // [3]
    }

    playHitHockeyAnim(time?: number) {
        const skeletalAnimation = this.getComponent(
            SkeletalAnimation
        ) as SkeletalAnimation;
        const animState = skeletalAnimation.getState("击球");
        skeletalAnimation.play("击球");
        animState.repeatCount = 1;
        if (time) {
            animState.setTime(time);
        }
    }

    playCheerAnim() {
        const skeletalAnimation = this.getComponent(
            SkeletalAnimation
        ) as SkeletalAnimation;
        skeletalAnimation.play("跳");
    }

    playRageAnim() {
        const skeletalAnimation = this.getComponent(
            SkeletalAnimation
        ) as SkeletalAnimation;
        skeletalAnimation.play("生气");
    }

    resetAnim() {
        const skeletalAnimation = this.getComponent(
            SkeletalAnimation
        ) as SkeletalAnimation;
        const clips = skeletalAnimation.clips;
        if (!clips) {
            return;
        }
        if (clips.some(clip => clip && skeletalAnimation.getState(clip.name).isPlaying)) {
            const animState1 = skeletalAnimation.getState("起步");
            skeletalAnimation.play("起步");
            animState1.setTime(0);
            animState1.stop();
        }
    }

    update(deltaTime: number) {
        if (!this.locked && this.facedTarget) {
            const vec = this.facedTarget.node.getPosition();
            vec.subtract(this.node.getPosition());
            const len = vec.length();
            vec.multiplyScalar(1 / len);
            this.dir = new Vec3(vec.y, vec.z, vec.x);
        }
    }
}
