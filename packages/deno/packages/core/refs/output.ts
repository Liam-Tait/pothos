// @ts-nocheck
import { outputShapeKey, parentShapeKey, SchemaTypes } from '../types/index.ts';
import BaseTypeRef from './base.ts';
export default class OutputTypeRef<Types extends SchemaTypes, T, P = T> extends BaseTypeRef<Types> {
    override kind;
    [outputShapeKey]!: T;
    [parentShapeKey]!: P;
    constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>, kind: "Enum" | "Interface" | "Object" | "Scalar" | "Union", name: string) {
        super(builder, kind, name);
        this.kind = kind;
    }
}
