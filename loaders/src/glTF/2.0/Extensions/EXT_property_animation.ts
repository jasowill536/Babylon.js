/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    // https://github.com/najadojo/glTF/tree/EXT_property_animation/extensions/2.0/Vendor/EXT_property_animation

    const NAME = "EXT_property_animation";

    interface _IPropertyAnimationChannel {
        target: string;
        sampler: number;
    }

    interface _ILoaderPropertyAnimationChannel extends _IPropertyAnimationChannel, _IArrayItem {
    }

    interface _ILoaderPropertyAnimationChannels {
        channels: _ILoaderPropertyAnimationChannel[];
    }

    interface _ILoaderPropertyAnimationTarget {
        targetPath: string;
        animationType: number;
        object: any;
    }

    const PATH_PROPERTIES: any = {
        extensions: {
            KHR_lights: {
                lights: {
                    _isIndexed: true,
                    _getTarget: function (gltf: _ILoaderGLTF, index: number) {
                        for (const node of gltf.nodes!) {
                            if (node.extensions && node.extensions!.KHR_lights && node.extensions.KHR_LIGHTS!.light == index) {
                                let lights = node!._babylonMesh!.getChildren((childNode: Node) => { return childNode instanceof Light });
                                if (lights.length > 0) {
                                    return lights[0];
                                }
                            }
                        }
                        return undefined;
                    },
                    color: {
                        _typedKeyframeTrack: Animation.ANIMATIONTYPE_COLOR3,
                        _targetPath: 'diffuse'
                    },
                    intensity: {
                        _typedKeyframeTrack: Animation.ANIMATIONTYPE_FLOAT,
                        _targetPath: 'intensity'
                    },
                    // innerConeAngle: {
                    //     _typedKeyframeTrack: Animation.ANIMATIONTYPE_FLOAT,
                    //     _targetPath: 'innerConeAngle'
                    // },
                    outerConeAngle: {
                        _typedKeyframeTrack: Animation.ANIMATIONTYPE_FLOAT,
                        _targetPath: 'angle'
                    }
                }
            },
            MSFT_audio_emitter: {
                emitters: {
                    _isIndexed: true,
                    _getTarget: function (gltf: _ILoaderGLTF, index: number) {
                        if (gltf.extensions && 
                            gltf.extensions.MSFT_audio_emitter &&
                             gltf.extensions.MSFT_audio_emitter.emitters &&
                             gltf.extensions.MSFT_audio_emitter.emitters.length > index) {
                            return gltf.extensions.MSFT_audio_emitter.emitters[index]._babylonData.sound;
                        }
                        return undefined;
                    },
                    volume: {
                        _typedKeyframeTrack: Animation.ANIMATIONTYPE_FLOAT,
                        _targetPath: 'volume'
                    },
                    direction: {
                        _typedKeyframeTrack: Animation.ANIMATIONTYPE_VECTOR3,
                        _targetPath: 'direction'
                    },
                    innerAngle: {
                        _typedKeyframeTrack: Animation.ANIMATIONTYPE_FLOAT,
                        _targetPath: 'directionalConeInnerAngle'
                    },
                    outerAngle: {
                        _typedKeyframeTrack: Animation.ANIMATIONTYPE_FLOAT,
                        _targetPath: 'directionalConeOuterAngle'
                    },
                }
            }

        },
        materials: {
            _isIndexed: true,
            _getTarget: function (gltf: _ILoaderGLTF, index: number) {
                return GLTFLoader._GetProperty(`/materials`, gltf.materials, index)._babylonData![Material.TriangleFillMode].material;
            },
            pbrMetallicRoughness: {
                baseColorFactor: {
                    _animationType: Animation.ANIMATIONTYPE_COLOR4,
                    _targetPath: 'albedoColor'
                },
                metallicFactor: {
                    _animationType: Animation.ANIMATIONTYPE_FLOAT,
                    _targetPath: 'metallic'
                },
                roughnessFactor: {
                    _animationType: Animation.ANIMATIONTYPE_FLOAT,
                    _targetPath: 'roughness'
                }
            },
            emissiveFactor: {
                _animationType: Animation.ANIMATIONTYPE_COLOR3,
                _targetPath: 'emissive'
            }
        }
    }

    export class EXT_property_animation extends GLTFLoaderExtension {
        public readonly name = NAME;

        protected _loadAnimationAsync(context: string, animation: _ILoaderAnimation): Nullable<Promise<void>> { 
            return this._loadExtensionAsync<_ILoaderPropertyAnimationChannels>(context, animation, (extensionContext, extension) => {
                return this._loader._loadAnimationAsync(extensionContext, animation).then(() => {
                    _ArrayItem.Assign(extension.channels);
                    const promises = new Array<Promise<void>>();
                    let babylonAnimationGroup = animation._babylonAnimationGroup;

                    for (const channel of extension.channels) {
                        promises.push(this._loadAnimationChannelAsync(`${context}/extension/${NAME}/channels/${channel._index}`, context, animation, channel, babylonAnimationGroup!));
                    }
    
                    return Promise.all(promises).then(() => {
                        babylonAnimationGroup!.normalize();
                    });
                });
            });
        }

        private _loadAnimationChannelAsync(context: string, animationContext: string, animation: _ILoaderAnimation, channel: _IPropertyAnimationChannel, babylonAnimationGroup: AnimationGroup): Promise<void> {
            const sampler = GLTFLoader._GetProperty(`${context}/sampler`, animation.samplers, channel.sampler);
            return this._loader._loadAnimationSamplerAsync(`${animationContext}/samplers/${channel.sampler}`, sampler).then(data => {
                const target = this._getAnimationObject(context, animationContext, channel.target);

                let outputBufferOffset = 0;
                let getNextOutputValue: () => number | Vector2 | Vector3 | Quaternion | Color3;
                switch (target.animationType) {
                    case Animation.ANIMATIONTYPE_VECTOR2: {
                        getNextOutputValue = () => {
                            const value = Vector2.FromArray(data.output, outputBufferOffset);
                            outputBufferOffset += 3;
                            return value;
                        };
                        break;
                    }                    
                    case Animation.ANIMATIONTYPE_VECTOR3: {
                        getNextOutputValue = () => {
                            const value = Vector3.FromArray(data.output, outputBufferOffset);
                            outputBufferOffset += 3;
                            return value;
                        };
                        break;
                    }
                    case Animation.ANIMATIONTYPE_QUATERNION: {
                        getNextOutputValue = () => {
                            const value = Quaternion.FromArray(data.output, outputBufferOffset);
                            outputBufferOffset += 4;
                            return value;
                        };
                        break;
                    }
                    case Animation.ANIMATIONTYPE_COLOR3: {
                        getNextOutputValue = () => {
                            const value = Color3.FromArray(data.output, outputBufferOffset);
                            outputBufferOffset += 3;
                            return value;
                        };
                        break;
                    }
                    case Animation.ANIMATIONTYPE_COLOR4: {
                        getNextOutputValue = () => {
                            const value = Color3.FromArray(data.output, outputBufferOffset);
                            outputBufferOffset += 4;
                            return value;
                        };
                        break;
                    }
                    case Animation.ANIMATIONTYPE_FLOAT: {
                        getNextOutputValue = () => {
                            return data.output[outputBufferOffset++];
                        };
                        break;
                    }
                }

                let getNextKey: (frameIndex: number) => IAnimationKey;
                switch (data.interpolation) {
                    case AnimationSamplerInterpolation.STEP: {
                        getNextKey = frameIndex => ({
                            frame: data.input[frameIndex],
                            value: getNextOutputValue(),
                            interpolation: AnimationKeyInterpolation.STEP
                        });
                        break;
                    }
                    case AnimationSamplerInterpolation.LINEAR: {
                        getNextKey = frameIndex => ({
                            frame: data.input[frameIndex],
                            value: getNextOutputValue()
                        });
                        break;
                    }
                    case AnimationSamplerInterpolation.CUBICSPLINE: {
                        getNextKey = frameIndex => ({
                            frame: data.input[frameIndex],
                            inTangent: getNextOutputValue(),
                            value: getNextOutputValue(),
                            outTangent: getNextOutputValue()
                        });
                        break;
                    }
                }

                const keys = new Array(data.input.length);
                for (let frameIndex = 0; frameIndex < data.input.length; frameIndex++) {
                    keys[frameIndex] = getNextKey!(frameIndex);
                }

                const animationName = `${babylonAnimationGroup.name}_${NAME}_channel${babylonAnimationGroup.targetedAnimations.length}`;
                const babylonAnimation = new Animation(animationName, target.targetPath, 1, target.animationType == Animation.ANIMATIONTYPE_COLOR4 ? Animation.ANIMATIONTYPE_COLOR3 : target.animationType);
                babylonAnimation.setKeys(keys);

                if (target.object != undefined) {
                    babylonAnimationGroup.addTargetedAnimation(babylonAnimation, target.object);
                }

                if (target.animationType == Animation.ANIMATIONTYPE_COLOR4) {
                    outputBufferOffset = 3;
                    getNextOutputValue = () => {
                        const value = data.output[outputBufferOffset];
                        outputBufferOffset += 4;
                        return value;
                    };
                    const alphaKeys = new Array(data.input.length);
                    for (let frameIndex = 0; frameIndex < data.input.length; frameIndex++) {
                        alphaKeys[frameIndex] = getNextKey!(frameIndex);
                    }

                    const alphaAnimationName = `${babylonAnimationGroup.name}_${NAME}_channel${babylonAnimationGroup.targetedAnimations.length}_alpha`;
                    const alphaBabylonAnimation = new Animation(alphaAnimationName, 'alpha', 1, Animation.ANIMATIONTYPE_FLOAT);
                    alphaBabylonAnimation.setKeys(alphaKeys);
    
                    if (target.object != undefined) {
                        babylonAnimationGroup.addTargetedAnimation(alphaBabylonAnimation, target.object);
                    }
                }
            });
        }

        private _getAnimationObject(context: string, animationContext: string, target: string): _ILoaderPropertyAnimationTarget {
            let result: _ILoaderPropertyAnimationTarget = {
                targetPath: '',
                animationType: 0,
                object: null
            };

            let pathPartNode = PATH_PROPERTIES;
            let targetPaths: string[] = [];
            const pathParts = target.split( '/' );
            for (let pathIndex = 0, pathPartsLength = pathParts.length; pathIndex < pathPartsLength; pathIndex ++) {
                let pathPart = pathParts[ pathIndex ];
                if (pathPart === '') {
                    continue;
                }

                pathPartNode = pathPartNode[pathPart];

                if (pathPartNode === undefined) {
                    throw new Error(`${context}: Invalid ${NAME} target path (${target})`);
                }

                if (pathPartNode._isIndexed) {
                    pathPart = pathParts[++pathIndex];

                    if (pathPartNode._getTarget !== undefined) {

                        result.object = pathPartNode._getTarget( this._loader._gltf, pathPart );
                        if (result.object == undefined) {
                            throw new Error(`${context}: Invalid ${NAME} target path (${target})`);
                        }
                    }
                }

                if (pathPartNode._targetPath !== undefined) {
                    targetPaths.push( pathPartNode._targetPath );
                    //result.object = result.object[ pathPartNode._targetPath ];
                }

                if (pathPartNode._animationType !== undefined) {
                    result.animationType = pathPartNode._animationType;
                }
            }

            result.targetPath = targetPaths.join('.');
            return result;
        }
    }

    GLTFLoader._Register(NAME, loader => new EXT_property_animation(loader));
}