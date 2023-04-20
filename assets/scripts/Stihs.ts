import {
    _decorator,
    Component,
    Node,
    Vec3,
    RigidBody,
    CylinderCollider,
    Camera,
    tween,
    randomRangeInt,
    Animation,
    Label,
    Button,
    BoxCollider,
    ITriggerEvent,
    AudioSource,
    director,
    SystemEventType,
    systemEvent,
    EventKeyboard,
    macro,
} from "cc";
import { Character } from "./Character";
import { NPC } from "./NPC";
import { Player } from "./Player";
const { ccclass, property } = _decorator;

export enum Chapter {
    Block,
    Shoot,
    Total,
}

@ccclass("Stihs")
export class Stihs extends Component {
    private static blockMinDistance: number = 1;
    public chapter: Chapter = Chapter.Block;
    private hockeyOwner: Character | null = null;
    private _camera: Camera | null = null;
    private _score: [number, number] = [0, 0];
    public isPassingHockey: boolean = false;
    public isShooting: boolean = false;
    public isBlocking: boolean = false;
    public receivers: Character[] = [];
    public blockTimer: number = 0;
    public blockTimerCharacter: Character | null = null;
    public timers: number[] = [];
    public home: boolean = false;

    @property({ type: Player })
    player: Player | null = null;
    @property({ type: [Character] })
    redCharacters: Character[] = [];
    @property({ type: [Character] })
    blueCharacters: Character[] = [];
    @property({ type: Node })
    iceHockey: Node | null = null;
    @property({ type: [Camera] })
    cameras: Camera[] = [];
    @property({ type: Animation })
    countdown: Animation | null = null;
    @property({ type: Node })
    victory: Node | null = null;
    @property({ type: Node })
    defeat: Node | null = null;
    @property({ type: Label })
    labelScore: Label | null = null;
    @property({ type: Button })
    btnBlock: Button | null = null;
    @property({ type: Button })
    btnShoot: Button | null = null;
    @property({ type: Button })
    btnPass: Button | null = null;
    @property({ type: Button })
    mask: Button | null = null;
    @property({ type: BoxCollider })
    redScoreWall: BoxCollider | null = null;
    @property({ type: AudioSource })
    audioHit: AudioSource | null = null;
    @property({ type: AudioSource })
    audioSkate: AudioSource | null = null;
    @property({ type: AudioSource })
    audioVictory: AudioSource | null = null;
    @property({ type: AudioSource })
    audioWhistle: AudioSource | null = null;
    @property({ type: AudioSource })
    audioBGM: AudioSource | null = null;
    @property({ type: Node })
    ring: Node | null = null;
    @property({ type: Node })
    blockRule: Node | null = null;
    @property({ type: Node })
    shootRule: Node | null = null;
    @property({ type: Button })
    btnRule: Button | null = null;

    public set camera(camera: Camera | null) {
        this._camera = camera;
        this.cameras.forEach((e) => {
            e.node.active = e === camera;
        });
    }

    public get camera(): Camera | null {
        return this._camera;
    }

    public get activeRedCharacters(): Character[] {
        return this.redCharacters.filter((character) => character.node.active);
    }

    public get activeBlueCharacters(): Character[] {
        return this.blueCharacters.filter((character) => character.node.active);
    }

    public get characters(): Character[] {
        return [...this.redCharacters, ...this.blueCharacters];
    }

    public get activeCharacters(): Character[] {
        return [...this.activeRedCharacters, ...this.activeBlueCharacters];
    }

    public set score(score: [number, number]) {
        this._score = score;
        if (this.labelScore) {
            this.labelScore.string = `${score[0]} : ${score[1]}`;
        }
    }

    public get score(): [number, number] {
        return this._score;
    }

    public get hockeyCamera(): boolean {
        return !this.hockeyOwner;
    }

    public setPlayer(p: Node) {
        this.redCharacters.forEach((character, i) => {
            const player = character.node.getComponent(Player);
            const npc = character.node.getComponent(NPC);
            if (player && npc) {
                if (character.node === p) {
                    player.enabled = true;
                    npc.enabled = false;
                    this.player = this.redCharacters[i] = player;
                } else {
                    player.enabled = false;
                    npc.enabled = true;
                    if (this.hockeyOwner === this.redCharacters[i]) {
                        this.hockeyOwner = npc;
                    }
                    this.redCharacters[i] = npc;
                }
            }
        });
    }

