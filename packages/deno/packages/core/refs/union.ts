// @ts-nocheck
import { SchemaTypes } from '../types/index.ts';
import { OutputRef, outputShapeKey, parentShapeKey } from '../types/type-params.ts';
import BaseTypeRef from './base.ts';
export default class UnionRef<Types extends SchemaTypes, T, P = T> extends BaseTypeRef<Types> implements OutputRef, PothosSchemaTypes.UnionRef<Types, T, P> {
    override kind = "Union" as const;
    [outputShapeKey]!: T;
    [parentShapeKey]!: P;
    constructor(name: string) {
        super("Union", name);
    }
}
