import { _decorator, Component, Node, SkeletalAnimation, randomRangeInt, tween, Vec3, RigidBody } from "cc";
import { Character } from "./Character";
import { Chapter, Stihs } from "./Stihs";
const { ccclass, property } = _decorator;

@ccclass("NPC")
export class NPC extends Character {
    public isAutoMoving: boolean = false;

    @property({ type: Stihs })
    stihs: Stihs | null = null;

    start() {
        // [3]
    }

    update(deltaTime: number) {
        super.update(deltaTime);
        if (!this.stihs) {
            return;
        }
        if (this.locked) {
            this.resetAnim();
            return;
        }
        if (this.stihs.chapter === Chapter.Block || this.stihs.isBlocking) {
            const skeletalAnimation = this.getComponent(
                SkeletalAnimation
            ) as SkeletalAnimation;
            const animState1 = skeletalAnimation.getState("起步");
            const animState2 = skeletalAnimation.getState("溜冰");
            const animState3 = skeletalAnimation.getState("急停");
            if (this.locked) {
                if (animState2.isPlaying) {
                    animState2.setTime(0);
                    animState2.stop();
                }
            } else {
                if (!animState2.isPlaying) {
                    skeletalAnimation.play("溜冰");
                    animState2.speed = 2;
                }
            }
        } else if (this.stihs.chapter === Chapter.Shoot) {
            if (!this.locked) {
                if (!this.isAutoMoving) {
                    const pos = this.node.getPosition();
                    const rand = 1 - 2 * randomRangeInt(0, 2);
                    pos.x += rand * 0.5;
                    if (-2.5 <= pos.x && pos.x <=2.5) {
                        this.isAutoMoving = true;
                        tween(this.node)
                            .to(0.5, { position: pos }, { easing: "linear" })
                            .call(() => {
                                this.isAutoMoving = false;
                            })
                            .start();
                    }
                }
            }
        } else if (this.stihs.chapter === Chapter.Total) {
            if (this === this.stihs.redCharacters[5] || this === this.stihs.blueCharacters[5]) {
                if (!this.locked) {
                    if (!this.isAutoMoving) {
                        const pos = this.node.getPosition();
                        const rand = 1 - 2 * randomRangeInt(0, 2);
                        pos.x += rand * 0.5;
                        if (-2.5 <= pos.x && pos.x <=2.5) {
                            this.isAutoMoving = true;
                            tween(this.node)
                                .to(0.5, { position: pos }, { easing: "linear" })
                                .call(() => {
                                    this.isAutoMoving = false;
                                })
                                .start();
                        }
                    }
                }
            } else {
                if (!this.locked) {
                    if (this.stihs.player?.gamePad) {
                        if (this.stihs.player.gamePad.dir.length() > 0.5) {
                            const skeletalAnimation = this.getComponent(
                                SkeletalAnimation
                            ) as SkeletalAnimation;
                            const animState1 = skeletalAnimation.getState("起步");
                            const animState2 = skeletalAnimation.getState("溜冰");
                            const animState3 = skeletalAnimation.getState("急停");
                            if (!animState1.isPlaying && !animState2.isPlaying) {
                                skeletalAnimation.play("起步");
                            }
                            const rigidBody = this.getComponent(RigidBody) as RigidBody;
                            let { x, y } = this.stihs.player.gamePad.dir;
                            let angle = Math.atan2(y, x);
                            const delta = Math.random() * Math.PI - Math.PI / 2;
                            angle += delta;
                            [x, y] = [Math.cos(angle), Math.sin(angle)];
                            rigidBody.applyForce(
                                new Vec3(
                                    x * 5000 * deltaTime,
                                    0,
                                    y * -5000 * deltaTime
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
                                    animState2.speed = 1;
                                }
                            }
                            if (!this.facedTarget) {
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
            }
        }
    }
}
