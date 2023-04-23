// @ts-nocheck
import { inputShapeKey, InputTypeParam, SchemaTypes } from '../types/index.ts';
import BaseTypeRef from './base.ts';
export default class InputListRef<Types extends SchemaTypes, T> extends BaseTypeRef<Types> implements PothosSchemaTypes.InputListRef<Types, T> {
    override kind = "InputList" as const;
    [inputShapeKey]!: T;
    listType: InputTypeParam<Types>;
    required: boolean;
    constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>, listType: InputTypeParam<Types>, required: boolean) {
        super(builder, "InputList", `InputList<${String(listType)}>`);
        this.listType = listType;
        this.required = required;
    }
}
