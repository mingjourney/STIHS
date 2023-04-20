import {
    _decorator,
    Component,
    Node,
    Vec3,
    RigidBody,
    SkeletalAnimation,
    Camera,
} from "cc";
import { Character } from "./Character";
import { GamePad } from "./GamePad";
const { ccclass, property } = _decorator;

@ccclass("Player")
export class Player extends Character {
    public positionLocked: boolean = false;
    public animationSpeed: number = 1;

    @property({ type: GamePad })
    gamePad: GamePad | null = null;
    @property({ type: Camera })
    camera: Camera | null = null;
    @property({ type: Camera })
    camera2: Camera | null = null;

    start() {}

    update(deltaTime: number) {
        super.update(deltaTime);
        if (this.locked) {
            this.resetAnim();
            return;
        }
        if (this.gamePad && this.gamePad.dir.length() > 0.5) {
            const skeletalAnimation = this.getComponent(
                SkeletalAnimation
            ) as SkeletalAnimation;
            const animState1 = skeletalAnimation.getState("起步");
            const animState2 = skeletalAnimation.getState("溜冰");
            const animState3 = skeletalAnimation.getState("急停");
            if (this.positionLocked) {
                if (!animState2.isPlaying) {
                    skeletalAnimation.play("溜冰");
                    animState2.speed = this.animationSpeed;
                }
            } else {
                if (!animState1.isPlaying && !animState2.isPlaying) {
                    skeletalAnimation.play("起步");
                }
            }
            if (this.positionLocked) {
                this.dir = new Vec3(this.gamePad.dir.x, 0, -this.gamePad.dir.y);
            } else {
                const rigidBody = this.getComponent(RigidBody) as RigidBody;
                rigidBody.applyForce(
                    new Vec3(
                        this.gamePad.dir.x * 5000 * deltaTime,
                        0,
                        this.gamePad.dir.y * -5000 * deltaTime
                    )
                );
                let v: Vec3 = new Vec3(0, 0, 0);
                rigidBody.getLinearVelocity(v);
                let vLen = v.length();
                if (vLen > 7) {
                    v.divide(
                        new Vec3(1, 1, 1).multiplyScalar(vLen)
                    ).multiplyScalar(7);
                    vLen = 7;
                    rigidBody.setLinearVelocity(v);
                    if (animState1.isPlaying) {
                        animState1.stop();
                        skeletalAnimation.crossFade("溜冰", 0.3);
                    }
                }
                this.dir = new Vec3(v.x / vLen, v.y / vLen, v.z / vLen);
            }
        } else {
            const skeletalAnimation = this.getComponent(
                SkeletalAnimation
            ) as SkeletalAnimation;
            const animState1 = skeletalAnimation.getState("起步");
            const animState2 = skeletalAnimation.getState("溜冰");
            const animState3 = skeletalAnimation.getState("急停");
            if (animState1.isPlaying) {
                animState1.setTime(0);
                animState1.stop();
            }
            if (animState2.isPlaying) {
                skeletalAnimation.play("急停");
                animState3.repeatCount = 1;
            }
        }
    }
}
