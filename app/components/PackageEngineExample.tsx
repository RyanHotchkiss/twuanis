'use client'
import ExampleViewer from './engine-examples/ExampleViewer'
import {exampleEngineForCapability} from './engine-examples/registry'
export default function PackageEngineExample({capability,name,language}:{capability:string;name:string;language:'en'|'es'}){const engine=exampleEngineForCapability(capability);return engine?<span data-package-engine={capability} data-example-engine={engine}><ExampleViewer engine={engine} engineName={name} language={language} textLink/></span>:<span>{name}</span>}
