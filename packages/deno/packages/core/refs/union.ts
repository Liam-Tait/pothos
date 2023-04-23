// @ts-nocheck
import type { PothosUnionTypeConfig, SchemaTypes } from '../types/index.ts';
import { OutputRef, outputShapeKey, parentShapeKey } from '../types/type-params.ts';
import BaseTypeRef from './base.ts';
export default class UnionRef<Types extends SchemaTypes, T, P = T> extends BaseTypeRef<Types, PothosUnionTypeConfig> implements OutputRef, PothosSchemaTypes.UnionRef<Types, T, P> {
    override kind = "Union" as const;
    [outputShapeKey]!: T;
    [parentShapeKey]!: P;
    constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>, name: string) {
        super(builder, "Union", name);
    }
}
