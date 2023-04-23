// @ts-nocheck
import { inputShapeKey, SchemaTypes } from '../types/index.ts';
import BaseTypeRef from './base.ts';
export default class InputTypeRef<Types extends SchemaTypes, T> extends BaseTypeRef<Types> {
    override kind;
    [inputShapeKey]!: T;
    constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>, kind: "Enum" | "InputObject" | "Scalar", name: string) {
        super(builder, kind, name);
        this.kind = kind;
    }
}
