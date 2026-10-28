import {requireNativeModule} from 'expo-modules-core';
const native=requireNativeModule('FormaSoundAnalysis');
export const analyzeAudioFile=(uri)=>native.analyzeAudioFile(uri);
