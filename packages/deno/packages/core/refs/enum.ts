// @ts-nocheck
import { InputRef, inputShapeKey, OutputRef, outputShapeKey, PothosEnumTypeConfig, SchemaTypes, } from '../types/index.ts';
import BaseTypeRef from './base.ts';
export default class EnumRef<Types extends SchemaTypes, T, U = T> extends BaseTypeRef<Types, PothosEnumTypeConfig> implements OutputRef, InputRef, PothosSchemaTypes.EnumRef<Types, T, U> {
    override kind = "Enum" as const;
    [outputShapeKey]!: T;
    [inputShapeKey]!: U;
    constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>, name: string, config?: PothosEnumTypeConfig) {
        super(builder, "Enum", name, config);
    }
}
