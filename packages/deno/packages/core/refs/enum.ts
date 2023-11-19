// @ts-nocheck
import { InputRef, inputShapeKey, OutputRef, outputShapeKey } from '../types/index.ts';
import BaseTypeRef from './base.ts';
export default class EnumRef<T, U = T> extends BaseTypeRef implements OutputRef, InputRef, PothosSchemaTypes.EnumRef<T, U> {
    override kind = "Enum" as const;
    $inferType!: T;
    $inferInput!: U;
    [outputShapeKey]!: T;
    [inputShapeKey]!: U;
    constructor(name: string) {
        super("Enum", name);
    }
}
