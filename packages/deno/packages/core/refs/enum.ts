// @ts-nocheck
import { InputRef, inputShapeKey, OutputRef, outputShapeKey, SchemaTypes } from '../types/index.ts';
import BaseTypeRef from './base.ts';
export default class EnumRef<Types extends SchemaTypes, T, U = T> extends BaseTypeRef<Types> implements OutputRef, InputRef, PothosSchemaTypes.EnumRef<Types, T, U> {
    override kind = "Enum" as const;
    [outputShapeKey]!: T;
    [inputShapeKey]!: U;
    constructor(name: string) {
        super("Enum", name);
    }
}
