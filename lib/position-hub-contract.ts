import type {PositionDTO} from './price-meter-property-position-browser-contract'
export const positionHubTitle={en:'Property Price / m² Position',es:'Posición del precio por m² de una propiedad'}
export const positionHubQuestion={en:'Where does this property’s asking Price / m² sit within its defined reference population?',es:'¿Dónde se sitúa el precio de oferta por m² de esta propiedad dentro de su población de referencia definida?'}
export type PositionHubResponse = {access:'authentication_required'|'entitlement_required'} | {
 result:PositionDTO;
 fx:null|{rate:number;effectiveDate:string;source:string;resolutionMode:string};
}
