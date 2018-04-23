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
        path: string;
        transformKeys: Function;
        animationType: number;
    }

    interface _ILoaderPropertyAnimationTargets {
        targets: _ILoaderPropertyAnimationTarget[];
        inputAnimationType: number;
        objects: any[];
    }

    const Color4ToColor3KeyTransform = (inputKeys: Array<IAnimationKey>): Array<IAnimationKey> => {
        const outputKeys: Array<IAnimationKey> = [];
        for (const key of inputKeys) {
            outputKeys.push({
                interpolation: key.interpolation,
                frame: key.frame,
                value: new Color3(key.value.r, key.value.g, key.value.b),
                inTangent: key.inTangent ? new Color3(key.inTangent.r, key.inTangent.g, key.inTangent.b) : undefined,
                outTangent: key.outTangent ? new Color3(key.outTangent.r, key.outTangent.g, key.outTangent.b) : undefined,
            });
        }
        return outputKeys;
    }

    const Color4ToAlphaKeyTransform = (inputKeys: Array<IAnimationKey>): Array<IAnimationKey> => {
        const outputKeys: Array<IAnimationKey> = [];
        for (const key of inputKeys) {
            outputKeys.push({
                interpolation: key.interpolation,
                frame: key.frame,
                value: key.value.a,
                inTangent: key.inTangent ? key.inTangent.a : undefined,
                outTangent: key.outTangent ? key.outTangent.a : undefined,
            });
        }
        return outputKeys;
    }

    const NegateFloatKeyTransform = (inputKeys: Array<IAnimationKey>): Array<IAnimationKey> => {
        const outputKeys: Array<IAnimationKey> = [];
        for (const key of inputKeys) {
            outputKeys.push({
                interpolation: key.interpolation,
                frame: key.frame,
                value: -key.value,
                inTangent: key.inTangent ? -key.inTangent : undefined,
                outTangent: key.outTangent ? -key.outTangent : undefined,
            });
        }
        return outputKeys;
    }

    const IdempotentKeyTransform = (inputKeys: Array<IAnimationKey>): Array<IAnimationKey> => {
        return inputKeys;
    }

    const _PATH_PROPERTIES: any = {
        extensions: {
            KHR_lights: {
                lights: {
                    _isIndexed: true,
                    _getTarget: (loader: GLTFLoader, gltfContext: any): any[] | undefined => {
                        if (gltfContext) {
                            if (gltfContext.type === "ambient") {
                                return [loader._babylonScene];
                            }

                            return gltfContext._babylonData;
                        }
                        return undefined;
                    },
                    color: {
                        _inputAnimationType: Animation.ANIMATIONTYPE_COLOR3,
                        _getContextualTargets: (targetObjects: any): _ILoaderPropertyAnimationTarget[] => {
                            if (targetObjects.length == 1 && targetObjects[0] instanceof Scene) {
                                return [{
                                    transformKeys: IdempotentKeyTransform,
                                    animationType: Animation.ANIMATIONTYPE_COLOR3,
                                    path: 'ambientColor',
                                }];
                            } else {
                                return [{
                                    transformKeys: IdempotentKeyTransform,
                                    animationType: Animation.ANIMATIONTYPE_COLOR3,
                                    path: 'diffuse',
                                }];
                            }
                        }
                    },
                    intensity: {
                        _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                        _targetPath: 'intensity'
                    },
                    // innerConeAngle: {
                    //     _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                    //     _targetPath: 'innerConeAngle'
                    // },
                    outerConeAngle: {
                        _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                        _targetPath: 'angle'
                    }
                }
            },
            MSFT_audio_emitter: {
                emitters: {
                    _isIndexed: true,
                    _getTarget: (loader: GLTFLoader, gltfContext: any): any[] | undefined => {
                        if (gltfContext && gltfContext._babylonData) {
                            return [gltfContext._babylonData.sound];
                        }
                        return undefined;
                    },
                    volume: {
                        _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                        _targetPath: 'volume'
                    },
                    direction: {
                        _inputAnimationType: Animation.ANIMATIONTYPE_VECTOR3,
                        _targetPath: 'direction'
                    },
                    innerAngle: {
                        _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                        _targetPath: 'directionalConeInnerAngle'
                    },
                    outerAngle: {
                        _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                        _targetPath: 'directionalConeOuterAngle'
                    },
                }
            }

        },
        materials: {
            _isIndexed: true,
            _getTarget: (loader: GLTFLoader, gltfContext: any): any[] | undefined => {
                if (gltfContext && gltfContext._babylonData) {
                    const result = [];
                    for (const drawMode in gltfContext._babylonData) {
                        result.push(gltfContext._babylonData[drawMode].material);
                    }
                    return result;
                }
                return undefined;
            },
            pbrMetallicRoughness: {
                baseColorFactor: {
                    _inputAnimationType: Animation.ANIMATIONTYPE_COLOR4,
                    _targets: [{ 
                        transformKeys: Color4ToColor3KeyTransform,
                        animationType: Animation.ANIMATIONTYPE_COLOR3,
                        path: 'albedoColor',
                    }, {
                        transformKeys: Color4ToAlphaKeyTransform,
                        animationType: Animation.ANIMATIONTYPE_FLOAT,
                        path: 'alpha',
                    }]
                },
                metallicFactor: {
                    _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                    _targetPath: 'metallic'
                },
                roughnessFactor: {
                    _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                    _targetPath: 'roughness'
                }
            },
            alphaCutoff: {
                _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                _targetPath: 'alphaCutOff'
            },
            emissiveFactor: {
                _inputAnimationType: Animation.ANIMATIONTYPE_COLOR3,
                _targetPath: 'emissive'
            },
            normalTexture: {
                scale: {
                    _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                    _targetPath: 'bumpTexture.level'
                }
            },
            occlusionTexture: {
                strength: {
                    _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                    _targetPath: 'ambientTextureStrength'
                }
            },
            extensions: {
                KHR_materials_pbrSpecularGlossiness: {
                    diffuseFactor: {
                        _inputAnimationType: Animation.ANIMATIONTYPE_COLOR4,
                        _targets: [{ 
                            transformKeys: Color4ToColor3KeyTransform,
                            animationType: Animation.ANIMATIONTYPE_COLOR3,
                            path: 'albedoColor',
                        }, {
                            transformKeys: Color4ToAlphaKeyTransform,
                            animationType: Animation.ANIMATIONTYPE_FLOAT,
                            path: 'alpha',
                        }]
                    },
                    specularFactor: {
                        _inputAnimationType: Animation.ANIMATIONTYPE_COLOR3,
                        _targetPath: 'reflectivityColor'
                    },
                    glossinessFactor: {
                        _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                        _targetPath: 'microSurface'
                    }
                }
            }
        },
        nodes: {
            _isIndexed: true,
            _getTarget: (loader: GLTFLoader, gltfContext: any): any[] | undefined => {
                if (gltfContext) {
                    return gltfContext._babylonAnimationTargets;
                }
                return undefined;
            },
            translation: {
                _inputAnimationType: Animation.ANIMATIONTYPE_VECTOR3,
                _targetPath: 'position'
            },
            rotation: {
                _inputAnimationType: Animation.ANIMATIONTYPE_QUATERNION,
                _targetPath: 'rotationQuaternion'
            },
            scale: {
                _inputAnimationType: Animation.ANIMATIONTYPE_VECTOR3,
                _targetPath: 'scaling'
            },
        },
        cameras: {
            _isIndexed: true,
            _getTarget: (loader: GLTFLoader, gltfContext: any): any[] | undefined => {
                if (gltfContext) {
                    return [gltfContext._babylonData];
                }
                return undefined;
            },
            orthographic: {
                xmag: {
                    _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                    _targets: [{ 
                        transformKeys: NegateFloatKeyTransform,
                        animationType: Animation.ANIMATIONTYPE_FLOAT,
                        path: 'orthoLeft',
                    },
                    { 
                        transformKeys: IdempotentKeyTransform,
                        animationType: Animation.ANIMATIONTYPE_FLOAT,
                        path: 'orthoRight',
                    }]
                },
                ymag: {
                    _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                    _targets: [{ 
                        transformKeys: NegateFloatKeyTransform,
                        animationType: Animation.ANIMATIONTYPE_FLOAT,
                        path: 'orthoBottom',
                    },
                    { 
                        transformKeys: IdempotentKeyTransform,
                        animationType: Animation.ANIMATIONTYPE_FLOAT,
                        path: 'orthoTop',
                    }]
                },
                zfar: {
                    _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                    _targetPath: 'maxZ'
                },
                znear: {
                    _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                    _targetPath: 'minZ'
                }
            },
            perspective: {
                // aspectRatio: {
                //     _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                //     _targetPath: 'aspectRatio'
                // },
                yfov: {
                    _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                    _targetPath: 'fov'
                },
                zfar: {
                    _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                    _targetPath: 'maxZ'
                },
                znear: {
                    _inputAnimationType: Animation.ANIMATIONTYPE_FLOAT,
                    _targetPath: 'minZ'
                },
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
                const targets = this._getAnimationObjects(context, animationContext, channel.target);

                let outputBufferOffset = 0;
                let getNextOutputValue: () => number | Vector2 | Vector3 | Quaternion | Color3 | Color4;
                switch (targets.inputAnimationType) {
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
                            const value = Color4.FromArray(data.output, outputBufferOffset);
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

                if (targets.objects == undefined) {
                    return;
                }

                for (const target of targets.targets) {
                    const animationName = `${babylonAnimationGroup.name}_${NAME}_channel${babylonAnimationGroup.targetedAnimations.length}_${target.path}`;
                    const babylonAnimation = new Animation(animationName, target.path, 1, target.animationType);
                    babylonAnimation.setKeys(target.transformKeys(keys));

                    for (const targetObject of targets.objects) {
                        babylonAnimationGroup.addTargetedAnimation(babylonAnimation.clone(), targetObject);
                    }
                }
            });
        }

        private _getAnimationObjects(context: string, animationContext: string, target: string): _ILoaderPropertyAnimationTargets {
            const result: _ILoaderPropertyAnimationTargets = {
                targets: [],
                inputAnimationType: 0,
                objects: []
            };

            let pathPartNode = _PATH_PROPERTIES;
            const pathParts = target.split( '/' );
            let gltfContext: any = this._loader._gltf;
            for (let pathIndex = 0, pathPartsLength = pathParts.length; pathIndex < pathPartsLength; pathIndex ++) {
                let pathPart = pathParts[pathIndex];
                if (pathPart === '') {
                    continue;
                }

                pathPartNode = pathPartNode[pathPart];

                if (pathPartNode === undefined) {
                    throw new Error(`${context}: Invalid ${NAME} target path (${target})`);
                }

                if (gltfContext != undefined) {
                    gltfContext = gltfContext[pathPart];
                }

                if (pathPartNode._isIndexed) {
                    pathPart = pathParts[++pathIndex];
                    if (gltfContext != undefined) {
                        gltfContext = gltfContext[pathPart];
                    }

                    if (pathPartNode._getTarget !== undefined) {

                        result.objects = pathPartNode._getTarget(this._loader, gltfContext);
                        if (result.objects == undefined) {
                            throw new Error(`${context}: Invalid ${NAME} target path (${target})`);
                        }
                    }
                }

                if (pathPartNode._targetPath !== undefined) {
                    result.targets.push({
                        path: pathPartNode._targetPath,
                        transformKeys: IdempotentKeyTransform,
                        animationType: pathPartNode._inputAnimationType,
                    });
                }

                if (pathPartNode._getContextualTargets !== undefined) {
                    result.targets = result.targets.concat(pathPartNode._getContextualTargets(result.objects));
                }

                if (pathPartNode._targets !== undefined) {
                    result.targets = result.targets.concat(pathPartNode._targets);
                }

                if (pathPartNode._inputAnimationType !== undefined) {
                    result.inputAnimationType = pathPartNode._inputAnimationType;
                }
            }

            return result;
        }
    }

    GLTFLoader._Register(NAME, loader => new EXT_property_animation(loader));
}