    start() {
        systemEvent.on(SystemEventType.KEY_UP, this.onKeyUp, this);
        // this.init(Chapter.Total);
    }
    
    onKeyUp(event: EventKeyboard) {
        switch(event.keyCode) {
            case macro.KEY.q:
                this.switchView();
                break;
            case macro.KEY.space:
                this.switchPlayer();
                break;
        }
    }

    init(chapter: Chapter, newGame: boolean = true) {
        if (!this.player || !this.iceHockey) {
            return;
        }
        this.chapter = chapter;
        if (newGame) {
            this.score = [0, 0];
            this.redCharacters.forEach((character) => {
                character.color = "red";
            });
            this.blueCharacters.forEach((character) => {
                character.color = "blue";
            });
            if (this.chapter !== Chapter.Block) {
                if (this.blockRule) {
                    this.blockRule.active = false;
                }
            }
            if (this.chapter !== Chapter.Shoot) {
                if (this.shootRule) {
                    this.shootRule.active = false;
                }
            }
            if (this.btnRule) {
                this.btnRule.node.active = this.chapter !== Chapter.Total;
            }
        }
        if (this.chapter === Chapter.Block) {
            if (this.btnBlock) {
                this.btnBlock.node.active = true;
            }
            if (this.btnShoot) {
                this.btnShoot.node.active = false;
            }
            if (this.btnPass) {
                this.btnPass.node.active = false;
            }
            this.hockeyOwner = null;
            this.setPlayer(this.redCharacters[0].node);
            this.player.positionLocked = true;
            this.player.animationSpeed = 2;
            this.redCharacters.forEach((character, i) => {
                character.node.active = i !== 5;
            });
            this.blueCharacters.forEach((character, i) => {
                character.node.active = i !== 5;
            });
            const redCharacterProps = [
                {
                    position: new Vec3(0, -2, 0),
                    rotation: new Vec3(90, 0, 180),
                },
                {
                    position: new Vec3(-4.767, -1.429, 0),
                    rotation: new Vec3(90, 0, 110),
                },
                {
                    position: new Vec3(4.767, -1.429, 0),
                    rotation: new Vec3(90, 0, -110),
                },
                {
                    // position: new Vec3(-1.867, -6.074, 0),
                    position: new Vec3(-1.867, -8, 0),
                    rotation: new Vec3(90, 0, 170),
                },
                {
                    // position: new Vec3(1.867, -6.074, 0),
                    position: new Vec3(1.867, -8, 0),
                    rotation: new Vec3(90, 0, 190),
                },
            ];
            this.activeRedCharacters.forEach((character, i) => {
                if (!redCharacterProps[i]) {
                    return;
                }
                character.locked = true;
                character.node.setPosition(redCharacterProps[i].position);
                const degree = 270 - redCharacterProps[i].rotation.z;
                const angle = (degree / 180) * Math.PI;
                character.dir = new Vec3(Math.sin(angle), 0, -Math.cos(angle));
                character.node.setScale(1, 1, 1);
                character.facedTarget = null;
                character.getComponent(RigidBody)?.setLinearVelocity(Vec3.ZERO);
            });
            const blueCharacterProps = [
                {
                    position: new Vec3(0, 2, 0),
                    rotation: new Vec3(90, 0, 0),
                },
                {
                    position: new Vec3(-4.767, 1.429, 0),
                    rotation: new Vec3(90, 0, 70),
                },
                {
                    position: new Vec3(4.767, 1.429, 0),
                    rotation: new Vec3(90, 0, -70),
                },
                {
                    // position: new Vec3(1.867, 6.074, 0),
                    position: new Vec3(1.867, 8, 0),
                    rotation: new Vec3(90, 0, -20),
                },
                {
                    // position: new Vec3(-1.867, 6.074, 0),
                    position: new Vec3(-1.867, 8, 0),
                    rotation: new Vec3(90, 0, 10),
                },
            ];
            this.activeBlueCharacters.forEach((character, i) => {
                if (!blueCharacterProps[i]) {
                    return;
                }
                character.node.active = true;
                character.locked = true;
                character.node.setPosition(blueCharacterProps[i].position);
                const degree = 270 - blueCharacterProps[i].rotation.z;
                const angle = (degree / 180) * Math.PI;
                character.dir = new Vec3(Math.sin(angle), 0, -Math.cos(angle));
                character.node.setScale(1, 1, 1);
                character.facedTarget = null;
                character.getComponent(RigidBody)?.setLinearVelocity(Vec3.ZERO);
            });
            this.iceHockey.setPosition(new Vec3(0.3, 0, -2.224));
            this.iceHockey
                .getComponent(RigidBody)
                ?.setLinearVelocity(Vec3.ZERO);
            this.iceHockey.setRotationFromEuler(0, 90, 90);
            const camera = (this.camera = this.cameras[2]);
            camera.node.setPosition(new Vec3(-19.11, 29.399, 103.8));
            tween(camera.node)
                .to(
                    2.5,
                    // { position: new Vec3(-19.11, 1.761, 59.571) },
                    // { position: new Vec3(-19.039, 3.667, 62.621) },
                    { position: new Vec3(-18.896, 5.747, 62.78) },
                    { easing: "sineInOut" }
                )
                .call(() => {
                    if (this.countdown) {
                        this.countdown.play("countdown");
                        const animState = this.countdown.getState("countdown");
                        animState.repeatCount = 1;
                    }
                })
                .delay(3)
                .call(() => {
                    if (this.player) {
                        this.player.locked = false;
                    }
                    this.blueCharacters[0].locked = false;
                    setTimeout(() => {
                        if (this.home) {
                            return;
                        }
                        const rand = randomRangeInt(1, 3);
                        if (rand === 1) {
                            if (!this.player) {
                                return;
                            }
                            this.player.animationSpeed = 1;
                            this.player.node.setRotationFromEuler(90, 0, 180);
                            const angle = (-73 / 180) * Math.PI;
                            const dir = new Vec3(
                                Math.sin(angle),
                                0,
                                -Math.cos(angle)
                            );
                            tween(this.player)
                                .to(0.3, { dir: dir }, { easing: "linear" })
                                .call(() => {
                                    if (!this.player) {
                                        return;
                                    }
                                    this.hockeyOwner = this.player;
                                    if (this.iceHockey) {
                                        this.iceHockey.setRotationFromEuler(
                                            0,
                                            90,
                                            90
                                        );
                                    }
                                    this.player.playHitHockeyAnim();
                                    this.blueCharacters[0].locked = true;
                                })
                                .delay(1)
                                .call(() => {
                                    this.passHockey();
                                })
                                .start();
                        } else {
                            this.blueCharacters[0].node.setRotationFromEuler(
                                90,
                                0,
                                0
                            );
                            const angle = (107 / 180) * Math.PI;
                            const dir = new Vec3(
                                Math.sin(angle),
                                0,
                                -Math.cos(angle)
                            );
                            tween(this.blueCharacters[0])
                                .to(0.3, { dir: dir }, { easing: "linear" })
                                .call(() => {
                                    this.hockeyOwner = this.blueCharacters[0];
                                    if (this.iceHockey) {
                                        this.iceHockey.setRotationFromEuler(
                                            0,
                                            90,
                                            90
                                        );
                                    }
                                    this.blueCharacters[0].playHitHockeyAnim();
                                    if (this.player) {
                                        this.player.locked = true;
                                    }
                                })
                                .delay(1)
                                .call(() => {
                                    this.audioHit?.play();
                                    this.passHockey();
                                })
                                .start();
                        }
                    }, 1500);
                })
                .start();
        } else if (this.chapter === Chapter.Shoot) {
            this.characters.forEach((character) => {
                character.node.active = false;
            });
            if (this.btnBlock) {
                this.btnBlock.node.active = false;
            }
            if (this.btnShoot) {
                this.btnShoot.node.active = true;
            }
            if (this.btnPass) {
                this.btnPass.node.active = false;
            }
            this.hockeyOwner = this.player;
            this.setPlayer(this.redCharacters[0].node);
            this.iceHockey
                .getComponent(RigidBody)
                ?.setLinearVelocity(Vec3.ZERO);
            this.iceHockey.setRotationFromEuler(0, 90, 90);
            this.player.node.active = true;
            this.player.dir = new Vec3(1, 0, 0);
            this.player.animationSpeed = 1;
            this.player.positionLocked = false;
            this.player.locked = true;
            this.player.node.setPosition(0, -10, 0);
            this.player.node.setScale(1, 1, 1);
            this.player.facedTarget = null;
            this.player.getComponent(RigidBody)?.setLinearVelocity(Vec3.ZERO);
            this.blueCharacters[0].node.active = true;
            this.blueCharacters[0].dir = new Vec3(-1, 0, 0);
            this.blueCharacters[0].locked = true;
            this.blueCharacters[0].node.setPosition(0, 25, 0);
            this.blueCharacters[0].facedTarget = this.player;
            this.blueCharacters[0].node.setScale(1.5, 1, 1);
            this.blueCharacters[0]
                .getComponent(RigidBody)
                ?.setLinearVelocity(Vec3.ZERO);
            this.camera = this.cameras[3];
            if (this.countdown) {
                this.countdown.play("countdown");
                const animState = this.countdown.getState("countdown");
                animState.repeatCount = 1;
            }
            setTimeout(() => {
                if (this.home) {
                    return;
                }
                if (this.player) {
                    this.player.locked = false;
                }
                this.blueCharacters[0].locked = false;
                if (this.btnShoot) {
                    this.btnShoot.node.active = true;
                }
            }, 3000);
        } else if (this.chapter === Chapter.Total) {
            if (this.btnBlock) {
                this.btnBlock.node.active = true;
            }
            if (this.btnShoot) {
                this.btnShoot.node.active = false;
            }
            if (this.btnPass) {
                this.btnPass.node.active = false;
            }
            this.hockeyOwner = null;
            this.setPlayer(this.redCharacters[0].node);
            this.player.positionLocked = true;
            this.player.animationSpeed = 2;
            const redCharacterProps = [
                {
                    position: new Vec3(0, -2, 0),
                    rotation: new Vec3(90, 0, 180),
                },
                {
                    position: new Vec3(-4.767, -1.429, 0),
                    rotation: new Vec3(90, 0, 110),
                },
                {
                    position: new Vec3(4.767, -1.429, 0),
                    rotation: new Vec3(90, 0, -110),
                },
                {
                    // position: new Vec3(-1.867, -6.074, 0),
                    position: new Vec3(-1.867, -8, 0),
                    rotation: new Vec3(90, 0, 170),
                },
                {
                    // position: new Vec3(1.867, -6.074, 0),
                    position: new Vec3(1.867, -8, 0),
                    rotation: new Vec3(90, 0, 190),
                },
                {
                    position: new Vec3(0, -25, 0),
                    rotation: new Vec3(90, 0, 180),
                },
            ];
            this.redCharacters.forEach((character, i) => {
                if (!redCharacterProps[i]) {
                    return;
                }
                character.node.active = true;
                character.locked = true;
                character.node.setPosition(redCharacterProps[i].position);
                const degree = 270 - redCharacterProps[i].rotation.z;
                const angle = (degree / 180) * Math.PI;
                character.dir = new Vec3(Math.sin(angle), 0, -Math.cos(angle));
                character.node.setScale(1, 1, 1);
                character.facedTarget = null;
                character.getComponent(RigidBody)?.setLinearVelocity(Vec3.ZERO);
                // if (character !== this.player) {
                //     character.facedTarget = this.player;
                // }
            });
            const blueCharacterProps = [
                {
                    position: new Vec3(0, 2, 0),
                    rotation: new Vec3(90, 0, 0),
                },
                {
                    position: new Vec3(-4.767, 1.429, 0),
                    rotation: new Vec3(90, 0, 70),
                },
                {
                    position: new Vec3(4.767, 1.429, 0),
                    rotation: new Vec3(90, 0, -70),
                },
                {
                    // position: new Vec3(1.867, 6.074, 0),
                    position: new Vec3(1.867, 8, 0),
                    rotation: new Vec3(90, 0, -20),
                },
                {
                    // position: new Vec3(-1.867, 6.074, 0),
                    position: new Vec3(-1.867, 8, 0),
                    rotation: new Vec3(90, 0, 10),
                },
                {
                    position: new Vec3(0, 25, 0),
                    rotation: new Vec3(90, 0, 0),
                },
            ];
            this.blueCharacters.forEach((character, i) => {
                if (!blueCharacterProps[i]) {
                    return;
                }
                character.node.active = true;
                character.locked = true;
                character.node.setPosition(blueCharacterProps[i].position);
                const degree = 270 - blueCharacterProps[i].rotation.z;
                const angle = (degree / 180) * Math.PI;
                character.dir = new Vec3(Math.sin(angle), 0, -Math.cos(angle));
                character.node.setScale(1, 1, 1);
                // character.facedTarget = null;
                character.facedTarget = this.player;
                character.getComponent(RigidBody)?.setLinearVelocity(Vec3.ZERO);
            });
            this.iceHockey.setPosition(new Vec3(0.3, 0, -2.224));
            this.iceHockey
                .getComponent(RigidBody)
                ?.setLinearVelocity(Vec3.ZERO);
            this.iceHockey.setRotationFromEuler(0, 90, 90);
            const camera = (this.camera = this.cameras[2]);
            camera.node.setPosition(new Vec3(-19.11, 29.399, 103.8));
            tween(camera.node)
                .to(
                    2.5,
                    { position: new Vec3(-18.896, 5.747, 62.78) },
                    { easing: "sineInOut" }
                )
                .call(() => {
                    if (this.countdown) {
                        this.countdown.play("countdown");
                        const animState = this.countdown.getState("countdown");
                        animState.repeatCount = 1;
                    }
                })
                .delay(3)
                .call(() => {
                    this.isBlocking = true;
                    if (this.player) {
                        this.player.locked = false;
                    }
                    this.blueCharacters[0].locked = false;
                    setTimeout(() => {
                        if (this.home) {
                            return;
                        }
                        // const rand = randomRangeInt(1, 3);
                        const rand = 1;
                        if (rand === 1) {
                            if (!this.player) {
                                return;
                            }
                            this.player.animationSpeed = 1;
                            this.player.node.setRotationFromEuler(90, 0, 180);
                            const angle = (-73 / 180) * Math.PI;
                            const dir = new Vec3(
                                Math.sin(angle),
                                0,
                                -Math.cos(angle)
                            );
                            tween(this.player)
                                .to(0.3, { dir: dir }, { easing: "linear" })
                                .call(() => {
                                    if (!this.player) {
                                        return;
                                    }
                                    this.hockeyOwner = this.player;
                                    if (this.iceHockey) {
                                        this.iceHockey.setRotationFromEuler(
                                            0,
                                            90,
                                            90
                                        );
                                    }
                                    this.player.playHitHockeyAnim();
                                    this.blueCharacters[0].locked = true;
                                })
                                .delay(1)
                                .call(() => {
                                    this.camera = this.cameras[1];
                                    this.passHockey();
                                })
                                .start();
                        } else {
                            this.blueCharacters[0].node.setRotationFromEuler(
                                90,
                                0,
                                0
                            );
                            const angle = (107 / 180) * Math.PI;
                            const dir = new Vec3(
                                Math.sin(angle),
                                0,
                                -Math.cos(angle)
                            );
                            tween(this.blueCharacters[0])
                                .to(0.3, { dir: dir }, { easing: "linear" })
                                .call(() => {
                                    this.hockeyOwner = this.blueCharacters[0];
                                    if (this.iceHockey) {
                                        this.iceHockey.setRotationFromEuler(
                                            0,
                                            90,
                                            90
                                        );
                                    }
                                    this.blueCharacters[0].playHitHockeyAnim();
                                    if (this.player) {
                                        this.player.locked = true;
                                    }
                                })
                                .delay(1)
                                .call(() => {
                                    this.camera = this.cameras[1];
                                    this.passHockey();
                                })
                                .start();
                        }
                    }, 1500);
                })
                .start();
        }
    }

