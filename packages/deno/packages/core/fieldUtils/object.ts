// @ts-nocheck
import { SchemaTypes } from '../types/index.ts';
import FieldBuilder from './builder.ts';
export default class ObjectFieldBuilder<Types extends SchemaTypes, ParentShape> extends FieldBuilder<Types, ParentShape, "Object"> {
    constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>) {
        super(builder, "Object", "Object");
    }
}
