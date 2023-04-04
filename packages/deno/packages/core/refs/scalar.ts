// @ts-nocheck
import { InputRef, inputShapeKey, OutputRef, outputShapeKey, parentShapeKey, SchemaTypes, } from '../types/index.ts';
import BaseTypeRef from './base.ts';
export default class ScalarRef<Types extends SchemaTypes, T, U, P = T> extends BaseTypeRef<Types> implements OutputRef, InputRef, PothosSchemaTypes.ScalarRef<Types, T, U, P> {
    override kind = "Scalar" as const;
    [outputShapeKey]!: T;
    [parentShapeKey]!: P;
    [inputShapeKey]!: U;
    constructor(name: string) {
        super("Scalar", name);
    }
}