    block() {
        if (this.chapter === Chapter.Total) {
            if (this.hockeyOwner?.color === "blue") {
                const pos = this.iceHockey?.getPosition();
                if (!pos || !this.player) {
                    return;
                }
                pos.subtract(this.player.node.getPosition());
                const len = pos.length();
                if (len < 2) {
                    this.hockeyOwner = this.player;
                    if (this.btnShoot) {
                        this.btnShoot.node.active = true;
                    }
                    if (this.btnPass) {
                        this.btnPass.node.active = true;
                    }
                    this.characters.forEach((character) => {
                        character.locked = false;
                        if (character.color === "blue") {
                            character.facedTarget =
                                character === this.player ||
                                character === this.hockeyOwner
                                    ? null
                                    : this.hockeyOwner;
                        }
                    });
                }
            }
        }
    }

    end(win: boolean) {
        if (!this.victory || !this.defeat) {
            return;
        }
        const score = this.score;
        if (win) {
            this.victory.active = true;
            this.defeat.active = false;
            this.score = [score[0] + 1, score[1]];
        } else {
            this.victory.active = false;
            this.defeat.active = true;
            this.score = [score[0], score[1] + 1];
        }
        this.audioWhistle?.play();
        if (this.score[0] >= 2 || this.score[1] >= 2) {
            if (this.mask) {
                this.mask.node.active = true;
            }
            if (this.score[0] >= 2) {
                this.audioVictory?.play();
                [this.redCharacters[0]].forEach((chatacter) => {
                    chatacter.playCheerAnim();
                });
                [this.blueCharacters[0]].forEach((character) => {
                    character.playRageAnim();
                });
            } else {
                [this.redCharacters[0]].forEach((chatacter) => {
                    chatacter.playRageAnim();
                });
                [this.blueCharacters[0]].forEach((character) => {
                    character.playCheerAnim();
                });
            }
        } else {
            setTimeout(() => {
                if (this.home) {
                    return;
                }
                if (this.victory && this.defeat) {
                    this.victory.active = false;
                    this.defeat.active = false;
                }
                this.init(this.chapter, false);
            }, 3000);
        }
    }

