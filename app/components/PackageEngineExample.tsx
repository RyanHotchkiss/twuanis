'use client'
import ExampleViewer from './engine-examples/ExampleViewer'
import {exampleEngineForCapability} from './engine-examples/registry'
export default function PackageEngineExample({capability,name,language,onOpenChange}:{capability:string;name:string;language:'en'|'es';onOpenChange?:(open:boolean)=>void}){const engine=exampleEngineForCapability(capability);return engine?<span data-package-engine={capability} data-example-engine={engine}><ExampleViewer engine={engine} engineName={name} language={language} textLink onOpenChange={onOpenChange}/></span>:<span>{name}</span>}
