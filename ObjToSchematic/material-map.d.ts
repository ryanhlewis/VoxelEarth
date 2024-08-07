import { MaterialMap, MaterialType } from './mesh';
import { TTransparencyTypes } from './texture';
export declare class MaterialMapManager {
    materials: MaterialMap;
    constructor(materials: MaterialMap);
    changeTransparencyType(materialName: string, newTransparencyType: TTransparencyTypes): void;
    /**
     * Convert a material to a new type, i.e. textured to solid.
     * Will return if the material is already the given type.
     */
    changeMaterialType(materialName: string, newMaterialType: MaterialType): void;
}