    passHockey() {
        if (this.isShooting || this.isPassingHockey) {
            return;
        }
        if (!this.hockeyOwner || !this.iceHockey) {
            return;
        }
        this.audioHit?.play();
        this.iceHockey.setRotationFromEuler(0, 90, 90);
        const rigidBody = this.iceHockey.getComponent(RigidBody) as RigidBody;
        const collider = this.iceHockey.getComponent(
            CylinderCollider
        ) as CylinderCollider;
        if (!rigidBody.enabled) {
            rigidBody.enabled = true;
        }
        if (!collider.enabled) {
            collider.enabled = true;
        }
        const dir = new Vec3(this.hockeyOwner.dir);
        this.receivers = this.activeCharacters.filter(
            (character) => character !== this.hockeyOwner
        );
        this.hockeyOwner = null;
        this.isPassingHockey = true;
        rigidBody.applyImpulse(dir.multiplyScalar(1));
    }

    shoot() {
        if (this.isShooting || this.isPassingHockey) {
            return;
        }
        if (!this.hockeyOwner || !this.iceHockey) {
            return;
        }
        this.isShooting = true;
        this.hockeyOwner.playHitHockeyAnim(1);
        setTimeout(() => {
            if (this.home) {
                return;
            }
            if (!this.hockeyOwner || !this.iceHockey) {
                return;
            }
            this.audioHit?.play();
            this.iceHockey.setRotationFromEuler(0, 90, 90);
            const rigidBody = this.iceHockey.getComponent(
                RigidBody
            ) as RigidBody;
            const collider = this.iceHockey.getComponent(
                CylinderCollider
            ) as CylinderCollider;
            if (!rigidBody.enabled) {
                rigidBody.enabled = true;
            }
            if (!collider.enabled) {
                collider.enabled = true;
            }
            const dir = new Vec3(this.hockeyOwner.dir);
            this.hockeyOwner = null;
            rigidBody.applyImpulse(dir.multiplyScalar(3));
            let end = false;
            const listener = (event: ITriggerEvent) => {
                if (event.otherCollider === this.redScoreWall) {
                    if (end) {
                        return;
                    }
                    end = true;
                    this.isShooting = false;
                    setTimeout(() => {
                        if (this.home) {
                            return;
                        }
                        this.end(true);
                    }, 1000);
                }
            };
            collider.once("onTriggerEnter", listener);
            setTimeout(() => {
                if (this.home) {
                    return;
                }
                if (end) {
                    return;
                }
                end = true;
                this.isShooting = false;
                this.end(false);
            }, 1500);
        }, 300);
    }

