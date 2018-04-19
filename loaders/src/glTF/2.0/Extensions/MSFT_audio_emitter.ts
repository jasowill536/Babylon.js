/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    // https://github.com/najadojo/glTF/tree/MSFT_audio_emitter/extensions/2.0/Vendor/MSFT_audio_emitter

    const NAME = "MSFT_audio_emitter";

    interface IClipReference {
        clip: number;
        weight?: number;
    }

    interface IEmittersReference {
        emitters: number[];
    }

    interface IEmitter {
        name?: string;
        direction?: number[];
        innerAngle?: number;
        outerAngle?: number;
        loop?: boolean;
        volume?: number;
        clips: IClipReference[];
    }

    const enum AudioMimeType {
        WAV = "audio/wav",
    }

    interface IClip {
        uri?: string;
        bufferView?: number;
        mimeType?: AudioMimeType;
    }

    interface ILoaderClip extends IClip, IArrayItem {
        _objectURL?: Promise<string>;
    }

    interface ILoaderEmitter extends IEmitter, IArrayItem {
        _babylonData?: { 
            sound?: WeightedSound;
            meshes: AbstractMesh[];
            loaded: Promise<void>;
        };
        _babylonSounds: Sound[];
    }

    interface IMSFTAudioEmitter {
        clips: ILoaderClip[];
        emitters: ILoaderEmitter[];
    }

    const enum AnimationEventAction {
        play = "play",
        stop = "stop",
    }

    interface IAnimationEvent {
        time: number;
        action: AnimationEventAction,
        offset?: number;
        target: IAnimationEventTarget;
    }

    interface IAnimationEventTarget {
        node?: number;
        scene?: number;
        emitter: number;
    }

    interface ILoaderAnimationEvent extends IAnimationEvent, IArrayItem {
    }

    interface ILoaderAnimationEvents {
        events: ILoaderAnimationEvent[];
    }

    export class WeightedSound {
        public loop: boolean = false;
        private _localDirection: Vector3 = new Vector3(1, 0, 0);
        private _coneInnerAngle: number = 360;
        private _coneOuterAngle: number = 360;
        private _volume: number = 1;
        public isPlaying: boolean = false;
        public isPaused: boolean = false;

        private _sounds: Sound[] = [];
        private _weights: number[] = [];
        private _currentIndex: number;

        constructor(loop: boolean, sounds: Sound[], weights: number[]) {
            if (sounds.length != weights.length) {
                throw new Error('Sounds length does not equal weights length');
            }
            
            this.loop = loop;
            this._weights = weights;
            this._sounds = sounds;
            for (let sound of this._sounds) {
                sound.onended = () => { this._onended() };
            }
        }

        public get directionalConeInnerAngle(): number {
            return this._coneInnerAngle;
        }

        public set directionalConeInnerAngle(value: number) {
            if (value != this._coneInnerAngle) {
                if (this._coneOuterAngle < value) {
                    Tools.Error("directionalConeInnerAngle: outer angle of the cone must be superior or equal to the inner angle.");
                    return;
                }

                this._coneInnerAngle = value;
                for (let sound of this._sounds) {
                    sound.directionalConeInnerAngle = value;
                }
            }
        }

        public get directionalConeOuterAngle(): number {
            return this._coneOuterAngle;
        }

        public set directionalConeOuterAngle(value: number) {
            if (value != this._coneOuterAngle) {
                if (value < this._coneInnerAngle) {
                    Tools.Error("directionalConeOuterAngle: outer angle of the cone must be superior or equal to the inner angle.");
                    return;
                }

                this._coneOuterAngle = value;
                for (let sound of this._sounds) {
                    sound.directionalConeOuterAngle = value;
                }
            }
        }

        public get volume(): number {
            return this._volume;
        }

        public set volume(value: number) {
            if (value != this._volume) {
                for (let sound of this._sounds) {
                    sound.volume = value;
                }
            }
        }

        public get direction(): Vector3 {
            return this._localDirection;
        }

        public set direction(value: Vector3) {
            for (let sound of this._sounds) {
                sound.direction = value;
            }
        }

        private _onended() {
            this._sounds[this._currentIndex].autoplay = false;
            if (this.loop && this.isPlaying) {
                this.play();
            } else {
                this.isPlaying = false;
            }
        }

        public stop(offset?: number) {
            this.isPlaying = false;
            if (this._currentIndex !== undefined) {
                if (offset == -1) {
                    this._sounds[this._currentIndex].pause();
                } else {
                    this._sounds[this._currentIndex].stop();
                }
            }
        }

        public play(offset?: number) {
            let randomValue = Math.random();
            let total = 0;
            for (let i = 0; i < this._weights.length; i++) {
                total += this._weights[i];
                if (randomValue <= total) {
                    this._currentIndex = i;
                    break;
                }
            }
            const sound = this._sounds[this._currentIndex];
            if (sound.isReady()) {
                if (offset == -1) {
                    offset = undefined;
                }
                sound.play(0, offset);
            } else {
                sound.autoplay = true;
            }
            this.isPlaying = true;
        }
    }

    export class MSFT_audio_emitter extends GLTFLoaderExtension {
        public readonly name = NAME;

        private _loadClipAsync(context: string, clip: ILoaderClip): Promise<string> {
            if (clip._objectURL) {
                return clip._objectURL;
            }

            let promise: Promise<ArrayBufferView>;
            if (clip.uri) {
                promise = this._loader._loadUriAsync(context, clip.uri);
            }
            else {
                const bufferView = GLTFLoader._GetProperty(`${context}/bufferView`, this._loader._gltf.bufferViews, clip.bufferView);
                promise = this._loader._loadBufferViewAsync(`#/bufferViews/${bufferView._index}`, bufferView);
            }

            clip._objectURL = promise.then(data => {
                return URL.createObjectURL(new Blob([data], { type: clip.mimeType }));
            });

            return clip._objectURL;
        }

        private _loadEmitterAsync(context: string, emitter: ILoaderEmitter, babylonMesh?: Mesh): Promise<void> {
            emitter._babylonSounds = emitter._babylonSounds || [];
            if (!emitter._babylonData) {
                const clipPromises = new Array<Promise<void>>();
                const name = emitter.name || `emitter${emitter._index}`;
                const options = {
                    loop: false,
                    autoplay: false,
                    volume: emitter.volume || 1,
                };
                let direction = emitter.direction;
                let innerAngle = emitter.innerAngle;
                let outerAngle = emitter.outerAngle;

                for (let i = 0; i < emitter.clips.length; i++) {
                    const clip = GLTFLoader._GetProperty(`#/extensions/${this.name}/clips`, this._clips, emitter.clips[i].clip);
                    clipPromises.push(this._loadClipAsync(`#/extensions/${NAME}/clips/${emitter.clips[i].clip}`, clip).then((objectURL: string) => {
                        const sound = emitter._babylonSounds[i] = new Sound(name, objectURL, this._loader._babylonScene, null, options);
                        if (babylonMesh) {
                            sound.attachToMesh(babylonMesh);
                            if (direction || innerAngle || outerAngle) {
                                sound.setLocalDirectionToMesh(Vector3.FromArray(direction || [1, 0, 0]));
                                sound.setDirectionalCone(innerAngle || 360, outerAngle || 360, 0);
                            }
                        }
                        return Promise.resolve();
                    }));
                }

                const promise = Promise.all(clipPromises).then(() => {
                    let weights = emitter.clips.map(clip => { return clip.weight || 1; });
                    let sound = new WeightedSound(emitter.loop || false, emitter._babylonSounds, weights);
                    if (direction) sound.direction = Vector3.FromArray(direction);
                    if (innerAngle) sound.directionalConeInnerAngle = innerAngle;
                    if (outerAngle) sound.directionalConeOuterAngle = outerAngle;
                    if (emitter.volume) sound.volume = emitter.volume;
                    emitter._babylonData!.sound = sound;
                });

                emitter._babylonData = {
                    meshes: [],
                    loaded: promise
                };
            }

            if (babylonMesh) {
                emitter._babylonData.meshes.push(babylonMesh);
            }
            return emitter._babylonData.loaded;
        }

        protected _loadSceneAsync(context: string, scene: ILoaderScene): Nullable<Promise<void>> { 
            return this._loadExtensionAsync<IEmittersReference>(context, scene, (extensionContext, extension) => {
                return this._loader._loadSceneAsync(extensionContext, scene).then(() => {

                    const promises = new Array<Promise<void>>();
                    for (const emitterIndex of extension.emitters) {
                        const emitter = GLTFLoader._GetProperty(extensionContext, this._emitters, emitterIndex);
                        if (emitter.direction || emitter.innerAngle || emitter.outerAngle) {
                            throw new Error(`${extensionContext}: Direction properties are not allowed on emitters attached to a scene`);
                        }

                        promises.push(this._loadEmitterAsync(`#/extensions/${this.name}/emitter/${emitter._index}`, emitter));
                    }

                    return Promise.all(promises).then(() => {});
                });
            });
        }

        protected _loadNodeAsync(context: string, node: ILoaderNode): Nullable<Promise<void>> { 
            return this._loadExtensionAsync<IEmittersReference>(context, node, (extensionContext, extension) => {
                return this._loader._loadNodeAsync(extensionContext, node).then(() => {
                    const promises = new Array<Promise<void>>();
                    for (const emitterIndex of extension.emitters) {
                        const emitter = GLTFLoader._GetProperty(extensionContext, this._emitters, emitterIndex);
                        promises.push(this._loadEmitterAsync(`#/extensions/${this.name}/emitter/${emitter._index}`, emitter, node._babylonMesh));
                    }

                    return Promise.all(promises).then(() => {});
                });
            });
        }

        protected _loadAnimationAsync(context: string, animation: ILoaderAnimation): Nullable<Promise<void>> { 
            return this._loadExtensionAsync<ILoaderAnimationEvents>(context, animation, (extensionContext, extension) => {
                return this._loader._loadAnimationAsync(extensionContext, animation).then(() => {
                    const promises = new Array<Promise<void>>();
                    let babylonAnimationGroup = animation._babylonAnimationGroup;

                    for (const event of extension.events) {
                        promises.push(this._loadAnimationEventAsync(`${context}/extension/${NAME}/events/${event._index}`, context, animation, event, babylonAnimationGroup!));
                    }
    
                    return Promise.all(promises).then(() => {
                        babylonAnimationGroup!.normalize();
                    });
                });
            });
        }

        private _loadAnimationEventAsync(context: string, animationContext: string, animation: ILoaderAnimation, event: ILoaderAnimationEvent, babylonAnimationGroup: AnimationGroup): Promise<void> {
            if (babylonAnimationGroup.targetedAnimations.length == 0) {
                return Promise.resolve();
            }
            const babylonAnimation = babylonAnimationGroup.targetedAnimations[0];
            const emitterIndex = event.target.emitter;
            const emitter = GLTFLoader._GetProperty(context, this._emitters, emitterIndex);
            const sound = emitter._babylonData!.sound;
            if (sound) {
                const action = event.action;
                const offset = event.offset;

                var babylonAnimationEvent = new AnimationEvent(event.time, () => {
                    if (action == AnimationEventAction.play) {
                        sound.play(offset);
                    } else if (action == AnimationEventAction.stop) {
                        sound.stop(offset);
                    }
                });
                babylonAnimation.animation.addEvent(babylonAnimationEvent);
            }
            return Promise.resolve();
        }

        private get _extension(): IMSFTAudioEmitter {
            const extensions = this._loader._gltf.extensions;
            if (!extensions || !extensions[this.name]) {
                throw new Error(`#/extensions: '${this.name}' not found`);
            }

            return extensions[this.name] as IMSFTAudioEmitter;
        }

        private get _clips(): Array<ILoaderClip> {
            return this._extension.clips;
        }

        private get _emitters(): Array<ILoaderEmitter> {
            return this._extension.emitters;
        }
    }

    GLTFLoader._Register(NAME, loader => new MSFT_audio_emitter(loader));
}