    nextGame() {
        if (this.mask) {
            this.mask.node.active = false;
        }
        if (this.victory && this.defeat) {
            this.victory.active = false;
            this.defeat.active = false;
        }
        this.init(this.chapter);
    }

    update(deltaTime: number) {
        if (this.hockeyOwner && this.iceHockey) {
            const pos = this.hockeyOwner.node.getPosition();
            const rigidBody = this.iceHockey.getComponent(
                RigidBody
            ) as RigidBody;
            const collider = this.iceHockey.getComponent(
                CylinderCollider
            ) as CylinderCollider;
            const dir = new Vec3(
                this.hockeyOwner.dir.z,
                this.hockeyOwner.dir.x,
                this.hockeyOwner.dir.y
            );
            pos.add(dir.multiplyScalar(1.44));
            if (!pos.equals(this.iceHockey.getPosition())) {
                if (rigidBody.enabled) {
                    rigidBody.enabled = false;
                }
                if (collider.enabled) {
                    collider.enabled = false;
                }
                this.iceHockey.setPosition(pos);
            }
        } else if (this.isPassingHockey && this.iceHockey) {
            let min = Infinity;
            let char: Character | null = null;
            for (let character of this.receivers) {
                const dir = character.node.getPosition();
                dir.subtract(this.iceHockey.getPosition());
                const len = dir.length();
                if (len < min) {
                    min = len;
                    char = character;
                }
            }
            if (char && min <= 2) {
                this.receivers = [];
                this.iceHockey.setRotationFromEuler(0, 90, 90);
                this.isPassingHockey = false;
                if (this.chapter === Chapter.Block) {
                    this.hockeyOwner = char;
                    if (char.color === "red") {
                        this.end(true);
                    } else {
                        this.end(false);
                    }
                } else if (this.isBlocking) {
                    this.isBlocking = false;
                    if (char.color === "red") {
                        this.setPlayer(char.node);
                        if (this.player) {
                            this.player.dir = new Vec3(char.dir);
                            this.hockeyOwner = this.player;
                        }
                    } else {
                        this.hockeyOwner = char;
                    }
                    if (this.player) {
                        this.player.positionLocked = false;
                    }
                    this.characters.forEach((character) => {
                        character.locked = false;
                        if (character.color === "blue") {
                            character.facedTarget =
                                character === this.player ||
                                character === this.hockeyOwner
                                    ? null
                                    : this.hockeyOwner;
                        }
                    });
                    if (this.btnBlock) {
                        this.btnBlock.node.active = true;
                    }
                } else {
                    if (char.color === "red") {
                        this.setPlayer(char.node);
                        if (this.player) {
                            this.player.dir = new Vec3(char.dir);
                            this.hockeyOwner = this.player;
                        }
                    } else {
                        this.hockeyOwner = char;
                    }
                    if (this.player) {
                        this.player.positionLocked = false;
                    }
                    this.characters.forEach((character) => {
                        character.locked = false;
                        if (character.color === "blue") {
                            character.facedTarget =
                                character === this.player ||
                                character === this.hockeyOwner
                                    ? null
                                    : this.hockeyOwner;
                        }
                    });
                }
                if (this.btnShoot) {
                    this.btnShoot.node.active =
                        this.hockeyOwner?.color === "red";
                }
                if (this.btnPass) {
                    this.btnPass.node.active =
                        this.hockeyOwner?.color === "red";
                }
            }
        }
        if (this.player && this.iceHockey) {
            this.moveCamera();
        }
        if (this.player && !this.player.locked) {
            const rigidBody = this.player.getComponent(RigidBody);
            if (rigidBody) {
                let v: Vec3 = new Vec3();
                rigidBody.getLinearVelocity(v);
                const len = v.length();
                if (len > 3) {
                    if (this.audioSkate && !this.audioSkate.playing) {
                        this.audioSkate.play();
                    }
                } else {
                    if (this.audioSkate && this.audioSkate.playing) {
                        this.audioSkate.pause();
                    }
                }
            }
        }
        if (this.player && this.ring) {
            const pos = this.player.node.getPosition();
            pos.add(new Vec3(-0.25, -0.2, 0));
            if (!pos.equals(this.player.node.getPosition())) {
                this.ring.setPosition(pos);
            }
        }
        if (this.hockeyOwner && this.iceHockey) {
            if (this.blockTimerCharacter) {
                const dir = this.blockTimerCharacter.node.getPosition();
                dir.subtract(this.iceHockey.getPosition());
                const len = dir.length();
                if (len >= Stihs.blockMinDistance) {
                    this.blockTimerCharacter = null;
                    clearTimeout(this.blockTimer)
                    this.blockTimer = 0;
                }
            } else {
                let min = Infinity;
                let char: Character | null = null;
                for (let character of this.activeBlueCharacters) {
                    const dir = character.node.getPosition();
                    dir.subtract(this.iceHockey.getPosition());
                    const len = dir.length();
                    if (len < min) {
                        min = len;
                        char = character;
                    }
                }
                if (min < Stihs.blockMinDistance) {
                    this.blockTimerCharacter = char;
                    this.blockTimer = setTimeout(() => {
                        if (this.home) {
                            return;
                        }
                        this.blockTimerCharacter = null;
                        this.blockTimer = 0;
                        this.hockeyOwner = char;
                        if (this.btnShoot) {
                            this.btnShoot.node.active = false;
                        }
                        if (this.btnPass) {
                            this.btnPass.node.active = false;
                        }
                        this.characters.forEach((character) => {
                            character.locked = false;
                            if (character.color === "blue") {
                                character.facedTarget =
                                    character === this.player ||
                                    character === this.hockeyOwner
                                        ? null
                                        : this.hockeyOwner;
                            }
                        });
                    }, 2000);
                }
            }
        }
    }

    moveCamera() {
        const pos = this.hockeyCamera
            ? this.iceHockey?.getPosition()
            : this.player?.node.getPosition();
        if (pos) {
            this.cameras[1].node.setPosition(
                new Vec3(
                    -21.910458 + pos.y,
                    16.110577 + pos.z,
                    72.595773 + pos.x
                )
            );
            this.cameras[3].node.setPosition(
                new Vec3(-32.5 + pos.y, 3.375 + pos.z, 50.509 + pos.x)
            );
        }
    }

    switchView() {
        if (this.camera === this.cameras[1]) {
            this.camera = this.cameras[3];
        } else if (this.camera === this.cameras[3]) {
            this.camera = this.cameras[1];
        }
    }

    backHome() {
        this.home = true;
        director.loadScene("chapterScene");
    }

    showRule() {
        if (this.chapter === Chapter.Block) {
            if (this.blockRule) {
                this.blockRule.active = !this.blockRule.active;
            }
        } else if (this.chapter === Chapter.Shoot) {
            if (this.shootRule) {
                this.shootRule.active = !this.shootRule.active;
            }
        }
    }

    switchPlayer() {
        if (this.player) {
            const dir = this.player.dir;
            const players = this.activeRedCharacters;
            let index = players.indexOf(this.player);
            index++;
            if (index >= players.length) {
                index -= players.length;
            }
            const player = players[index];
            this.setPlayer(player.node);
            this.player.dir = dir;
            this.player.positionLocked = false;
            this.characters.forEach((character) => {
                character.locked = false;
            });
        }
    }
}
